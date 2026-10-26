r"""
============================================================================
TEMA 16: RECURSIÓN, FRAMES DE CPYTHON, MEMOIZACIÓN Y GENERADORES RECURSIVOS
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: frames y límite de recursión)
----------------------------------------------------------------------------
Una función recursiva resuelve un problema llamándose a sí misma con una
entrada MÁS PEQUEÑA, hasta llegar a un **caso base** que se responde sin
recursión. Toda función recursiva correcta tiene dos piezas:
    1) Caso base: la condición que corta (lista vacía, nodo sin hijos, n == 0).
    2) Paso recursivo: una llamada que se ACERCA al caso base.

Qué ocurre dentro de CPython:
1) Cada llamada crea un **frame** (marco de ejecución) con sus variables
   locales, el puntero de instrucción y una referencia al frame que la llamó.
   Desde 3.11 los frames son estructuras ligeras en una pila interna por hilo;
   el objeto `frame` completo solo se materializa si alguien lo pide
   (tracebacks, `sys._getframe()`, depuradores).
2) **Límite de recursión**: `sys.getrecursionlimit()` vale 1000 por defecto.
   Al superarlo se lanza `RecursionError: maximum recursion depth exceeded`.
   Es una protección para no desbordar la pila del proceso (que sí podría
   tumbar el intérprete con un segfault).
3) **Python NO tiene optimización de llamadas de cola (TCO)**: Guido van
   Rossum la rechazó para conservar tracebacks completos. `return f(n - 1)`
   sigue apilando frames. La recursión "de cola" no te salva.
4) En 3.12 se separó el límite de recursión de Python del de C: el código
   Python puro ya no consume pila de C, pero llamadas a través de funciones C
   (`sum()`, `map()`, `json.dumps`, `repr` de objetos anidados) sí cuentan.
5) Regla Senior: recursión para estructuras **arbóreas de profundidad
   acotada** (árboles de categorías, JSON, AST, divide y vencerás:
   merge sort, búsqueda binaria); **bucle + pila explícita** (`list` como
   pila en el heap) para cadenas largas o profundidad controlada por usuarios.
6) Subproblemas repetidos (Fibonacci, rutas en cuadrícula, cambio de monedas)
   disparan complejidad exponencial `O(2^n)`. `functools.cache` (3.9+) o
   `lru_cache(maxsize=...)` memoizan resultados y la bajan a polinómica.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Manufactura: "explosión" de la lista de materiales (BOM) de un producto
  compuesto de subensambles para calcular costos y compras.
- E-commerce: árbol de categorías -> migas de pan (breadcrumbs), conteo de
  productos por rama, menús anidados.
- Seguridad y logs: redactar recursivamente campos sensibles (`password`,
  `token`) en un JSON de profundidad arbitraria antes de registrarlo.
- Compiladores, motores de reglas y calculadoras: evaluar un AST.
- Sistemas de archivos: recorrer carpetas (aunque `Path.rglob` y `os.walk`
  ya lo hacen de forma iterativa).
- Optimización: programación dinámica con memoización (tarifas, rutas,
  asignación de recursos).

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
def factorial(n: int) -> int:
    if n < 0:
        raise ValueError("n debe ser >= 0")   # validar ANTES de recursar
    if n <= 1:                                # caso base
        return 1
    return n * factorial(n - 1)               # paso recursivo

def potencia(base: float, exp: int) -> float: # divide y vencerás: O(log n)
    if exp == 0:
        return 1
    mitad = potencia(base, exp // 2)
    return mitad * mitad if exp % 2 == 0 else mitad * mitad * base

from functools import cache, lru_cache
@cache                                         # memoización ilimitada
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)
fib.cache_info()                               # hits, misses, currsize
fib.cache_clear()                              # liberar memoria

def aplanar(datos):                            # generador recursivo
    for x in datos:
        if isinstance(x, list):
            yield from aplanar(x)              # delega en la sub-llamada
        else:
            yield x
list(aplanar([1, [2, [3, 4]], 5]))             # [1, 2, 3, 4, 5]

import sys
sys.getrecursionlimit()                        # 1000 (por defecto)
# sys.setrecursionlimit(5000)  -> casi siempre un parche, no una solución

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Una fábrica de bicicletas calcula el costo de su lista de
materiales (BOM), la imprime como árbol, cuenta rutas de un robot de almacén
con memoización y demuestra por qué una cadena muy profunda exige la versión
iterativa con pila explícita.

from dataclasses import dataclass, field
from functools import cache

@dataclass
class Componente:
    nombre: str
    costo: int                 # costo propio por unidad (USD)
    cantidad: int = 1
    hijos: list["Componente"] = field(default_factory=list)

def costo_total(c: Componente) -> int:
    # Caso base implícito: sin hijos, sum() de una secuencia vacía es 0.
    unitario = c.costo + sum(costo_total(h) for h in c.hijos)
    return unitario * c.cantidad

def recorrer(c: Componente, nivel: int = 0):
    yield f"{'  ' * nivel}- {c.nombre} x{c.cantidad}"
    for hijo in c.hijos:
        yield from recorrer(hijo, nivel + 1)

def profundidad(c: Componente) -> int:
    return 1 + max((profundidad(h) for h in c.hijos), default=0)

def costo_total_iterativo(raiz: Componente) -> int:
    total = 0
    pila = [(raiz, raiz.cantidad)]          # vive en el heap, no en frames
    while pila:
        nodo, factor = pila.pop()
        total += nodo.costo * factor
        for hijo in nodo.hijos:
            pila.append((hijo, factor * hijo.cantidad))
    return total

@cache
def rutas(filas: int, columnas: int) -> int:
    if filas == 0 or columnas == 0:          # borde: un único camino
        return 1
    return rutas(filas - 1, columnas) + rutas(filas, columnas - 1)

bicicleta = Componente("Bicicleta", 50, 1, [
    Componente("Cuadro", 120),
    Componente("Rueda", 15, 2, [Componente("Llanta", 20), Componente("Radio", 1, 32)]),
    Componente("Transmisión", 30, 1, [Componente("Cadena", 25), Componente("Piñón", 8, 2)]),
])

print(f"Costo total: ${costo_total(bicicleta)}")
for linea in recorrer(bicicleta):
    print(linea)
print("Profundidad:", profundidad(bicicleta))
print(f"Rutas 16x16: {rutas(16, 16):,}")
print(rutas.cache_info())

cadena = actual = Componente("n0", 1)
for i in range(1, 5000):                     # una cadena de 5000 niveles
    nuevo = Componente(f"n{i}", 1)
    actual.hijos.append(nuevo)
    actual = nuevo
try:
    costo_total(cadena)
except RecursionError:
    print("RecursionError: usa la versión iterativa")
print("Iterativo:", costo_total_iterativo(cadena), costo_total_iterativo(bicicleta))

# Salida esperada:
# Costo total: $375
# - Bicicleta x1
#   - Cuadro x1
#   - Rueda x2
#     - Llanta x1
#     - Radio x32
#   - Transmisión x1
#     - Cadena x1
#     - Piñón x2
# Profundidad: 3
# Rutas 16x16: 601,080,390
# CacheInfo(hits=225, misses=288, maxsize=None, currsize=288)
# RecursionError: usa la versión iterativa
# Iterativo: 5000 375

(Rueda: (15 + 20 + 32) * 2 = 134. Sin `@cache`, `rutas(16, 16)` haría más de
mil millones de llamadas; con caché solo hay 288 estados distintos: 17 x 17
menos la esquina (0, 0), que nunca se alcanza.)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- CASO BASE PRIMERO Y VALIDACIÓN ANTES DE RECURSAR: `factorial(-1)` sin
  validación baja hasta `RecursionError` en vez de dar un `ValueError` claro.
- `sys.setrecursionlimit(10**6)` NO ES UNA SOLUCIÓN: puedes agotar la pila
  real del sistema y obtener un segfault que mata el proceso sin traceback.
  Reescribe con bucle y pila explícita.
- ARGUMENTOS MUTABLES POR DEFECTO: `def visitar(nodo, vistos=set())` comparte
  el mismo `set` entre TODAS las llamadas externas. Usa `vistos=None` y crea
  el conjunto dentro, o pásalo explícitamente.
- `@cache` EXIGE ARGUMENTOS HASHEABLES: no puedes pasar `list` ni `dict`
  (TypeError: unhashable type); usa tuplas o `frozenset`. Además retiene los
  resultados para siempre: en servicios de larga vida usa
  `lru_cache(maxsize=1024)` y nunca lo apliques a métodos de instancia sin
  pensar (mantiene vivo `self`, fuga de memoria).
- CICLOS EN GRAFOS: un árbol "sucio" con referencias circulares (un empleado
  que es jefe de su jefe) causa recursión infinita. Lleva un conjunto de ids
  visitados o un `profundidad_maxima` al procesar JSON externo.
- COPIAR LISTAS EN CADA NIVEL (`lista[1:]`) convierte un algoritmo O(n) en
  O(n²) en tiempo y memoria; pasa índices (`inicio`, `fin`) en su lugar.
- `yield from` ES OBLIGATORIO en generadores recursivos: llamar
  `aplanar(sub)` sin él solo crea un generador que nadie consume.
- Para recorrer carpetas usa `Path.rglob("*.csv")` u `os.walk()`: son
  iterativos y ya manejan casos raros del sistema de archivos.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Dígitos y MCD: implementa `sumar_digitos(n: int) -> int` y
   `mcd(a: int, b: int) -> int` (algoritmo de Euclides) de forma recursiva,
   lanzando `ValueError` para negativos.
2. Palíndromo recursivo: `es_palindromo(texto: str) -> bool` que ignore
   espacios, mayúsculas y tildes (normaliza antes de recursar) y compare los
   extremos usando índices, sin crear sub-cadenas en cada nivel.
3. Aplanar pedidos: `aplanar(datos: list) -> list` que convierta
   `[1, [2, [3, 4]], 5]` en `[1, 2, 3, 4, 5]`; luego reescríbelo como
   generador con `yield from`.

[Intermedio]
4. Migas de pan: dado un árbol de categorías `{"id", "nombre",
   "subcategorias"}`, `ruta_categoria(arbol, id_buscado) -> list[str] | None`
   que devuelva `['Hogar', 'Cocina', 'Cafeteras']` o `None` si no existe.
5. Redactor de secretos: `redactar(dato, claves={"password", "token"})` que
   recorra dicts y listas anidados y devuelva una COPIA con esos valores
   reemplazados por `"***"`, sin mutar el original.
6. Cambio de monedas memoizado: `formas_de_pago(monto: int, monedas:
   tuple[int, ...]) -> int` con `@cache`; compara con `timeit` la versión sin
   caché para `monto=200` y muestra `cache_info()`.
7. Búsqueda binaria recursiva: `buscar(precios_ordenados, objetivo, inicio,
   fin) -> int` que devuelva el índice o -1, pasando índices (no slices).

[Senior / Producción]
8. Árbol desde lista plana: convierte `[{"id": 1, "padre_id": None, "texto":
   ...}, ...]` (comentarios de un foro) en un árbol anidado con `"respuestas"`
   en O(n) usando un dict de índices; imprímelo con un generador recursivo
   indentado y detecta ciclos lanzando una excepción propia.
9. De recursión a iteración: reescribe `profundidad()` y un recorrido en
   postorden con pila explícita; demuestra con un test de `unittest` que
   procesa una cadena de 100 000 niveles sin `RecursionError`.
10. Evaluador de AST: modela nodos con dataclasses (`Literal(valor)`,
    `Binario(op, izq, der)`, `Variable(nombre)`) y escribe
    `evaluar(nodo, entorno: dict[str, float]) -> float` usando `match`/`case`
    estructural; soporta `+ - * /` y lanza `ZeroDivisionError` con contexto.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
