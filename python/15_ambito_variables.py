r"""
============================================================================
TEMA 15: ÁMBITO DE VARIABLES (REGLA LEGB), CLOSURES Y DECORADORES
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: espacios de nombres y celdas)
----------------------------------------------------------------------------
1) **La regla LEGB de resolución de nombres**: cuando referencias un nombre `x`,
   Python lo busca en cuatro ámbitos en orden estricto:
   - **L (Local)**: variables asignadas dentro de la función actual.
   - **E (Enclosing)**: variables locales de funciones externas que envuelven a
     la función actual (*closures*).
   - **G (Global)**: nombres definidos en el nivel superior del archivo (módulo).
   - **B (Built-in)**: nombres predefinidos del lenguaje (`len`, `print`, `int`,
     `ValueError` en el módulo `builtins`).
2) **El ámbito lo decide el compilador en tiempo de análisis léxico**: si dentro
   de una función hay una asignación `x = ...` en cualquier línea, el compilador
   marca `x` como **Local** en toda la función. Intentar leer `x` antes de esa
   línea lanza `UnboundLocalError` aunque exista una `x` global.
3) **`if`, `for`, `while`, `try` y `with` NO crean ámbito propio**: una variable
   creada dentro de un `if` o un `for` pertenece a la función (o módulo) donde
   está escrita. Solo las funciones, clases y comprensiones crean un ámbito.
4) **Closures y celdas (`__closure__`)**: cuando una función interna usa una
   variable del ámbito envolvente (`E`), CPython guarda esa variable en un
   objeto celda (`cell`) que sobrevive aunque la función externa ya haya
   terminado. `nonlocal x` permite reasignar esa celda desde la función interna;
   `global x` permite reasignar un nombre del módulo.
5) **Decoradores (`@decorador`)**: son azúcar sintáctico para `fn = decorador(fn)`.
   Envuelven una función con un closure para añadir medición de tiempo, control
   de permisos, caché o reintentos sin ensuciar la lógica de negocio. Usa
   siempre `@functools.wraps(fn)` para conservar `__name__` y `__doc__`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Decoradores transversales en APIs y servicios: `@requiere_rol("ADMIN")`,
  `@medir_tiempo`, `@reintentar(veces=3)`, `@transaccional`.
- Fábricas configurables con closures: `crear_validador_rango(minimo, maximo)`
  o `crear_formateador_moneda("COP")` sin necesidad de escribir una clase de un
  solo método.
- Encapsular estado privado (contadores de secuencia, limitadores de tasa) sin
  exponer variables globales mutables.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
from collections.abc import Callable
from functools import wraps
import time

# 1. Closure con estado mutable controlado mediante nonlocal
def crear_contador(inicio: int = 0) -> Callable[[], int]:
    actual = inicio
    def siguiente() -> int:
        nonlocal actual            # sin nonlocal, actual += 1 daría UnboundLocalError
        actual += 1
        return actual
    return siguiente

# 2. Decorador profesional preservando metadatos y tipos (Python 3.12+)
def medir_tiempo[**P, R](fn: Callable[P, R]) -> Callable[P, R]:
    @wraps(fn)                     # copia __name__, __doc__, __annotations__, __wrapped__
    def envoltura(*args: P.args, **kwargs: P.kwargs) -> R:
        inicio = time.perf_counter()
        try:
            return fn(*args, **kwargs)
        finally:
            duracion_ms = (time.perf_counter() - inicio) * 1000
            print(f"[METRICA] {fn.__name__} tardó {duracion_ms:.2f} ms")
    return envoltura

# 3. Decorador CON parámetros (3 niveles: fábrica -> decorador -> envoltura)
def requiere_permiso(permiso: str):
    def decorador[**P, R](fn: Callable[P, R]) -> Callable[P, R]:
        @wraps(fn)
        def envoltura(*args: P.args, **kwargs: P.kwargs) -> R:
            # valida el permiso antes de delegar en fn
            return fn(*args, **kwargs)
        return envoltura
    return decorador

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un sistema financiero protege operaciones críticas con un decorador
parametrizado `@auditar_y_autorizar(rol_minimo)` y utiliza un closure para
llevar la secuencia correlativa de folios sin variables globales.

from collections.abc import Callable
from functools import wraps

def crear_generador_folio(prefijo: str) -> Callable[[], str]:
    consecutivo = 0
    def emitir() -> str:
        nonlocal consecutivo
        consecutivo += 1
        return f"{prefijo}-{consecutivo:04d}"
    return emitir

def exigir_rol(rol_requerido: str):
    def decorador[**P, R](fn: Callable[P, R]) -> Callable[P, R]:
        @wraps(fn)
        def envoltura(*args: P.args, **kwargs: P.kwargs) -> R:
            rol_actual = kwargs.get("rol_usuario", "INVITADO")
            if rol_actual != rol_requerido:
                raise PermissionError(f"{fn.__name__} exige rol {rol_requerido} (recibido: {rol_actual})")
            return fn(*args, **kwargs)
        return envoltura
    return decorador

folio_pago = crear_generador_folio("PAG")

@exigir_rol("TESORERO")
def aprobar_transferencia(monto: int, *, rol_usuario: str) -> str:
    """Aprueba un desembolso bancario y asigna folio."""
    return f"Folio {folio_pago()}: aprobados ${monto:,}"

print(aprobar_transferencia(250_000, rol_usuario="TESORERO"))
print(aprobar_transferencia(90_000, rol_usuario="TESORERO"))
print("Metadatos intactos:", aprobar_transferencia.__name__, "|", aprobar_transferencia.__doc__)

try:
    aprobar_transferencia(1_000_000, rol_usuario="ANALISTA")
except PermissionError as err:
    print("Bloqueado:", err)

# Salida esperada:
# Folio PAG-0001: aprobados $250,000
# Folio PAG-0002: aprobados $90,000
# Metadatos intactos: aprobar_transferencia | Aprueba un desembolso bancario y asigna folio.
# Bloqueado: aprobar_transferencia exige rol TESORERO (recibido: ANALISTA)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- LA TRAMPA DEL ENLACE TARDÍO EN CLOSURES (*Late Binding*):
  `funciones = [lambda: i for i in range(3)]` hace que las tres funciones
  devuelvan `2`, porque el closure captura la **celda de la variable `i`**, no su
  valor en cada vuelta. Para fijar el valor actual usa un argumento por defecto:
  `[lambda i=i: i for i in range(3)]`.
- NO SOMBREE NOMBRES BUILT-IN (*Shadowing*): llamar a una variable `list = [...]`,
  `id = 5`, `str = "hola"` o `sum = 0` oculta la función built-in en ese ámbito
  y provoca `TypeError: 'list' object is not callable` líneas más abajo.
- EVITA `global` PARA COMPARTIR ESTADO MUTABLE: las variables globales mutables
  hacen que las funciones sean impuras, difíciles de probar en paralelo y
  propensas a condiciones de carrera. Pasa dependencias por parámetro o usa una
  clase/closure.
- USA SIEMPRE `@functools.wraps(fn)` EN TUS DECORADORES: sin `@wraps`, la
  función decorada pierde su `__name__`, su docstring y sus anotaciones de tipo,
  rompiendo herramientas como FastAPI, Sphinx, pytest y depuradores.
- RECUERDA QUE `except Error as e:` BORRA `e` AL SALIR DEL BLOQUE: a diferencia
  de un `for` o un `if`, Python elimina explícitamente la variable `e` del
  bloque `except` al terminar para evitar ciclos de referencias con el
  *traceback*.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Diagnóstico de `UnboundLocalError`: escribe un ejemplo donde una función lee
   una variable global `TASA = 0.19` y luego intenta reasignarla localmente;
   captura el error y muestra dos formas limpias de corregirlo sin usar `global`.
2. Fábrica de multiplicadores y rangos: implementa `crear_validador_longitud(
   min_len: int, max_len: int) -> Callable[[str], bool]` usando un closure e
   inspecciona el contenido de `validador.__closure__`.
3. Reparar closures en bucle: corrige una lista de 5 callbacks de botones
   creados en un bucle `for` que imprimían siempre el último índice.

[Intermedio]
4. Acumulador estadístico con `nonlocal`: implementa `crear_media_movil() ->
   Callable[[float], float]` que mantenga `suma` y `conteo` en variables
   envolventes y devuelva el promedio acumulado tras cada nuevo valor.
5. Decorador `@ejecutar_una_vez`: escribe un decorador que garantice que una
   función de inicialización solo se ejecute la primera vez y devuelva el
   resultado cacheado en llamadas siguientes, preservando `@wraps`.
6. Decorador `@validar_positivos`: crea un decorador que inspeccione todos los
   argumentos numéricos (`int | float`) pasados en `args` y `kwargs` y lance
   `ValueError` si alguno es menor o igual a cero.
7. Decorador parametrizado `@reintentar(veces=3, excepciones=(Exception,))`:
   reintenta la función decorada solo si lanza alguna de las excepciones
   indicadas y propaga el último error si se agotan los intentos.

[Senior / Producción]
8. Decorador de límite de tasa (*Rate Limiter* por función): implementa
   `@limitar_llamadas(max_llamadas: int, periodo_seg: float)` usando un closure
   con `collections.deque` y un reloj inyectable (`time.monotonic` por defecto)
   que lance `RuntimeError` al superar la cuota.
9. Apilamiento de decoradores (*Decorator Stacking*): combina `@medir_tiempo` y
   `@exigir_rol("ADMIN")` sobre una misma función, explica en qué orden se
   aplican de abajo hacia arriba y en qué orden se ejecutan al llamarla, y
   accede a la función original mediante `__wrapped__`.
10. Contexto de ejecución seguro sin variables globales (`contextvars.ContextVar`):
    reemplaza una variable global `USUARIO_ACTUAL` (insegura en código asíncrono
    o multihilo) por un `ContextVar[str]` para propagar el `request_id` y el
    usuario autenticado a través de varias funciones y decoradores de log.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
