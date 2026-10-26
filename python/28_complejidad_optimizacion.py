r"""
============================================================================
TEMA 28: COMPLEJIDAD ALGORÍTMICA (BIG-O), MEDICIÓN Y OPTIMIZACIÓN EN PYTHON
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: el costo real de cada estructura)
----------------------------------------------------------------------------
1) **Big-O mide cómo crece el costo con el tamaño `n`**, no los segundos:
   O(1) constante, O(log n) búsqueda binaria, O(n) un recorrido, O(n log n)
   ordenar, O(n²) bucles anidados. Con 1 millón de registros, O(n²) son 10¹²
   operaciones: horas. O(n) es un instante.
2) **Costos reales de CPython** (medios / amortizados):
   - `list` es un arreglo dinámico de punteros: índice `l[i]` O(1),
     `append`/`pop()` O(1) amortizado, pero `insert(0, x)`, `pop(0)`, `x in l`
     y `l.remove(x)` son O(n).
   - `dict` y `set` son tablas hash: `in`, inserción y borrado O(1) promedio
     (O(n) en el peor caso con colisiones). Los dict conservan el orden de
     inserción desde 3.7.
   - `collections.deque`: `append`/`popleft` O(1) en ambos extremos (colas).
   - `heapq`: `heappush`/`heappop` O(log n) (prioridades, top-k).
   - `bisect`: búsqueda en lista ordenada O(log n) (la inserción sigue O(n)).
   - `sorted()`/`list.sort()`: Timsort, O(n log n), estable, O(n) si ya casi
     ordenado.
   - `str` es inmutable: `s += x` en un bucle puede volverse O(n²); usa
     `"".join(partes)`.
3) **Medir antes de optimizar**: la intuición falla. `timeit` mide fragmentos
   pequeños repitiéndolos (desactiva el GC durante la medición);
   `cProfile` + `pstats` muestran qué funciones consumen el tiempo;
   `tracemalloc` mide memoria.
4) **Memoización**: `functools.lru_cache(maxsize=N)` y `functools.cache`
   (3.9+, sin límite) guardan resultados de funciones puras en un dict
   indexado por los argumentos (deben ser hashables). Convierten recursiones
   exponenciales en lineales a cambio de memoria.
5) **Python puro vs C**: los builtins (`sum`, `min`, `sorted`, `set`, `map`)
   y las comprensiones ejecutan su bucle en C y suelen ganar a un `for`
   manual. Python 3.11+ (intérprete adaptativo, PEP 659) es 10–60 % más rápido
   que 3.10 sin tocar tu código.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Endpoints lentos: un `if usuario in lista_bloqueados` con 200 000 elementos
  en cada petición se arregla convirtiendo la lista en `set`.
- Conciliaciones y deduplicación de clientes, facturas o transacciones.
- Cachés de tasas de cambio, permisos o configuraciones (LRU en memoria).
- Reportes que tardan horas por consultas N+1 o bucles anidados.
- Revisiones de código y entrevistas técnicas: justificar la complejidad.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
import cProfile, pstats, timeit
from bisect import bisect_left
from collections import deque, OrderedDict
from functools import cache, lru_cache
import heapq

timeit.timeit("x in datos", setup="datos = list(range(10_000)); x = 9_999",
              number=1_000)                       # segundos totales
timeit.repeat("sorted(d)", setup="d = list(range(1000))[::-1]",
              repeat=5, number=100)               # toma el mínimo
# En terminal:  python -m timeit -s "d = set(range(10_000))" "9_999 in d"

with cProfile.Profile() as perfil:                # 3.8+
    generar_reporte()
pstats.Stats(perfil).sort_stats("cumulative").print_stats(10)
# En terminal:  python -m cProfile -s cumtime app.py

@lru_cache(maxsize=1024)
def tarifa(origen: str, destino: str) -> int: ...
tarifa.cache_info(); tarifa.cache_clear()

cola = deque(maxlen=100)                    # últimos 100 eventos, O(1)
top3 = heapq.nlargest(3, ventas, key=lambda v: v.total)   # O(n log k)
indice = bisect_left(fechas_ordenadas, fecha)              # O(log n)
contador = {}                               # O(n): una pasada con dict
for sku in pedidos:
    contador[sku] = contador.get(sku, 0) + 1

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un SaaS de email marketing debe detectar correos duplicados antes
de una campaña, cachear tasas de cambio de su API de facturación con una LRU
propia y acelerar un cálculo recursivo con memoización. En lugar de tiempos
(que varían por máquina) contamos operaciones, lo que muestra el Big-O.

from collections import OrderedDict
from functools import cache

def duplicados_cuadratico(correos: list[str]) -> tuple[set[str], int]:
    repetidos, comparaciones = set(), 0
    for i in range(len(correos)):
        for j in range(i + 1, len(correos)):
            comparaciones += 1
            if correos[i] == correos[j]:
                repetidos.add(correos[i])
    return repetidos, comparaciones

def duplicados_lineal(correos: list[str]) -> tuple[set[str], int]:
    vistos, repetidos, operaciones = set(), set(), 0
    for correo in correos:
        operaciones += 1
        if correo in vistos:              # O(1) promedio: tabla hash
            repetidos.add(correo)
        else:
            vistos.add(correo)
    return repetidos, operaciones

class CacheLRU:
    def __init__(self, capacidad: int) -> None:
        self.capacidad = capacidad
        self._datos: OrderedDict[str, float] = OrderedDict()

    def obtener(self, clave: str) -> float | None:
        if clave not in self._datos:
            return None
        self._datos.move_to_end(clave)    # O(1): pasa a "más reciente"
        return self._datos[clave]

    def guardar(self, clave: str, valor: float) -> None:
        self._datos[clave] = valor
        self._datos.move_to_end(clave)
        if len(self._datos) > self.capacidad:
            self._datos.popitem(last=False)   # O(1): expulsa el menos usado

@cache
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)

correos = [f"user{i % 1500}@saas.io" for i in range(2000)]
rep_a, ops_a = duplicados_cuadratico(correos)
rep_b, ops_b = duplicados_lineal(correos)
print(f"O(n²): {len(rep_a)} duplicados con {ops_a:,} comparaciones")
print(f"O(n):  {len(rep_b)} duplicados con {ops_b:,} operaciones")

tasas = CacheLRU(capacidad=2)
tasas.guardar("USD", 4000.0)
tasas.guardar("EUR", 4350.0)
tasas.obtener("USD")                      # USD pasa a ser el más reciente
tasas.guardar("GBP", 5100.0)              # expulsa EUR
print(list(tasas._datos), tasas.obtener("EUR"))

print(fib(80))
print(fib.cache_info())

# Salida esperada:
# O(n²): 500 duplicados con 1,999,000 comparaciones
# O(n):  500 duplicados con 2,000 operaciones
# ['USD', 'GBP'] None
# 23416728348467685
# CacheInfo(hits=78, misses=81, maxsize=None, currsize=81)

(Sin `@cache`, `fib(80)` haría del orden de 10¹⁶ llamadas: no terminaría en
años. Con caché: 81 cálculos distintos y 78 aciertos.)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- PRIMERO CORRECTO, LUEGO MEDIDO, LUEGO RÁPIDO: optimiza solo el cuello de
  botella que muestre el perfilador; la legibilidad también es rendimiento
  (del equipo).
- `x in lista` DENTRO DE UN BUCLE = O(n²) ESCONDIDO. Convierte a `set` o
  `dict` una sola vez fuera del bucle.
- `lista.pop(0)` COMO COLA ES O(n): usa `collections.deque.popleft()`.
- `lru_cache` EN MÉTODOS retiene `self` en la caché y evita que el objeto se
  libere (fuga de memoria); usa `functools.cached_property` o una caché a
  nivel de módulo. Y nunca la uses en funciones con efectos secundarios o que
  dependan de la hora/BD sin invalidación.
- ARGUMENTOS MUTABLES: `lru_cache` exige argumentos hashables; pasar una
  `list` lanza `TypeError: unhashable type`. Usa tuplas o `frozenset`.
- `timeit` CON LA CONFIGURACIÓN EN `setup`: no midas la creación de los datos
  junto con la operación, y compara el MÍNIMO de varias repeticiones.
- Big-O OCULTA CONSTANTES: para n = 20, una búsqueda lineal en lista puede
  ganar a un dict. Y la complejidad de memoria importa tanto como la de tiempo
  (generadores vs listas).
- N+1 CONSULTAS: un ORM que hace una consulta por cada fila es el O(n²) del
  backend; usa `JOIN`, `select_related` o carga por lotes.
- ANTES DE REESCRIBIR EN C: prueba algoritmo mejor, estructura adecuada,
  builtins, `numpy` para vectores, y solo después Cython/Rust (PyO3).

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Clasifica el Big-O: escribe 6 funciones cortas (índice, recorrido, bucle
   anidado, búsqueda binaria, ordenar, todas las sublistas) y anota en el
   docstring de cada una su complejidad de tiempo y memoria.
2. Lista vs set: con `timeit`, mide `x in coleccion` para 10³, 10⁵ y 10⁶
   elementos en `list` y `set`, e imprime una tabla comparativa.
3. join vs +=: construye un CSV de 100 000 líneas con `+=` y con
   `"".join(...)`; mide y explica la diferencia.

[Intermedio]
4. Two-sum en O(n): `pares_que_suman(montos, objetivo)` para conciliación
   bancaria; primero O(n²) y luego O(n) con dict, verificando igual resultado.
5. Top-k eficiente: `productos_mas_vendidos(ventas, k)` con `heapq.nlargest`
   y con `sorted`; compara para n = 1 000 000 y k = 10.
6. Perfilado: perfila con `cProfile` un generador de reportes con un cuello de
   botella oculto (`in` sobre lista), lee la salida de `pstats`, corrígelo y
   documenta la mejora.
7. Memoización: `formas_de_cambio(monto, monedas)` recursiva; compara sin
   caché, con `@lru_cache(maxsize=None)` y una versión iterativa con
   programación dinámica bottom-up.

[Senior / Producción]
8. LRU con TTL: extiende `CacheLRU` con expiración por entrada (reloj
   inyectable para pruebas), métricas de hits/misses y `__len__`; todas las
   operaciones O(1).
9. Memoria: procesa un CSV de 2 millones de filas con lista completa vs
   generador; mide el pico con `tracemalloc` y usa `__slots__` en la clase de
   fila para reducir memoria; reporta los números.
10. Presupuesto de rendimiento: escribe una prueba (`unittest`) que falle si
    `deduplicar_clientes` con 100 000 registros supera 200 ms (mejor de 5
    ejecuciones con `timeit.repeat`) y explica cómo evitar pruebas frágiles
    en CI.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
