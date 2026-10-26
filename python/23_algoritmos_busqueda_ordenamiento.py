r"""
============================================================================
TEMA 23: ALGORITMOS DE BÚSQUEDA Y ORDENAMIENTO (TIMSORT, BISECT, HEAPQ)
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: comparaciones, claves y Big-O)
----------------------------------------------------------------------------
1) **Búsqueda lineal vs binaria**: `x in lista` y `lista.index(x)` recorren
   elemento a elemento -> O(n). Si los datos están ORDENADOS, la búsqueda
   binaria descarta la mitad en cada paso -> O(log n): en un millón de
   registros, ~20 comparaciones en lugar de un millón. `x in set/dict` es
   O(1) promedio gracias a la tabla hash (si lo consultas muchas veces,
   conviértelo a `set` una sola vez).
2) **El ordenamiento de CPython es Timsort** (desde 2002; desde 3.11 con la
   política de mezcla *Powersort*): un híbrido de inserción + mezcla que
   detecta "corridas" ya ordenadas. Consecuencias prácticas:
   - O(n log n) en el peor caso y O(n) si los datos ya vienen casi ordenados.
   - Es **ESTABLE**: elementos con la misma clave conservan su orden
     original. Eso permite ordenar por varios criterios en pasadas sucesivas.
   - Solo usa el operador `<` (`__lt__`) para comparar.
3) **`key=` se evalúa UNA vez por elemento** (patrón decorate-sort-undecorate
   interno), no en cada comparación. Devolver una tupla compara campo a campo:
   `key=lambda p: (p.prioridad, -p.horas)`.
4) **`list.sort()` vs `sorted()`**: `sort()` ordena EN SITIO y devuelve
   `None`; `sorted()` acepta cualquier iterable y devuelve una lista NUEVA.
5) **Módulos clave**: `bisect` (búsqueda binaria e inserción ordenada, con
   `key=` desde 3.10), `heapq` (montículo mínimo: top-k en O(n log k)) y
   `operator.itemgetter/attrgetter` (claves rápidas implementadas en C).
6) **Algoritmos clásicos** (burbuja, inserción, selección, merge sort,
   quicksort) se estudian para entender complejidad y entrevistas; en
   producción se usa `sorted()`: está escrito en C y es más rápido que
   cualquier implementación en Python puro.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Colas de soporte o triage hospitalario: ordenar por prioridad y antigüedad.
- Tramos de tarifas, impuestos o niveles de SLA: `bisect` sobre los límites
  en lugar de cadenas de `if/elif`.
- Rankings y "top 10 productos más vendidos": `heapq.nlargest` sin ordenar
  todo el catálogo.
- Búsqueda en series de tiempo ordenadas (lecturas de sensores, logs) por
  marca de tiempo con `bisect_left`.
- Mezcla de archivos ordenados gigantes (ordenamiento externo) con
  `heapq.merge`, que es perezoso.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
from bisect import bisect_left, bisect_right, insort
from heapq import nlargest, nsmallest, merge
from operator import attrgetter, itemgetter

notas = [4.5, 3.2, 6.8, 5.0]
notas.sort()                                     # en sitio -> None
ranking = sorted(notas, reverse=True)            # nueva lista
alumnos.sort(key=attrgetter("apellido", "nombre"))
filas.sort(key=itemgetter(2))                    # por la 3.ª columna
palabras.sort(key=str.casefold)                  # sin distinguir mayúsculas

# Varios criterios con dirección distinta: dos pasadas estables
ventas.sort(key=attrgetter("fecha"))             # criterio SECUNDARIO primero
ventas.sort(key=attrgetter("monto"), reverse=True)  # criterio PRINCIPAL al final

i = bisect_left([10, 20, 20, 30], 20)            # 1 (primera posición válida)
j = bisect_right([10, 20, 20, 30], 20)           # 3 (después de los iguales)
insort(lista_ordenada, 25)                       # inserta manteniendo orden O(n)

nlargest(3, productos, key=attrgetter("vendidos"))  # top 3 sin ordenar todo
list(merge([1, 4, 9], [2, 3, 10]))               # [1, 2, 3, 4, 9, 10]

def merge_sort(datos: list[int]) -> list[int]:   # O(n log n), estable
    if len(datos) <= 1:
        return datos
    medio = len(datos) // 2
    izq, der = merge_sort(datos[:medio]), merge_sort(datos[medio:])
    resultado, i, j = [], 0, 0
    while i < len(izq) and j < len(der):
        if izq[i] <= der[j]:                     # <= conserva la estabilidad
            resultado.append(izq[i]); i += 1
        else:
            resultado.append(der[j]); j += 1
    return resultado + izq[i:] + der[j:]

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Una plataforma SaaS de soporte técnico prioriza tickets, asigna un
nivel de SLA según las horas abiertas y busca tickets por ID.

from bisect import bisect_right
from dataclasses import dataclass
from operator import attrgetter

@dataclass(frozen=True)
class Ticket:
    id: str
    prioridad: int          # 1 = crítica, 3 = baja
    horas_abierto: int

tickets = [
    Ticket("T-104", 2, 30),
    Ticket("T-101", 1, 5),
    Ticket("T-107", 3, 72),
    Ticket("T-102", 2, 48),
    Ticket("T-109", 1, 12),
]

# 1) Prioridad ascendente; a igual prioridad, el más antiguo primero
cola = sorted(tickets, key=lambda t: (t.prioridad, -t.horas_abierto))
print([t.id for t in cola])

# 2) Estabilidad: con una sola clave se respeta el orden de llegada
print([t.id for t in sorted(tickets, key=attrgetter("prioridad"))])

# 3) Nivel de SLA por tramos con búsqueda binaria
LIMITES_HORAS = [8, 24, 48]
NIVELES = ["verde", "amarillo", "naranja", "rojo"]

def nivel_sla(horas: int) -> str:
    return NIVELES[bisect_right(LIMITES_HORAS, horas)]

print({t.id: nivel_sla(t.horas_abierto) for t in cola})

# 4) Búsqueda binaria manual contando pasos
def busqueda_binaria(ordenados: list[str], objetivo: str) -> tuple[int, int]:
    bajo, alto, pasos = 0, len(ordenados) - 1, 0
    while bajo <= alto:
        pasos += 1
        medio = (bajo + alto) // 2
        if ordenados[medio] == objetivo:
            return medio, pasos
        if ordenados[medio] < objetivo:
            bajo = medio + 1
        else:
            alto = medio - 1
    return -1, pasos

ids = sorted(t.id for t in tickets)
print(ids)
print(busqueda_binaria(ids, "T-107"), busqueda_binaria(ids, "T-108"))

# Salida esperada:
# ['T-109', 'T-101', 'T-102', 'T-104', 'T-107']
# ['T-101', 'T-109', 'T-104', 'T-102', 'T-107']
# {'T-109': 'amarillo', 'T-101': 'verde', 'T-102': 'rojo', 'T-104': 'naranja', 'T-107': 'rojo'}
# ['T-101', 'T-102', 'T-104', 'T-107', 'T-109']
# (3, 2) (-1, 3)

(T-102 lleva exactamente 48 h: `bisect_right` lo coloca DESPUÉS del límite,
así que ya es "rojo". Con `bisect_left` sería "naranja": elige según si el
límite es inclusivo o exclusivo en tu regla de negocio.)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- `lista = lista.sort()` DEJA `lista` EN `None`: `sort()` muta y devuelve
  `None` (convención de Python para métodos que modifican en sitio).
- BÚSQUEDA BINARIA SOBRE DATOS DESORDENADOS devuelve basura sin error. Ordena
  con la MISMA clave que usarás en `bisect(..., key=...)`.
- ORDENAR TEXTO: `"Zapato" < "auto"` es `True` (mayúsculas primero por código
  Unicode) y `"ñ"` va después de `"z"`. Usa `key=str.casefold` o
  `locale.strxfrm` con la configuración regional adecuada.
- TIPOS MEZCLADOS: `sorted([3, "2", None])` lanza `TypeError` (Python 3 no
  compara tipos distintos); normaliza antes o usa una clave robusta.
- `None` EN LA CLAVE: ordena con `key=lambda x: (x.fecha is None, x.fecha)`
  para mandar los vacíos al final sin `TypeError`.
- NO REORDENES EN CADA INSERCIÓN: `append` + `sort` en un bucle es
  O(n² log n); usa `insort`, un `heapq` o ordena una sola vez al final.
- `functools.cmp_to_key` existe para comparadores clásicos, pero una clave
  (`key=`) es más rápida y legible; úsalo solo para reglas no expresables
  como tupla.
- `max/min` SON O(n): para el máximo una vez basta; para el top-k repetido
  sobre datos que cambian, mantén un montículo.
- RECURSIÓN EN QUICKSORT/MERGE SORT: listas enormes pueden alcanzar el
  límite de recursión (1000 por defecto); en Python prefiere versiones
  iterativas o, mejor, `sorted()`.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Ordenamiento por inserción: implementa `ordenar_insercion(datos)` sin
   mutar la entrada; compruébalo contra `sorted()` con 20 listas generadas
   con `random.Random(7)`.
2. Búsqueda lineal con métricas: `buscar_paciente(pacientes, documento)` que
   devuelva el paciente y el número de comparaciones realizadas.
3. Ranking de estudiantes: ordena dicts `{"nombre", "promedio", "edad"}` por
   promedio descendente y, en empate, por nombre ascendente (sin tildes que
   alteren el orden: usa `casefold`).

[Intermedio]
4. Tramos de impuesto con `bisect`: dada una tabla de tramos de renta y
   tasas, `calcular_impuesto(renta)` debe aplicar la tasa marginal correcta;
   prueba los valores exactos de cada límite.
5. Merge sort contando inversiones: modifica `merge_sort` para devolver
   también cuántos pares (i, j) estaban desordenados (medida de "qué tan
   desordenado" está un ranking).
6. Top-k eficiente: con `heapq.nlargest` obtén los 5 productos más vendidos
   de 1 000 000 de ventas simuladas y compara el tiempo con
   `sorted(...)[:5]` usando `timeit`.
7. Búsqueda en serie de tiempo: dada una lista ordenada de lecturas
   `(timestamp, valor)`, `lecturas_entre(desde, hasta)` con `bisect_left` y
   `bisect_right` usando `key=`.

[Senior / Producción]
8. Quicksort robusto: implementa quicksort iterativo (pila explícita) con
   pivote mediana de tres y partición de 3 vías (Dutch National Flag) para
   manejar muchos duplicados; compara con `sorted()` en datos ya ordenados.
9. Ordenamiento externo: ordena un CSV de transacciones que "no cabe en
   memoria" dividiéndolo en bloques ordenados escritos en archivos
   temporales (`tempfile`) y mezclándolos con `heapq.merge` de forma perezosa.
10. Índice de búsqueda: construye `IndiceProductos` que mantenga una lista
    ordenada por nombre normalizado (sin tildes con `unicodedata`) y soporte
    búsqueda por prefijo en O(log n + k); analiza su complejidad frente a un
    `dict` y frente a un trie.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
