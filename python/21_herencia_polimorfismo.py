r"""
============================================================================
TEMA 21: HERENCIA, MRO C3, SUPER(), ABC, PROTOCOL Y COMPOSICIÓN
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: búsqueda de atributos y MRO)
----------------------------------------------------------------------------
1) **Herencia = delegación de búsqueda**: `class Express(Terrestre):` no copia
   métodos. Cuando haces `obj.tarifa()`, CPython recorre `type(obj).__mro__`
   (Method Resolution Order) clase por clase hasta encontrar `tarifa` en algún
   `__dict__`. Si no aparece en ninguna (ni en `object`) -> `AttributeError`.
2) **Orden real de búsqueda**: primero los *descriptores de datos* de la clase
   (`property`, `__slots__`), luego el `__dict__` de la instancia, luego el
   resto de atributos de la clase (las funciones son descriptores sin datos
   que, al leerse desde la instancia, producen un *bound method* con `self`).
3) **Herencia múltiple y linealización C3**: Python permite `class C(A, B)`.
   El MRO se calcula con el algoritmo C3: respeta el orden de las bases y
   garantiza que cada clase aparezca antes que sus padres. Si no existe un
   orden consistente, la clase NI SIQUIERA se crea (`TypeError: Cannot create
   a consistent method resolution order`).
4) **`super()` NO significa "mi padre"**: significa "la SIGUIENTE clase en el
   MRO del objeto real". Por eso los *mixins* cooperativos funcionan: cada uno
   llama a `super()` y la cadena recorre todo el MRO. `super()` sin argumentos
   usa la celda oculta `__class__` que el compilador crea en cada método.
5) **Polimorfismo**: Python usa *duck typing* en tiempo de ejecución ("si tiene
   `.enviar()`, sirve"). Para hacer explícito el contrato existen:
   - `abc.ABC` + `@abstractmethod`: impide instanciar clases incompletas
     (herencia NOMINAL: hay que heredar de la base).
   - `typing.Protocol`: contrato ESTRUCTURAL; cualquier clase con los métodos
     adecuados lo cumple sin heredar (lo verifica mypy/pyright; en runtime
     solo con `@runtime_checkable` y únicamente comprueba nombres).
6) **`@typing.override` (3.12+)** marca métodos que sobrescriben a la base: si
   renombras el método base, el type checker avisa del "override huérfano".

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Pasarelas de pago, transportistas o proveedores de SMS intercambiables
  detrás de un `Protocol` (inyectados en el servicio, fáciles de simular).
- Jerarquías cortas de excepciones de dominio (`ErrorDominio` ->
  `SaldoInsuficiente`) para capturarlas por categoría.
- Frameworks: vistas basadas en clases de Django, `unittest.TestCase`,
  modelos de SQLAlchemy/Pydantic (heredas y sobrescribes ganchos).
- *Template Method*: la base define el algoritmo (`etiqueta()`), las
  subclases solo implementan el paso variable (`tarifa()`).
- Mixins de capacidades transversales (auditoría, caché, serialización).

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
from abc import ABC, abstractmethod
from typing import Protocol, override

class Notificador(Protocol):                    # contrato estructural
    def enviar(self, destino: str, mensaje: str) -> bool: ...

class NotificadorSms:                           # NO hereda de Notificador
    def enviar(self, destino: str, mensaje: str) -> bool:
        return True

def alertar(canal: Notificador) -> None:        # acepta cualquier "pato"
    canal.enviar("+57300...", "Pedido despachado")

class Empleado(ABC):                            # base abstracta (nominal)
    def __init__(self, nombre: str) -> None:
        self.nombre = nombre

    @abstractmethod
    def salario(self) -> float: ...

class Vendedor(Empleado):
    def __init__(self, nombre: str, base: float, comision: float) -> None:
        super().__init__(nombre)                # inicializa la parte base
        self.base, self.comision = base, comision

    @override
    def salario(self) -> float:
        return self.base + self.comision

isinstance(Vendedor("Ana", 2e6, 3e5), Empleado)  # True
issubclass(bool, int)                            # True (sí, bool hereda de int)
Vendedor.__mro__                                 # (Vendedor, Empleado, ABC, object)

class Plugin:                                    # registro automático
    registro: dict[str, type] = {}
    def __init_subclass__(cls, **kwargs) -> None:
        super().__init_subclass__(**kwargs)
        Plugin.registro[cls.__name__.lower()] = cls

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un operador logístico calcula tarifas de distintos tipos de envío
sin un solo `if tipo == ...`, y su repositorio combina mixins cooperativos.

from abc import ABC, abstractmethod

class Envio(ABC):
    def __init__(self, guia: str, peso_kg: float) -> None:
        self.guia = guia
        self.peso_kg = peso_kg

    @abstractmethod
    def tarifa(self) -> float: ...

    def etiqueta(self) -> str:                   # Template Method
        return f"{self.guia} [{type(self).__name__}] ${self.tarifa():,.2f}"

class EnvioTerrestre(Envio):
    def tarifa(self) -> float:
        return 5_000 + 1_200 * self.peso_kg

class EnvioExpress(EnvioTerrestre):
    def tarifa(self) -> float:
        return super().tarifa() * 1.5            # reutiliza y especializa

class EnvioInternacional(Envio):
    def __init__(self, guia: str, peso_kg: float, pais: str) -> None:
        super().__init__(guia, peso_kg)
        self.pais = pais

    def tarifa(self) -> float:
        return 40_000 + 9_500 * self.peso_kg

envios = [
    EnvioTerrestre("G-001", 2.5),
    EnvioExpress("G-002", 2),
    EnvioInternacional("G-003", 1.0, "CL"),
]
for envio in envios:
    print(envio.etiqueta())
print(f"Total: ${sum(e.tarifa() for e in envios):,.2f}")

try:
    Envio("G-000", 1)
except TypeError as error:
    print(error)

class Repositorio:
    def guardar(self) -> list[str]:
        return ["bd"]

class ConAuditoria:
    def guardar(self) -> list[str]:
        return ["auditoria", *super().guardar()]

class ConCache:
    def guardar(self) -> list[str]:
        return ["cache", *super().guardar()]

class RepositorioEnvios(ConAuditoria, ConCache, Repositorio):
    pass

print([clase.__name__ for clase in RepositorioEnvios.__mro__])
print(RepositorioEnvios().guardar())

# Salida esperada:
# G-001 [EnvioTerrestre] $8,000.00
# G-002 [EnvioExpress] $11,100.00
# G-003 [EnvioInternacional] $49,500.00
# Total: $68,600.00
# Can't instantiate abstract class Envio without an implementation for abstract method 'tarifa'
# ['RepositorioEnvios', 'ConAuditoria', 'ConCache', 'Repositorio', 'object']
# ['auditoria', 'cache', 'bd']

(Observa que `super()` dentro de `ConAuditoria` NO llama a `object`, sino a
`ConCache`: la siguiente clase en el MRO de `RepositorioEnvios`. El mensaje
del `TypeError` corresponde a Python 3.12+; versiones anteriores lo redactan
distinto.)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- OLVIDAR `super().__init__()` en la subclase: los atributos de la base nunca
  se crean y aparece `AttributeError` lejos de la causa real.
- LLAMAR `Base.metodo(self)` A MANO en herencia múltiple rompe la cadena
  cooperativa (una clase se ejecuta dos veces o ninguna). Usa `super()` y
  acepta `**kwargs` en los `__init__` cooperativos.
- COMPOSICIÓN SOBRE HERENCIA: "es un" -> herencia; "tiene un / usa un" ->
  composición. `class Pedido(PasarelaStripe)` es un error de diseño; inyecta
  `Pedido(pasarela: PasarelaPago)`. Evita jerarquías de más de 2-3 niveles.
- PRINCIPIO DE LISKOV: una subclase no debe exigir más ni devolver menos que
  la base (el clásico `Cuadrado(Rectangulo)` que rompe `set_ancho`).
- ATRIBUTOS DE CLASE MUTABLES (`items = []` en el cuerpo de la clase) se
  comparten entre TODAS las instancias y subclases; inicialízalos en
  `__init__` o usa `field(default_factory=list)` en dataclasses.
- `isinstance` EN CADENA (`if isinstance(x, A) ... elif isinstance(x, B)`)
  suele indicar polimorfismo mal aplicado: mueve el comportamiento al objeto
  (o usa `match`/`functools.singledispatch` si los tipos no son tuyos).
- `@runtime_checkable` SOLO VERIFICA QUE EXISTAN LOS NOMBRES, no firmas ni
  tipos: no lo uses como validación fuerte.
- `__name mangling`: `self.__saldo` se convierte en `_Cuenta__saldo`; evita
  colisiones en subclases, pero no es seguridad. Usa `_saldo` por convención.
- NO HEREDES DE `dict`/`list` para personalizarlos: sus métodos en C ignoran
  tus sobrescrituras (`update` no llama a tu `__setitem__`); usa
  `collections.UserDict` o composición.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Nómina: crea `Empleado` (ABC) con `salario()` abstracto y las subclases
   `EmpleadoFijo`, `EmpleadoPorHoras` y `Vendedor` (base + comisión usando
   `super()`); imprime la nómina recorriendo una lista mixta.
2. Inspección del MRO: define `A`, `B(A)`, `C(A)` y `D(B, C)`; imprime
   `D.__mro__` y explica por qué `A` aparece después de `C`. Luego intenta
   `class E(A, B)` y explica el `TypeError`.
3. Sobrescritura de `__str__` y `__repr__`: en una jerarquía `Producto` ->
   `ProductoPerecedero`, haz que el `repr` de la subclase reutilice el de la
   base con `super().__repr__()` añadiendo la fecha de vencimiento.

[Intermedio]
4. Protocolo de pagos: define `PasarelaPago(Protocol)` con `autorizar(monto)`
   y `reembolsar(id_tx)`; implementa `PasarelaFalsa` y `PasarelaTarjeta` sin
   herencia y escribe `procesar_compra(pasarela: PasarelaPago, monto)`.
   Verifica con mypy que una clase sin `reembolsar` es rechazada.
5. Template Method ETL: `ImportadorBase.ejecutar()` llama a `leer()`,
   `validar()` y `guardar()`; crea `ImportadorCsv` e `ImportadorJson` que solo
   implementen `leer()`.
6. Excepciones de dominio: diseña `ErrorBanco` -> `SaldoInsuficiente`,
   `CuentaBloqueada` con atributos propios (`cuenta`, `faltante`) y captura
   por categoría en un servicio de transferencias.
7. De herencia a composición: refactoriza `ReporteVentasPdfConEmail` en un
   `GeneradorReporte(formateador, enviador)` y añade un formato Excel sin
   modificar la clase.

[Senior / Producción]
8. Mixins cooperativos: implementa `ConMarcasTiempo`, `ConBorradoLogico` y
   `ConAuditoria` con `__init__(self, **kwargs)` y `super().__init__(**kwargs)`;
   combínalos en un modelo `Paciente` y demuestra el orden de ejecución.
9. Registro de plugins con `__init_subclass__`: cada subclase de
   `Exportador` se registra con un parámetro de clase
   (`class ExportadorXml(Exportador, formato="xml")`) y una fábrica
   `crear_exportador("xml")` la instancia sin `if`.
10. Polimorfismo sobre tipos ajenos: con `functools.singledispatch` crea
    `serializar(valor)` con implementaciones para `Decimal`, `datetime`,
    `date` y tus dataclasses; compara este enfoque con métodos polimórficos
    y con `match` estructural, y argumenta cuándo usar cada uno.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
