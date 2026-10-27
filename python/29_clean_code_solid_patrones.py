r"""
============================================================================
TEMA 29: CLEAN CODE, PRINCIPIOS SOLID Y PATRONES DE DISEÑO PYTHÓNICOS
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: diseño desacoplado en Python)
----------------------------------------------------------------------------
El código profesional pasa el 90 % de su vida útil siendo leído, probado y
modificado. En Python, los principios **SOLID** y los patrones de diseño del
GoF (*Gang of Four*) no requieren la burocracia de clases vacías de otros
lenguajes gracias a las funciones de primera clase y a `typing.Protocol`:

1) **S — Single Responsibility Principle (SRP)**: cada módulo, clase o función
   debe tener una única razón de negocio para cambiar. Separar *cálculo de
   dominio*, *persistencia en BD* y *formateo/envío* permite probar las reglas
   de negocio en microsegundos sin levantar servidores.
2) **O — Open/Closed Principle (OCP)**: extender el comportamiento registrando
   una nueva función o clase en un diccionario/fábrica en lugar de abrir una
   función crítica para añadir un `elif` más.
3) **L — Liskov Substitution Principle (LSP)**: toda implementación de un
   contrato debe respetar sus precondiciones, postcondiciones y excepciones
   esperadas sin sorprender al llamador.
4) **I — Interface Segregation Principle (ISP)**: contratos pequeños con
   `typing.Protocol` (`LectorPedidos`, `Notificador`) en lugar de una interfaz
   gigante que obligue a los *fakes* de prueba a implementar 15 métodos vacíos.
5) **D — Dependency Inversion Principle (DIP)**: los servicios de aplicación
   reciben abstracciones (`Protocol` o `Callable`) en su `__init__`, nunca
   instancian clientes HTTP o motores SQL directamente adentro.
6) **Patrones pythónicos**:
   - **Strategy**: una simple función `Callable` o un `Protocol` de un método.
   - **Factory**: un `dict[str, type | Callable]` en vez de un `if/elif` eterno.
   - **Decorator / Middleware**: decoradores con `@wraps` o clases envolventes.
   - **Observer (Bus de eventos)**: `defaultdict(list)` de suscriptores tipados.
   - **Circuit Breaker**: protege llamadas a servicios externos caídos.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Pasarelas de pago, proveedores de correo/SMS o motores de almacenamiento
  (S3 vs disco local vs memoria en tests) intercambiables mediante `Protocol`.
- Desacoplar efectos secundarios tras una venta (emitir evento `PedidoPagado`
  para que facturación, inventario y fidelización reaccionen sin que el servicio
  de pagos los conozca).
- Proteger integraciones con APIs de terceros mediante *Circuit Breaker* y
  reintentos decorados para evitar caídas en cascada.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
from collections import defaultdict
from collections.abc import Callable
from typing import Protocol

# 1. Segregación e Inversión de Dependencias con Protocol (estructural, sin herencia)
class PasarelaCobro(Protocol):
    def cobrar(self, cliente_id: str, centavos: int) -> str: ...

# 2. Strategy como tipo función + Factory por diccionario (OCP)
type EstrategiaComision = Callable[[int], int]

COMISIONES: dict[str, EstrategiaComision] = {
    "ESTANDAR": lambda monto: round(monto * 0.03) + 50,
    "CORPORATIVO": lambda monto: round(monto * 0.01),
}

# 3. Observer / Bus de eventos ligero
class BusEventos:
    def __init__(self) -> None:
        self._oyentes: defaultdict[str, list[Callable[[object], None]]] = defaultdict(list)

    def suscribir(self, nombre_evento: str, fn: Callable[[object], None]) -> None:
        self._oyentes[nombre_evento].append(fn)

    def publicar(self, nombre_evento: str, evento: object) -> None:
        for fn in self._oyentes[nombre_evento]:
            fn(evento)

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un servicio de órdenes aplica DIP recibiendo una `PasarelaCobro`
(`Protocol`), calcula recargos con una estrategia inyectada, protege la pasarela
con un **Circuit Breaker** ante fallos consecutivos y publica el evento de éxito
en un **Bus de Eventos** (Observer).

from collections import defaultdict
from collections.abc import Callable
from dataclasses import dataclass
from typing import Protocol

@dataclass(frozen=True, slots=True)
class OrdenAprobada:
    orden_id: str
    total_centavos: int
    recibo: str

class PasarelaCobro(Protocol):
    def cobrar(self, orden_id: str, centavos: int) -> str: ...

class PasarelaConCircuitBreaker:
    """Patrón Proxy / Circuit Breaker que envuelve cualquier PasarelaCobro."""
    def __init__(self, delegada: PasarelaCobro, umbral_fallos: int = 2) -> None:
        self._delegada = delegada
        self._umbral = umbral_fallos
        self._fallos_seguidos = 0

    @property
    def circuito_abierto(self) -> bool:
        return self._fallos_seguidos >= self._umbral

    def cobrar(self, orden_id: str, centavos: int) -> str:
        if self.circuito_abierto:
            raise RuntimeError("CIRCUITO_ABIERTO: pasarela temporalmente suspendida")
        try:
            recibo = self._delegada.cobrar(orden_id, centavos)
            self._fallos_seguidos = 0
            return recibo
        except Exception:
            self._fallos_seguidos += 1
            raise

class PasarelaSimulada:
    def __init__(self) -> None:
        self.modo_fallo = False

    def cobrar(self, orden_id: str, centavos: int) -> str:
        if self.modo_fallo:
            raise ConnectionError("Timeout en banco adquirente")
        return f"REC-{orden_id}-{centavos}"

class ServicioCheckout:
    def __init__(
        self,
        pasarela: PasarelaCobro,
        calcular_comision: Callable[[int], int],
        publicar_evento: Callable[[OrdenAprobada], None],
    ) -> None:
        self._pasarela = pasarela
        self._calcular_comision = calcular_comision
        self._publicar = publicar_evento

    def procesar(self, orden_id: str, subtotal: int) -> OrdenAprobada:
        total = subtotal + self._calcular_comision(subtotal)
        recibo = self._pasarela.cobrar(orden_id, total)
        evento = OrdenAprobada(orden_id, total, recibo)
        self._publicar(evento)
        return evento

# Raíz de composición (cableado de dependencias)
auditoria: list[str] = []
pasarela_base = PasarelaSimulada()
pasarela_protegida = PasarelaConCircuitBreaker(pasarela_base, umbral_fallos=2)
checkout = ServicioCheckout(
    pasarela=pasarela_protegida,
    calcular_comision=lambda s: round(s * 0.02),
    publicar_evento=lambda ev: auditoria.append(f"Auditado {ev.orden_id}: {ev.recibo}"),
)

print("Compra 1:", checkout.procesar("ORD-1", 10_000))
pasarela_base.modo_fallo = True
for intento in ("ORD-2", "ORD-3", "ORD-4"):
    try:
        checkout.procesar(intento, 5_000)
    except Exception as err:
        print(f"Fallo en {intento} -> {type(err).__name__}: {err}")
print("Eventos en auditoría:", auditoria)

# Salida esperada:
# Compra 1: OrdenAprobada(orden_id='ORD-1', total_centavos=10200, recibo='REC-ORD-1-10200')
# Fallo en ORD-2 -> ConnectionError: Timeout en banco adquirente
# Fallo en ORD-3 -> ConnectionError: Timeout en banco adquirente
# Fallo en ORD-4 -> RuntimeError: CIRCUITO_ABIERTO: pasarela temporalmente suspendida
# Eventos en auditoría: ['Auditado ORD-1: REC-ORD-1-10200']

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- NO ESCRIBAS JAVA EN PYTHON: si una clase `CalculadoraDescuentoVip` solo tiene
  `__init__` vacío y un método `calcular(monto)`, reemplázala por una simple
  función `descuento_vip(monto: int) -> int`. En Python las funciones son objetos
  y cumplen perfectamente el patrón Strategy.
- EL ANTIPATRÓN SINGLETON CON METACLASES: rara vez necesitas un Singleton
  complejo en Python. Un objeto instanciado a nivel de módulo ya es único por
  proceso gracias a `sys.modules`; y mejor aún es inyectar la instancia desde
  la raíz de composición para no acoplar las pruebas a un estado global.
- EVITA EL "OBJETO DIOS" (*God Class*): clases llamadas `GestorSistema` o
  `Utilidades` con 40 métodos sin cohesión violan SRP y se vuelven imposibles
  de mantener. Divide por capacidad del dominio (`CalculadorImpuestos`,
  `GeneradorPdf`, `RepositorioFacturas`).
- REEMPLAZA LOS "NÚMEROS Y STRINGS MÁGICOS" por `enum.StrEnum` (Python 3.11+) o
  constantes `Final` con nombres que expliquen la regla de negocio
  (`DIAS_GRACIA_MORA = 5`, `EstadoOrden.PAGADA`).
- EN EL BUS DE EVENTOS (OBSERVER), AÍSLA LOS FALLOS SECUNDARIOS: si un oyente de
  analítica falla al enviar una métrica, decide explícitamente si debe abortar
  la operación principal o registrarse en el log y continuar.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Refactorización SRP: toma una función `cerrar_mes(ventas)` que filtra datos,
   calcula impuestos, formatea un reporte en texto y lo guarda en un archivo, y
   divídela en 4 funciones cohesivas donde las 3 primeras sean 100 % puras.
2. Erradicación de valores mágicos: reemplaza los códigos numéricos y strings
   sueltos (`1`, `2`, `"A"`, `0.19`) de un validador de envíos usando `StrEnum`,
   `IntEnum` y constantes con nombres de dominio.
3. Objetos de parámetro (*Parameter Object*): refactoriza una función con 8
   argumentos sueltos (`crear_poliza(nombre, edad, ciudad, monto, deducible, ...)`),
   agrupándolos en `@dataclass(frozen=True)` `SolicitudPoliza` y `CondicionesCobertura`.

[Intermedio]
4. Strategy + Factory sin `if/elif`: implementa un calculador de retención en la
   fuente por tipo de contrato (`LABORAL`, `HONORARIOS`, `SERVICIOS`) usando un
   registro `@registrar_estrategia("HONORARIOS")` con un decorador que llene el
   diccionario de la fábrica automáticamente.
5. Segregación de interfaces con `Protocol`: divide una clase `AlmacenamientoNube`
   pesada en tres protocolos pequeños (`SubidorArchivos`, `DescargadorArchivos`,
   `EliminadorArchivos`) y demuestra que un servicio de backups solo exige
   `SubidorArchivos`.
6. Patrón Adapter: tienes un cliente legado `SmsAntiguo.mandar_texto(numero_int,
   cuerpo_bytes)` y tu sistema espera el protocolo `Notificador.enviar(destino:
   str, mensaje: str) -> bool`. Escribe `AdaptadorSmsAntiguo` sin modificar la
   clase legada.
7. Patrón Decorator / Proxy sobre un repositorio: implementa `RepositorioConCache`
   que reciba cualquier `RepositorioProductos(Protocol)` y guarde en un `dict`
   las lecturas de `obtener_por_sku(sku)` invalidando la entrada cuando se llama
   a `guardar(producto)`.

[Senior / Producción]
8. Circuit Breaker completo con estado `HALF_OPEN`: amplía el `CircuitBreaker`
   del ejemplo con un reloj inyectable (`Callable[[], float]`) para que, tras
   `tiempo_recuperacion_seg`, pase a estado semi-abierto, permita una llamada de
   prueba y cierre el circuito si tiene éxito o lo reabra si falla.
9. Bus de eventos tipado por tipo de clase: implementa `BusEventosDominio` donde
   `suscribir(TipoEvento, manejador)` registre oyentes usando la clase del
   evento (`dataclass`) como clave y `publicar(evento)` invoque todos los
   manejadores de `type(evento)` aislando errores y devolviendo un reporte de
   ejecución.
10. Raíz de composición y arquitectura limpia testeable: ensambla un caso de uso
    `RenovarSuscripcionesVencidas` que dependa únicamente de los protocolos
    `Reloj`, `RepositorioSuscripciones`, `PasarelaCobro` y `Notificador`, y
    escribe una suite `unittest` con dobles en memoria (*fakes* y *spies*) sin
    usar `unittest.mock.patch`.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
