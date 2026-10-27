r"""
============================================================================
TEMA 14: FUNCIONES, PARÁMETROS (`/`, `*`, `*ARGS`, `**KWARGS`) Y TYPE HINTS
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: objetos de primera clase y firmas)
----------------------------------------------------------------------------
1) **Las funciones son objetos de primera clase (`function`)**: en Python `def`
   es una sentencia ejecutable que crea un objeto función en el heap y lo enlaza
   a un nombre. Puedes guardar funciones en diccionarios, pasarlas como
   argumentos (callbacks), devolverlas desde otras funciones e inspeccionar sus
   atributos (`__name__`, `__doc__`, `__defaults__`, `__annotations__`).
2) **Paso de argumentos por asignación de referencia (*call by sharing*)**:
   Python ni copia todo por valor ni pasa punteros a variables como `ref` en C#.
   El parámetro local recibe una **nueva referencia al mismo objeto**:
   - Si reasignas `param = otro_objeto`, solo cambias el nombre local.
   - Si mutas `param.append(x)` sobre un objeto mutable, el llamador ve el cambio.
3) **LA TRAMPA Nº 1 DE PYTHON (valores por defecto mutables)**: las expresiones
   por defecto (`def f(items=[])`) se evalúan **UNA SOLA VEZ** cuando se ejecuta
   el `def` (al importar el módulo), NO en cada llamada. Esa lista vive en
   `f.__defaults__` y se comparte entre todas las invocaciones. Usa siempre
   `None` como centinela: `def f(items: list[str] | None = None):`.
4) **Control fino de la firma (`/`, `*`, `*args`, `**kwargs`)**:
   - Antes de `/`: parámetros **solo posicionales** (el llamador no puede usar
     su nombre, lo que te permite renombrarlos sin romper código cliente).
   - Después de `*`: parámetros **solo por palabra clave (*keyword-only*)**,
     ideales para banderas booleanas y opciones de configuración.
   - `*args`: empaqueta argumentos posicionales sobrantes en una `tuple`.
   - `**kwargs`: empaqueta argumentos nombrados sobrantes en un `dict[str, Any]`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Diseño de APIs internas y librerías: obligar a que parámetros peligrosos o
  booleanos se pasen por nombre (`eliminar_usuario(id_usr, *, confirmar=True,
  borrado_fisico=False)`) evita el antipatrón *boolean trap* (`eliminar(42, True, False)`).
- Tablas de despacho (*dispatch tables*): reemplazar cadenas largas de `if/elif`
  por un `dict[str, Callable]` de funciones.
- Wrappers, adaptadores y middlewares que reenvían argumentos con `*args` y
  `**kwargs`.
- Contratos verificables en CI con `mypy --strict` o `pyright` usando
  `collections.abc.Callable` y sintaxis de tipos genéricos de Python 3.12+
  (`def primero[T](items: Sequence[T]) -> T:`).

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
from collections.abc import Callable, Sequence

# Firma completa: solo-posicionales (/), mixtos, *args, solo-keyword (*), **kwargs
def enviar_peticion(
    metodo: str,
    url: str,
    /,                                     # metodo y url son solo posicionales
    * reintentos_extra: int,                # tupla de posicionales adicionales
    timeout_seg: float = 5.0,              # después de *: obligatorio con nombre
    verificar_tls: bool = True,
    **cabeceras: str,                      # dict[str, str] con nombrados extra
) -> dict[str, object]:
    return {"metodo": metodo, "url": url, "timeout": timeout_seg, "headers": cabeceras}

# Valor por defecto mutable: patrón seguro con None
def agregar_etiqueta(etiqueta: str, destino: list[str] | None = None) -> list[str]:
    if destino is None:
        destino = []
    destino.append(etiqueta)
    return destino

# Función genérica (sintaxis PEP 695 de Python 3.12+) y Callable
def aplicar_a_todos[T, R](items: Sequence[T], transformador: Callable[[T], R]) -> list[R]:
    return [transformador(x) for x in items]

# Desempaquetado en la llamada con * y **
argumentos = ("GET", "https://api.interna/salud")
opciones = {"timeout_seg": 2.5, "Authorization": "Bearer xyz"}
respuesta = enviar_peticion(*argumentos, **opciones)

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un motor de cobros aplica políticas de descuento intercambiables
(funciones como objetos en un diccionario), exige parámetros *keyword-only* para
evitar errores al facturar y demuestra el peligro real de un defecto mutable.

from collections.abc import Callable

type PoliticaDescuento = Callable[[int], int]

POLITICAS: dict[str, PoliticaDescuento] = {
    "SIN_DESCUENTO": lambda subtotal: 0,
    "VIP_10": lambda subtotal: int(subtotal * 0.10),
    "TOPE_50K": lambda subtotal: min(int(subtotal * 0.20), 50_000),
}

def emitir_factura(
    cliente_id: str,
    subtotal: int,
    /,
    *,
    plan_descuento: str = "SIN_DESCUENTO",
    incluye_iva: bool = True,
    notas: list[str] | None = None,
) -> dict[str, object]:
     notas_seguras = list(notas) if notas is not None else []
    politica = POLITICAS.get(plan_descuento, POLITICAS["SIN_DESCUENTO"])
    descuento = politica(subtotal)
    base = subtotal - descuento
    impuesto = round(base * 0.19) if incluye_iva else 0
    notas_seguras.append(f"Plan aplicado: {plan_descuento}")
    return {
        "cliente": cliente_id,
        "total": base + impuesto,
        "notas": notas_seguras,
    }

f1 = emitir_factura("CLI-01", 300_000, plan_descuento="TOPE_50K")
f2 = emitir_factura("CLI-02", 100_000, incluye_iva=False)
print("Factura 1:", f1)
print("Factura 2:", f2)

# Demostración de la trampa del valor por defecto mutable:
def registrar_mal(evento: str, historial: list[str] = []) -> list[str]:
    historial.append(evento)
    return historial

print("Defecto mutable 1ª llamada:", registrar_mal("login"))
print("Defecto mutable 2ª llamada:", registrar_mal("compra"))

# Salida esperada:
# Factura 1: {'cliente': 'CLI-01', 'total': 297500, 'notas': ['Plan aplicado: TOPE_50K']}
# Factura 2: {'cliente': 'CLI-02', 'total': 100000, 'notas': ['Plan aplicado: SIN_DESCUENTO']}
# Defecto mutable 1ª llamada: ['login']
# Defecto mutable 2ª llamada: ['login', 'compra']

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- NUNCA USES LISTAS, DICCIONARIOS O CONJUNTOS COMO VALOR POR DEFECTO: usa `None`
  y crea el contenedor dentro del cuerpo de la función. Incluso una llamada como
  `def f(creado_en: datetime = datetime.now())` congela la hora del momento en
  que se importó el módulo.
- EVITA LA "TRAMPA BOOLEANA" (*Boolean Trap*): una llamada como
  `exportar_reporte(datos, True, False, True)` es ilegible. Coloca `*` antes de
  los flags para obligar a escribir `exportar_reporte(datos, incluir_totales=True,
  comprimir=False, enviar_correo=True)`.
- NO MUTAR ARGUMENTOS DE ENTRADA EN SILENCIO: si tu función recibe una `list`
  para calcular algo y hace `datos.sort()` o `datos.pop()`, alterará la lista
  del llamador provocando bugs difíciles de rastrear. Tipa el parámetro como
  `Sequence[T]` (solo lectura) y usa `sorted(datos)` para crear una copia.
- DEVOLVER SIEMPRE TIPOS CONSISTENTES: evita funciones que devuelven `dict` si
  les va bien, `False` si hay error y `None` si no hay datos. Devuelve `T | None`
  o lanza una excepción clara.
- USA `lambda` SOLO PARA EXPRESIONES CORTAS DE UNA LÍNEA (`key=lambda x: ...`):
  nunca asignes `f = lambda x: ...` (PEP 8 E731), porque su `__name__` en los
  *tracebacks* aparece como `<lambda>` en lugar de un nombre descriptivo.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Firma con `/` y `*`: escribe `calcular_envio(peso_kg: float, distancia_km:
   float, /, *, express: bool = False, asegurado: bool = False) -> float` y
   comprueba qué ocurre al intentar pasar `peso_kg` por nombre o `express` por
   posición.
2. Reparar el defecto mutable: corrige tres funciones con bugs de estado
   compartido (`agregar_item(x, carrito=[])`, `registrar_intento(usuario,
   mapa={})` y `evento_actual(ts=time.time())`) y verifícalo con `assert`.
3. Estadísticas con `*args`: implementa `resumen_ventas(*montos: float,
   moneda: str = "USD") -> dict[str, float | str]` que acepte cualquier cantidad
   de montos posicionales y valide que se pase al menos uno.

[Intermedio]
4. Tabla de despacho de comandos: reemplaza una calculadora con `if/elif` por
   un diccionario `OPERACIONES: dict[str, Callable[[float, float], float]]` y
   una función `ejecutar(op: str, a: float, b: float) -> float`.
5. Constructor de consultas SQL parametrizadas con `**filtros`: implementa
   `construir_select(tabla: str, /, *, limite: int = 50, **filtros: object) ->
   tuple[str, list[object]]` que devuelva `("SELECT * FROM clientes WHERE pais = ? AND activo = ? LIMIT ?", ["CO", True, 50])`.
6. Función de orden superior tipada: escribe `reintentar[T](operacion:
   Callable[[], T], *, max_intentos: int = 3) -> T` usando la sintaxis genérica
   de Python 3.12+.
7. Validador componible: diseña funciones validadoras `Callable[[str], str | None]`
   (`no_vacio`, `longitud_minima(n)`, `contiene_arroba`) y una función
   `validar_campo(valor: str, *reglas: Callable[[str], str | None]) -> list[str]`
   que devuelva todos los errores encontrados.

[Senior / Producción]
8. Envoltorio de auditoría transparente: escribe una función `ejecutar_auditado[**P, R](
   fn: Callable[P, R], *args: P.args, **kwargs: P.kwargs) -> R` (usando
   `ParamSpec` / sintaxis 3.12 `[**P, R]`) que registre nombre de función,
   argumentos y duración sin perder el tipado exacto de los parámetros.
9. Inmutabilidad defensiva en la frontera: implementa `procesar_lote(pedidos:
   Sequence[dict[str, int]]) -> list[dict[str, int]]` demostrando que el tipo
   `Sequence` impide llamar a `.append()` o `.pop()` dentro de la función en el
   verificador de tipos, y devuelve nuevos diccionarios sin mutar los originales.
10. Inspector de firmas en tiempo de ejecución (`inspect.signature`): construye
    un invocador de plugins `llamar_con_contexto(fn: Callable[..., object],
    contextoDisponible: dict[str, object])` que inspeccione qué parámetros pide
    `fn` y le inyecte únicamente las claves de `contextoDisponible` que coincidan
    (similar al sistema de dependencias de FastAPI/pytest).
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
