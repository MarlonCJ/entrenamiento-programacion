r"""
============================================================================
TEMA 12: LISTAS (`list`), TUPLAS (`tuple`), SLICING, COPIAS Y COMPRENSIONES
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: arreglos de punteros en CPython)
----------------------------------------------------------------------------
1) **`list` NO guarda los objetos dentro del bloque contiguo**: en CPython, una
   `list` es una estructura en C (`PyListObject`) que contiene un puntero a un
   arreglo dinámico de **referencias (`PyObject*`, 8 bytes cada una en 64 bits)**,
   el tamaño actual (`ob_size`) y la capacidad reservada (`allocated`).
2) **Sobreasignación (*over-allocation*)**: cuando haces `lista.append(x)` y el
   arreglo está lleno, CPython reserva ~12.5 % de espacio extra para que la
   mayoría de los `append` siguientes no reubiquen memoria. Por eso `append()`
   y `pop()` al final son $O(1)$ amortizado, pero `insert(0, x)` y `pop(0)` son
   $O(n)$ porque desplazan todos los punteros siguientes un lugar.
3) **`tuple` es inmutable y de tamaño fijo**: almacena sus punteros directamente
   dentro del mismo bloque de cabecera (`PyTupleObject`), ocupa menos RAM que
   una `list` equivalente y, si todos sus elementos son *hashables*, puede
   usarse como clave de un `dict` o elemento de un `set`.
4) **Slicing (`secuencia[i:j:k]`) y asignación por tajadas**: leer un slice en
   `list` o `tuple` devuelve una **copia superficial (`shallow copy`)** de ese
   tramo. En una `list` también puedes asignar a un slice (`lista[1:3] = [...]`)
   para reemplazar, insertar o borrar tramos in-place.
5) **La trampa de `[[0] * 3] * 3`**: el operador `*` sobre una lista no clona
   los objetos internos; repite la **misma referencia**. Modificar `matriz[0][0] = 9`
   cambia las 3 filas a la vez.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- `list`: colecciones homogéneas cuyo contenido crece, se filtra o se ordena
  (líneas de un pedido, resultados de búsqueda, lotes de procesamiento).
- `tuple` (y `typing.NamedTuple`): registros inmutables de campos con significado
  posicional (coordenadas `(lat, lon)`, filas de base de datos, claves compuestas
  `(empresa_id, anio, mes)` en cachés).
- Comprensiones de lista (`[f(x) for x in it if cond]`): transformar y filtrar
  datos en una sola expresión rápida (el bucle interno corre en bytecode
  optimizado con la instrucción `LIST_APPEND`).

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
from copy import deepcopy
from typing import NamedTuple

# Creación y desempaquetado con estrella (*)
precios: list[int] = [120, 80, 300, 45, 200]
primero, *intermedios, ultimo = precios            # 120, [80, 300, 45], 200

# Tuplas (ojo: la tupla de 1 elemento requiere coma final)
un_elemento: tuple[int] = (42,)                    # sin coma (42) es solo un int
coordenada: tuple[float, float] = (4.7110, -74.0721)

class PuntoVenta(NamedTuple):                      # tupla con nombres y tipos
    id_sucursal: str
    latitud: float
    longitud: float

# Slicing y copia superficial vs profunda
ultimos_tres = precios[-3:]                        # [300, 45, 200]
copia_plana = precios.copy()                       # igual a precios[:]
matriz_segura = [[0 for _ in range(3)] for _ in range(3)]  # 3 filas distintas
matriz_clonada = deepcopy(matriz_segura)           # clona niveles anidados

# Ordenamiento in-place (.sort devuelve None) vs nueva lista (sorted)
ordenados = sorted(precios, reverse=True)          # precios no cambia
precios.sort()                                     # modifica precios in-place

# Comprensiones de lista
con_iva = [round(p * 1.19) for p in precios if p >= 100]

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un sistema de inventario gestiona movimientos de almacén usando
`NamedTuple` inmutables para el historial auditable, filtra y ordena productos
con comprensiones y demuestra cómo evitar el bug de referencias compartidas en
matrices y copias superficiales.

import sys
from typing import NamedTuple

class LoteProducto(NamedTuple):
    sku: str
    cantidad: int
    costo_unitario: int

inventario: list[LoteProducto] = [
    LoteProducto("MON-27", 4, 850_000),
    LoteProducto("TEC-MEC", 15, 220_000),
    LoteProducto("MOU-PRO", 2, 180_000),
    LoteProducto("CAB-USB", 50, 25_000),
]

# 1. Filtrar lotes críticos (stock < 5) y ordenar por valor total descendente
criticos = [lote for lote in inventario if lote.cantidad < 5]
por_valor = sorted(inventario, key=lambda l: l.cantidad * l.costo_unitario, reverse=True)
print("Críticos:", [l.sku for l in criticos])
print("Top 2 por valor:", [(l.sku, l.cantidad * l.costo_unitario) for l in por_valor[:2]])

# 2. Demostración de memoria: tuple vs list con los mismos elementos
como_lista = [1, 2, 3, 4, 5]
como_tupla = (1, 2, 3, 4, 5)
print("Bytes list >= tuple:", sys.getsizeof(como_lista) > sys.getsizeof(como_tupla))

# 3. Trampa de multiplicación de listas anidadas vs comprensión
turnos_mal = [[] ] * 3
turnos_mal[0].append("Ana")
turnos_bien = [[] for _ in range(3)]
turnos_bien[0].append("Ana")
print("Multiplicación [*]:", turnos_mal)
print("Comprensión:", turnos_bien)

# Salida esperada:
# Críticos: ['MON-27', 'MOU-PRO']
# Top 2 por valor: [('MON-27', 3400000), ('TEC-MEC', 3300000)]
# Bytes list >= tuple: True
# Multiplicación [*]: [['Ana'], ['Ana'], ['Ana']]
# Comprensión: [['Ana'], [], []]

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- `lista = lista.sort()` DEJA `lista` EN `None`: `.sort()`, `.append()`,
  `.extend()` y `.reverse()` mutan la lista in-place y devuelven `None` por
  diseño para recordarte que no crearon una lista nueva.
- NUNCA USES `[[0] * columnas] * filas` PARA MATRICES: todas las filas apuntan
  al mismo objeto `list`. Usa siempre `[[0] * columnas for _ in range(filas)]`.
- TUPLA CON OBJETO MUTABLE ADENTRO: una tupla no permite reasignar `t[0] = x`,
  pero si `t = ([1, 2], "ok")`, `t[0].append(3)` SÍ muta la lista interna y,
  además, hace que `hash(t)` lance `TypeError: unhashable type: 'list'`.
- `lista.copy()` ES SUPERFICIAL (*shallow*): solo copia el contenedor exterior.
  Si la lista contiene diccionarios u objetos y vas a mutarlos, usa
  `copy.deepcopy(lista)` o construye objetos nuevos.
- NO USES COMPRENSIONES POR SUS EFECTOS SECUNDARIOS: `[print(x) for x in datos]`
  crea una lista llena de `[None, None, ...]` en memoria sin necesidad. Usa un
  bucle `for` normal cuando no quieras conservar la lista resultante.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Estadísticas por tajadas (*slicing*): dada una lista de ventas diarias de 30
   días, obtén la primera semana, la última semana, los días pares y la serie
   invertida usando únicamente slicing.
2. Rotación segura: implementa `rotar_derecha(items: list[int], k: int) ->
   list[int]` usando slicing que devuelva una lista nueva sin mutar la original
   (incluso si `k > len(items)` o la lista está vacía).
3. Desempaquetado de podios: dada una lista ordenada de puntajes, usa
   `oro, plata, bronce, *resto = puntajes` para imprimir el podio y el promedio
   del resto de competidores.

[Intermedio]
4. Aplanado con comprensión: escribe `aplanar(matriz: list[list[int]]) ->
   list[int]` en una sola comprensión de lista con doble `for` y compárala con
   `itertools.chain.from_iterable`.
5. Transpuesta de matriz: implementa `transponer(matriz: list[list[int]]) ->
   list[list[int]]` validando que todas las filas tengan la misma longitud y
   garantizando que ninguna fila comparta referencias.
6. Ordenamiento multicriterio: dada una lista de `NamedTuple` `Candidato(nombre,
   puntaje, antiguedad_meses)`, ordénala por `puntaje` descendente y, en caso
   de empate, por `antiguedad_meses` descendente y `nombre` ascendente.
7. Eliminación de duplicados preservando orden: implementa `unicos_en_orden(seq:
   list[str]) -> list[str]` en tiempo $O(n)$ sin perder la posición de la
   primera aparición de cada elemento.

[Senior / Producción]
8. Experimento de sobreasignación en CPython: escribe una función que inserte
   1 000 elementos uno a uno en una `list` registrando cada vez que cambia
   `sys.getsizeof(lista)`, e imprime la secuencia exacta de saltos de capacidad.
9. Paginador inmutable sobre tuplas: crea `paginar_tupla(datos: tuple[T, ...],
   pagina: int, tamano: int) -> tuple[T, ...]` con validación de rangos y
   metadatos (`total_paginas`, `tiene_siguiente`, `tiene_anterior`) en una
   `NamedTuple`.
10. Clonado selectivo para auditoría: dado un lote de pedidos (listas de dicts
    anidados), demuestra con una prueba automatizada cómo una modificación tras
    `.copy()` corrompe el estado anterior y corrígelo comparando `deepcopy`
    frente a modelar los pedidos con tuplas/dataclasses inmutables.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
