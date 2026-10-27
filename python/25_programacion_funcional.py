r"""
============================================================================
TEMA 25: PROGRAMACIÓN FUNCIONAL, INMUTABILIDAD, `PARTIAL` Y COMPOSICIÓN
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: datos inmutables + funciones puras)
----------------------------------------------------------------------------
1) **Funciones puras y transparencia referencial**: una función es pura si:
   - Para los mismos argumentos devuelve SIEMPRE el mismo resultado (no depende
     de variables globales, relojes ni aleatoriedad oculta).
   - No tiene efectos secundarios (*side effects*): no muta los argumentos que
     recibe, no escribe en disco/red ni altera estado externo.
   Las funciones puras se pueden probar sin *mocks*, ejecutar en paralelo sin
   *locks* y cachear con `@functools.cache`.
2) **Transformación sin mutación (`dataclasses.replace`)**: en lugar de cambiar
   `pedido.estado = "PAGADO"` in-place, el estilo funcional modela los datos con
   `@dataclass(frozen=True)` o `NamedTuple` y produce una **nueva instancia**
   con `replace(pedido, estado="PAGADO")`.
3) **Comprensiones/generadores vs `map`, `filter` y `reduce`**:
   - En Python idiomático, `[f(x) for x in datos if cond(x)]` o la expresión
     generadora `(f(x) for x in datos if cond(x))` suelen ser más legibles que
     combinar `map(lambda ...)` y `filter(lambda ...)`.
   - `map(fn, it)` y `filter(fn, it)` devuelven **iteradores perezosos** y
     brillan cuando ya tienes una función con nombre (`map(str.strip, lineas)`).
   - Para agregaciones, prefiere los builtins especializados (`sum`, `min`,
     `max`, `any`, `all`) antes de acudir a `functools.reduce`.
4) **Herramientas funcionales de la biblioteca estándar (`functools` y `operator`)**:
   - `functools.partial(fn, arg_fijo=valor)`: aplica parcialmente argumentos
     para especializar una función general sin escribir un `lambda`.
   - Módulo `operator` (`itemgetter`, `attrgetter`, `methodcaller`, `add`, `mul`):
     funciones en C más rápidas y expresivas que `lambda x: x["clave"]`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Pipelines de datos y ETL: encadenar etapas puras y perezosas (`limpiar ->
  validar -> enriquecer -> agrupar`) sobre flujos de eventos o archivos grandes.
- Motores de reglas de precios, impuestos y comisiones compuestos a partir de
  funciones pequeñas reutilizables (`partial`).
- Gestión de estado predecible y auditable (patrón *Event Sourcing* o *Reducer*:
  `nuevo_estado = aplicar_evento(estado_actual, evento)`).
- Ordenamiento y agrupación declarativa de colecciones con `operator.attrgetter`
  e `itemgetter`.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
from collections.abc import Callable, Iterable
from dataclasses import dataclass, replace
from functools import partial, reduce
from operator import attrgetter, itemgetter, mul

# 1. Inmutabilidad y actualización funcional con dataclasses.replace
@dataclass(frozen=True, slots=True)
class Suscripcion:
    cliente: str
    plan: str
    precio_mensual: int

sub_inicial = Suscripcion("Ana", "BASICO", 15)
sub_mejorada = replace(sub_inicial, plan="PRO", precio_mensual=39) # sub_inicial no cambia

# 2. Aplicación parcial con functools.partial
def aplicar_impuesto(monto: float, *, tasa: float, redondeo: int = 2) -> float:
    return round(monto * (1 + tasa), redondeo)

iva_colombia = partial(aplicar_impuesto, tasa=0.19)
iva_espana = partial(aplicar_impuesto, tasa=0.21)
total_co = iva_colombia(100.0)                     # 119.0

# 3. operator.itemgetter y attrgetter (más rápidos y claros que lambda)
ordenadas = sorted([sub_mejorada, sub_inicial], key=attrgetter("precio_mensual"))
obtener_sku_y_total = itemgetter("sku", "total")   # extrae tupla (d['sku'], d['total'])

# 4. Composición de funciones de una variable: tubería de izquierda a derecha
def componer_tuberia[T](*funciones: Callable[[T], T]) -> Callable[[T], T]:
    def ejecutar(valor_inicial: T) -> T:
        return reduce(lambda acc, fn: fn(acc), funciones, valor_inicial)
    return ejecutar

# 5. map y filter perezosos con funciones existentes
limpios: Iterable[str] = filter(None, map(str.strip, ["  hola ", "   ", "mundo\n"]))

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un motor de liquidación de carrito de compras procesa líneas
inmutables aplicando una tubería (*pipeline*) de transformaciones puras
configuradas con `functools.partial`, sin mutar ningún objeto de entrada.

from collections.abc import Callable
from dataclasses import dataclass, replace
from functools import partial, reduce
from operator import attrgetter

@dataclass(frozen=True, slots=True)
class ItemCarrito:
    sku: str
    categoria: str
    subtotal_centavos: int

type PasoPrecio = Callable[[ItemCarrito], ItemCarrito]

def descontar_categoria(item: ItemCarrito, *, categoria: str, porcentaje: int) -> ItemCarrito:
    if item.categoria != categoria:
        return item
    nuevo = round(item.subtotal_centavos * (100 - porcentaje) / 100)
    return replace(item, subtotal_centavos=nuevo)

def recargo_impuesto(item: ItemCarrito, *, puntos_basicos: int) -> ItemCarrito:
    nuevo = round(item.subtotal_centavos * (10_000 + puntos_basicos) / 10_000)
    return replace(item, subtotal_centavos=nuevo)

def construir_pipeline(*pasos: PasoPrecio) -> PasoPrecio:
    return lambda item: reduce(lambda actual, paso: paso(actual), pasos, item)

# Configuramos la tubería declarativamente con partial
liquidar_item = construir_pipeline(
    partial(descontar_categoria, categoria="LIBROS", porcentaje=10),
    partial(descontar_categoria, categoria="TECH", porcentaje=15),
    partial(recargo_impuesto, puntos_basicos=1900),  # +19% IVA
)

carrito_original = (
    ItemCarrito("LIB-01", "LIBROS", 10_000),
    ItemCarrito("LAP-09", "TECH", 200_000),
    ItemCarrito("CAF-02", "HOGAR", 5_000),
)

carrito_liquidado = tuple(map(liquidar_item, carrito_original))
ordenado_mayor = sorted(carrito_liquidado, key=attrgetter("subtotal_centavos"), reverse=True)

for item in ordenado_mayor:
    print(f"{item.sku} ({item.categoria}): {item.subtotal_centavos} centavos")
print("Total liquidado:", sum(i.subtotal_centavos for i in carrito_liquidado))
print("Original intacto:", carrito_original[0].subtotal_centavos == 10_000)

# Salida esperada:
# LAP-09 (TECH): 202300 centavos
# LIB-01 (LIBROS): 10710 centavos
# CAF-02 (HOGAR): 5950 centavos
# Total liquidado: 218960
# Original intacto: True

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- `map` Y `filter` DEVUELVEN ITERADORES DE UN SOLO USO: si guardas `r = map(f, datos)`
  y haces `list(r)` dos veces, la segunda lista estará vacía. Materializa en
  `tuple(...)` o `list(...)` si necesitas recorrer el resultado más de una vez.
- NO ABUSES DE `reduce` PARA SUMAR O CONCATENAR:
  - En vez de `reduce(operator.add, numeros, 0)`, usa `sum(numeros)`.
  - En vez de `reduce(operator.add, cadenas, "")`, usa `"".join(cadenas)`.
  - En vez de `reduce(operator.and_, booleanos, True)`, usa `all(booleanos)`.
- PYTHON NO TIENE OPTIMIZACIÓN DE LLAMADA DE COLA (*Tail Call Optimization*):
  a diferencia de Haskell o Scheme, en Python no debes reemplazar bucles por
  recursión funcional para recorrer listas largas porque alcanzarás el
  `RecursionError` (~1000 niveles). Usa generadores, comprensiones e `itertools`.
- CUIDADO CON LAS FUNCIONES "CASI PURAS": una función que lee `datetime.now()`
  o `os.environ` adentro parece pura por su firma, pero cambia su resultado
  según cuándo o dónde se corra. Recibe `ahora: datetime` como parámetro
  (con valor por defecto `None` resuelto al inicio si quieres comodidad).
- `@dataclass(frozen=True)` ES INMUTABILIDAD SUPERFICIAL: si uno de sus campos
  es una `list` o un `dict`, aún se puede mutar por dentro. Usa `tuple` y
  `types.MappingProxyType` para los campos de tus modelos inmutables.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. De impura a pura: toma una función que modifica una lista global `carrito` y
   le aplica un descuento leyendo una variable global, y reescríbela como función
   100 % pura que reciba tuplas y devuelva una tupla nueva.
2. Especialización con `functools.partial`: a partir de `formatear_moneda(monto:
   float, *, simbolo: str, decimales: int, separador_miles: str) -> str`, crea
   con `partial` las funciones `formato_usd`, `formato_cop` y `formato_eur`.
3. `map` y `filter` vs comprensiones: resuelve el mismo problema (limpiar una
   lista de strings numéricos, descartar los negativos y elevarlos al cuadrado)
   con `map`/`filter` y con una comprensión de lista; compara su legibilidad.

[Intermedio]
4. Consultas con `operator`: dada una lista de diccionarios de ventas, ordénala
   por `("region", "vendedor")` usando `itemgetter("region", "vendedor")` y
   extrae solo la tupla `(id_venta, monto)` de cada fila sin escribir `lambda`.
5. Compositor `pipe` variádico: implementa `pipe(valor_inicial, *funciones)` que
   pase el resultado de cada función a la siguiente e incluye un ejemplo de
   normalización de texto en 5 pasos.
6. Agrupación inmutable (`group_by` puro): escribe `agrupar_por[T, K](items:
   Iterable[T], clave: Callable[[T], K]) -> dict[K, tuple[T, ...]]` donde cada
   grupo quede congelado como tupla inmutable.
7. `reduce` con estado inmutable (patrón *Reducer*): modela una cuenta bancaria
   con `@dataclass(frozen=True)` `EstadoCuenta(saldo: int, movimientos: tuple[int, ...])`
   y usa `functools.reduce` para aplicar una secuencia de eventos y obtener el
   estado final sin ninguna mutación.

[Senior / Producción]
8. Pipeline perezoso de análisis de logs: usando únicamente generadores, `map`,
   `filter` e `itertools.islice`, procesa un flujo infinito simulado de eventos
   HTTP para extraer los primeros 10 errores `5xx` de un servicio específico en
   memoria constante $O(1)$.
9. Contenedor funcional `Resultado[T, E]` (*Railway Oriented Programming*):
   implementa las clases inmutables `Exito[T]` y `Fallo[E]` con un método
   `.encadenar(fn: Callable[[T], Resultado[U, E]]) -> Resultado[U, E]` (*flatMap* /
   *bind*) que cortocircuite automáticamente al primer error sin lanzar excepciones.
10. Motor de reglas declarativo con combinadores booleanos: construye funciones
    de orden superior `todas(*predicados)`, `alguna(*predicados)` y `no(predicado)`
    que combinen predicados `Callable[[T], bool]`, y úsalas para armar una
    política de aprobación de crédito compleja y 100 % testeable.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
