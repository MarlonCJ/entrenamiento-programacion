r"""
============================================================================
TEMA 24: ESTRUCTURAS DE DATOS (PILAS, COLAS, MONTÍCULOS, HASH, GRAFOS Y LRU)
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: cómo están hechas por dentro)
----------------------------------------------------------------------------
Elegir la estructura correcta cambia un algoritmo de O(n²) a O(n). En CPython:
1) **`list` es un arreglo dinámico de PUNTEROS** a objetos (no una lista
   enlazada). Reserva capacidad extra (*over-allocation*), por eso `append`
   y `pop()` del final son O(1) amortizado, pero `insert(0, x)` y `pop(0)`
   son O(n): desplazan todos los punteros. Acceso por índice: O(1).
2) **`collections.deque`** es una lista doblemente enlazada de BLOQUES de 64
   punteros: `append/appendleft/pop/popleft` son O(1) en ambos extremos,
   pero acceder a `d[i]` en el medio es O(n). Es LA cola FIFO de Python.
   Con `maxlen` descarta automáticamente lo más antiguo (búfer circular).
3) **`dict` y `set` son tablas hash**: búsqueda, inserción y borrado O(1)
   promedio. El `dict` moderno (3.6+) es "compacto": un arreglo de índices y
   otro de entradas en orden de inserción (orden garantizado desde 3.7). Las
   claves deben ser *hashables* (inmutables: `str`, `int`, `tuple`,
   `frozenset`, dataclasses `frozen=True`).
4) **`heapq`** implementa un montículo binario MÍNIMO sobre una `list`
   normal: `heappush`/`heappop` O(log n), consultar el mínimo `h[0]` O(1).
   Para prioridad máxima se niega la clave; para desempatar se añade un
   contador: `(prioridad, secuencia, dato)`.
5) **`collections`** aporta: `Counter` (multiconjunto), `defaultdict`
   (valor por defecto con fábrica), `OrderedDict` (`move_to_end`,
   `popitem(last=False)`: base de una caché LRU), `namedtuple` y `ChainMap`.
6) **Estructuras propias**: listas enlazadas, árboles y grafos se modelan con
   clases (`@dataclass(slots=True)` ahorra memoria) o con diccionarios de
   adyacencia `{nodo: [vecinos]}`. `queue.Queue` es la versión segura para
   hilos (con bloqueos), útil en productor/consumidor.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Pila (`list` con `append/pop`): deshacer/rehacer en editores, validar
  paréntesis, navegación "atrás", evaluación de expresiones.
- Cola (`deque`): trabajos pendientes, BFS, limitadores de tasa por ventana
  deslizante ("últimas 100 peticiones").
- Montículo (`heapq`): alertas por severidad en IoT, planificadores de
  tareas, triage, algoritmo de Dijkstra para rutas de reparto.
- Hash (`dict`/`set`): índices en memoria, deduplicación, detección de
  transacciones repetidas, conteo de eventos con `Counter`.
- Grafos: redes de sensores, dependencias entre paquetes (orden topológico
  con `graphlib.TopologicalSorter`), rutas logísticas, redes sociales.
- Caché LRU: respuestas de APIs costosas (`functools.lru_cache` o propia).

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
from collections import Counter, OrderedDict, defaultdict, deque, namedtuple
import heapq

historial = []                         # PILA (LIFO)
historial.append("pagina1"); historial.pop()

cola = deque(["job-1", "job-2"])       # COLA (FIFO)
cola.append("job-3"); cola.popleft()   # 'job-1'
ultimas = deque(maxlen=3)              # solo conserva las 3 más recientes

vistos: set[str] = set()               # deduplicar en O(1)
if tx_id in vistos: ...

por_ciudad: defaultdict[str, list[str]] = defaultdict(list)
por_ciudad["Lima"].append("pedido-9")  # crea la lista si no existe

Counter("abracadabra").most_common(2)  # [('a', 5), ('b', 2)]

monticulo: list[tuple[int, str]] = []
heapq.heappush(monticulo, (2, "media"))
heapq.heappush(monticulo, (1, "alta"))
heapq.heappop(monticulo)               # (1, 'alta')
heapq.heapify(datos)                   # convierte una lista en O(n)

Punto = namedtuple("Punto", "lat lon") # tupla inmutable con nombres

from dataclasses import dataclass
@dataclass(slots=True)
class Nodo:                            # lista enlazada simple
    valor: int
    siguiente: "Nodo | None" = None

from graphlib import TopologicalSorter
list(TopologicalSorter({"deploy": {"test"}, "test": {"build"}}).static_order())
# ['build', 'test', 'deploy']

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: La plataforma IoT de una planta industrial atiende alertas por
severidad, calcula la ruta más corta del gateway a un sensor y guarda las
últimas lecturas en una caché LRU.

import heapq
from collections import OrderedDict, deque
from itertools import count

# 1) Cola de prioridad (menor número = más urgente; el contador desempata)
alertas: list[tuple[int, int, str]] = []
secuencia = count()
for severidad, mensaje in [
    (3, "batería baja s-12"),
    (1, "temperatura crítica s-07"),
    (2, "sensor desconectado s-03"),
    (1, "fuga de gas s-21"),
]:
    heapq.heappush(alertas, (severidad, next(secuencia), mensaje))

while alertas:
    severidad, _, mensaje = heapq.heappop(alertas)
    print(severidad, mensaje)

# 2) BFS con deque: ruta con menos saltos en la red de sensores
red: dict[str, list[str]] = {
    "gateway": ["nodo-a", "nodo-b"],
    "nodo-a": ["nodo-c"],
    "nodo-b": ["nodo-c", "nodo-d"],
    "nodo-c": ["sensor-9"],
    "nodo-d": ["sensor-9"],
    "sensor-9": [],
}

def ruta_mas_corta(grafo: dict[str, list[str]], origen: str, destino: str) -> list[str]:
    previo: dict[str, str | None] = {origen: None}
    pendientes = deque([origen])
    while pendientes:
        actual = pendientes.popleft()
        if actual == destino:
            ruta: list[str] = []
            nodo: str | None = actual
            while nodo is not None:
                ruta.append(nodo)
                nodo = previo[nodo]
            return ruta[::-1]
        for vecino in grafo[actual]:
            if vecino not in previo:          # set/dict: O(1)
                previo[vecino] = actual
                pendientes.append(vecino)
    return []

print(" -> ".join(ruta_mas_corta(red, "gateway", "sensor-9")))

# 3) Caché LRU con OrderedDict
class CacheLRU:
    def __init__(self, capacidad: int) -> None:
        self.capacidad = capacidad
        self._datos: OrderedDict[str, float] = OrderedDict()

    def obtener(self, clave: str) -> float | None:
        if clave not in self._datos:
            return None
        self._datos.move_to_end(clave)        # marcada como usada recientemente
        return self._datos[clave]

    def guardar(self, clave: str, valor: float) -> None:
        self._datos[clave] = valor
        self._datos.move_to_end(clave)
        if len(self._datos) > self.capacidad:
            self._datos.popitem(last=False)   # expulsa la menos usada

    def claves(self) -> list[str]:
        return list(self._datos)

cache = CacheLRU(capacidad=2)
cache.guardar("s-07", 81.5)
cache.guardar("s-12", 22.0)
cache.obtener("s-07")
cache.guardar("s-21", 40.25)
print(cache.claves(), cache.obtener("s-12"))

# Salida esperada:
# 1 temperatura crítica s-07
# 1 fuga de gas s-21
# 2 sensor desconectado s-03
# 3 batería baja s-12
# gateway -> nodo-a -> nodo-c -> sensor-9
# ['s-07', 's-21'] None

(Las dos alertas de severidad 1 salen en orden de llegada gracias al
contador; sin él, Python compararía los textos de los mensajes.)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- `lista.pop(0)` COMO COLA ES O(n): con 100 000 trabajos el proceso se
  vuelve cuadrático. Usa `deque.popleft()`.
- `x in lista` DENTRO DE UN BUCLE es O(n·m); convierte a `set` antes.
- `[[0] * 3] * 3` CREA TRES REFERENCIAS A LA MISMA FILA: modificar una fila
  modifica todas. Usa `[[0] * 3 for _ in range(3)]`.
- CLAVES MUTABLES: `{[1, 2]: "x"}` lanza `TypeError: unhashable type: 'list'`.
  Si mutas un objeto después de usarlo como clave (con `__hash__` propio),
  el `dict` ya no lo encuentra.
- `defaultdict` CREA CLAVES AL LEER: `if conteo["x"] == 0` inserta `"x"`. Para
  consultar sin efectos usa `"x" in conteo` o `conteo.get("x")`.
- `heapq` NO ES UNA CLASE: si haces `append` directo en la lista rompes la
  propiedad del montículo; usa siempre `heappush` (o `heapify` después).
- TUPLAS DE PRIORIDAD CON OBJETOS NO COMPARABLES: en un empate de prioridad
  Python compara el siguiente campo; añade un contador o usa
  `@dataclass(order=True)` con `field(compare=False)` en la carga útil.
- NO REINVENTES: antes de escribir una lista enlazada, pregúntate si
  `deque` o `list` ya resuelven el problema (casi siempre sí, y en C).
- `queue.Queue` ES PARA HILOS; para `asyncio` usa `asyncio.Queue`; para
  estructuras de un solo hilo, `deque` (sin el costo de los bloqueos).
- `__slots__`/`slots=True` reduce memoria con millones de nodos, pero impide
  añadir atributos dinámicos.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Validador de expresiones: `esta_balanceada(texto)` con una pila que
   verifique `()[]{}` en fórmulas de una hoja de cálculo.
2. Turnos de un banco: simula con `deque` la llegada y atención de clientes,
   permitiendo que los clientes preferenciales entren por el frente.
3. Inventario con `Counter`: suma las existencias de tres bodegas
   (`Counter` + `Counter`), muestra los 3 productos con más unidades y los
   que quedaron en cero o negativo tras restar un pedido.

[Intermedio]
4. Historial con deshacer/rehacer: `EditorTexto` con dos pilas que soporte
   `escribir`, `deshacer` y `rehacer`, limpiando "rehacer" al escribir.
5. Lista enlazada: implementa `ListaEnlazada` con `agregar_al_inicio`,
   `eliminar(valor)`, `invertir()` en sitio y `__iter__`/`__len__`.
6. Limitador de tasa: `LimitadorVentana(max_peticiones=5, segundos=60)` con
   un `deque` de marcas de tiempo (recibidas como parámetro) que responda si
   una nueva petición se permite.
7. Agrupación de pedidos: con `defaultdict(list)` agrupa pedidos por ciudad y
   estado, y genera un reporte ordenado por número de pedidos.

[Senior / Producción]
8. Dijkstra para reparto: con `heapq` calcula la ruta de menor costo entre
   bodegas en un grafo ponderado `{origen: {destino: km}}`, reconstruyendo el
   camino; maneja nodos inalcanzables.
9. Planificador de despliegues: modela dependencias entre microservicios y
   obtén el orden de despliegue con `graphlib.TopologicalSorter`; detecta y
   reporta ciclos (`CycleError`) indicando los servicios implicados.
10. Caché LRU con expiración: extiende `CacheLRU` con TTL por entrada (reloj
    inyectable), estadísticas de aciertos/fallos y seguridad para hilos con
    `threading.Lock`; compárala con `functools.lru_cache` y explica por qué
    esta no sirve para datos que caducan.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
