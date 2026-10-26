r"""
============================================================================
TEMA 10: BUCLES, PROTOCOLO DE ITERACIÓN, FOR/ELSE, GENERADORES E ITERTOOLS
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: iter(), next() y StopIteration)
----------------------------------------------------------------------------
1) **El `for` de Python es un "for-each"**: no hay `for (i = 0; i < n; i++)`.
   `for x in objeto:` hace internamente:
       it = iter(objeto)          # llama a objeto.__iter__()
       while True:
           try:
               x = next(it)       # llama a it.__next__()
           except StopIteration:
               break
           ...cuerpo...
   Todo lo que implemente ese protocolo es ITERABLE: listas, tuplas, `str`,
   `dict` (itera claves), `set`, archivos (línea a línea), `range`, generadores.
2) **Iterable vs iterador**: una lista es iterable (puedes recorrerla muchas
   veces); un iterador (`iter(lista)`, un generador, `zip`, `map`) se CONSUME
   una sola vez y queda agotado.
3) **Evaluación perezosa**: `range(10**12)` no crea un billón de números; los
   genera bajo demanda. Igual los generadores (`yield`) y las expresiones
   generadoras `(x * 2 for x in datos)`: procesan millones de registros con
   memoria constante.
4) **`while condicion:`** repite mientras la condición sea verdadera; ideal
   cuando no sabes cuántas iteraciones habrá (reintentos, colas, menús).
5) **`break`, `continue` y la cláusula `else`**: el `else` de un `for`/`while`
   se ejecuta SOLO si el bucle terminó sin `break` ("no se encontró").
6) **Herramientas clave**: `enumerate(it, start=1)`, `zip(a, b, strict=True)`
   (3.10+), `reversed()`, `sorted()`, `dict.items()`, y el módulo `itertools`:
   `islice`, `chain`, `groupby`, `count`, `pairwise` (3.10+) y `batched`
   (3.12+, agrupa en tuplas de tamaño n).
7) **La variable del bucle "se filtra"**: tras el `for`, `x` conserva el último
   valor (no hay ámbito de bloque). En las comprensiones, en cambio, la
   variable es local a la comprensión.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- ETL y reportes: recorrer millones de filas de un CSV o de un cursor de base
  de datos con generadores, sin cargarlas todas en memoria.
- Inserciones por lotes: enviar registros a una API o a la base de datos en
  bloques de 500 con `itertools.batched`.
- Paginación de APIs externas: `while` hasta que no haya `siguiente_pagina`.
- Reintentos con espera exponencial ante fallos de red (`for intento in
  range(1, MAX + 1)` + `else` para "se agotaron los reintentos").
- Búsquedas con `for/else`: primer producto agotado, primer servidor sano.
- Conciliación bancaria: recorrer en paralelo extracto y libro con `zip`.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
for producto in ["teclado", "mouse"]:            # recorrer valores
    print(producto)

for numero, cliente in enumerate(clientes, start=1):   # índice + valor
    print(f"{numero}. {cliente}")

for sku, stock in inventario.items():           # dict: clave y valor
    ...

for fecha, monto in zip(fechas, montos, strict=True):  # error si largos difieren
    ...

for i in range(10, 0, -2):                      # 10, 8, 6, 4, 2
    ...

intento = 0
while intento < 3:
    intento += 1
    if conectar():
        break
else:
    raise ConnectionError("sin conexión tras 3 intentos")

while (linea := archivo.readline()):             # walrus en while
    procesar(linea)

cuadrados = [n * n for n in range(5)]            # comprensión de lista
pares = {n for n in datos if n % 2 == 0}         # de conjunto
precios = {p.sku: p.precio for p in productos}   # de diccionario
total = sum(item.subtotal for item in carrito)   # expresión generadora

def leer_lineas(ruta):                           # función generadora
    with open(ruta, encoding="utf-8") as archivo:
        for linea in archivo:
            yield linea.rstrip("\n")

from itertools import batched, islice, pairwise
list(batched("ABCDE", 2))        # [('A', 'B'), ('C', 'D'), ('E',)]
list(islice(leer_lineas("log.txt"), 5))   # solo las primeras 5 líneas
list(pairwise([1, 4, 9]))        # [(1, 4), (4, 9)]

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un proceso nocturno carga pedidos desde un generador (simulando un
cursor de base de datos), los procesa por lotes de 3 y se detiene en cuanto el
monto acumulado supera el umbral de revisión antifraude.

from itertools import batched

def leer_pedidos():
    # Simula un cursor: produce un pedido a la vez, sin cargar todos en memoria.
    for numero in range(1, 8):
        yield {"id": f"P{numero:03}", "total": numero * 15_000}

UMBRAL_REVISION = 100_000
acumulado = 0

for numero_lote, lote in enumerate(batched(leer_pedidos(), 3), start=1):
    ids = [pedido["id"] for pedido in lote]
    acumulado += sum(pedido["total"] for pedido in lote)
    print(f"Lote {numero_lote}: {ids} -> acumulado {acumulado:,}")
    if acumulado > UMBRAL_REVISION:
        print("Umbral superado: se detiene la carga")
        break
else:
    print("Todos los lotes procesados")

pedidos = leer_pedidos()
print(next(pedidos)["id"], next(pedidos)["id"])
print(len(list(pedidos)), len(list(pedidos)))

# Salida esperada:
# Lote 1: ['P001', 'P002', 'P003'] -> acumulado 90,000
# Lote 2: ['P004', 'P005', 'P006'] -> acumulado 315,000
# Umbral superado: se detiene la carga
# P001 P002
# 5 0

(Las dos últimas líneas muestran que un generador se consume: tras leer 2
pedidos quedan 5, y una segunda pasada ya no produce nada.)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- `for i in range(len(lista)):` ES UN ANTIPATRÓN: usa `for x in lista` o
  `enumerate(lista)` si necesitas el índice.
- NO MODIFIQUES UNA COLECCIÓN MIENTRAS LA RECORRES: borrar claves de un `dict`
  en un `for` lanza `RuntimeError: dictionary changed size during iteration`;
  en listas se "saltan" elementos sin error. Recorre una copia
  (`for k in list(d):`) o construye una colección nueva con una comprensión.
- `zip()` SIN `strict=True` TRUNCA EN SILENCIO al iterable más corto: en una
  conciliación eso significa movimientos perdidos sin aviso.
- ITERADORES AGOTADOS: guardar un generador y recorrerlo dos veces da vacío la
  segunda vez. Si necesitas varias pasadas, materializa con `list()`.
- CLOSURES TARDÍOS: `[lambda: i for i in range(3)]` -> todas devuelven 2,
  porque capturan la VARIABLE, no el valor. Usa `lambda i=i: i`.
- `while True` NECESITA UNA SALIDA GARANTIZADA (contador máximo, timeout):
  un bucle infinito en un worker consume CPU y bloquea la cola.
- CONCATENAR `str` EN BUCLES: acumula en una lista y usa `"".join()`.
- COMPRENSIONES LEGIBLES: si necesita más de un `for` y un `if`, o tiene
  efectos secundarios (`print`, escribir en BD), usa un bucle normal.
- `for/else` CONFUNDE A MUCHOS: comenta `# no se encontró` en el `else` o
  extrae la búsqueda a una función con `return` temprano.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Tabla de multiplicar: pide un número y muestra su tabla del 1 al 12 con los
   resultados alineados a la derecha.
2. Menú con `while`: un cajero que muestre opciones (consultar, depositar,
   retirar, salir) hasta que el usuario elija salir, validando cada entrada.
3. Lista numerada: recorre una lista de tareas con `enumerate(start=1)` y
   marca con "[x]" las completadas usando una lista paralela y `zip(strict=True)`.

[Intermedio]
4. Primer agotado con `for/else`: `primer_agotado(inventario: dict) -> str |
   None` que devuelva el primer producto con stock 0 o informe "Todo en stock".
5. Reintentos: `con_reintentos(funcion, intentos=3)` que llame a la función,
   capture `ConnectionError`, espere `2 ** intento` décimas de segundo entre
   intentos y lance la última excepción si todos fallan.
6. Comprensiones de negocio: a partir de una lista de pedidos (dicts), genera
   con comprensiones: lista de IDs pagados, conjunto de ciudades y un dict
   cliente -> total gastado (este último con un bucle si lo ves más claro).
7. Variaciones diarias: con `itertools.pairwise`, calcula la variación
   porcentual día a día de una serie de precios de cierre y marca los días
   con caída mayor al 5 %.

[Senior / Producción]
8. Generador de páginas: `paginar(obtener_pagina)` que llame a una función
   simulada de API con `pagina=1, 2, ...` y haga `yield` de cada registro hasta
   recibir una página vacía; consúmelo con `islice` para traer solo 25 registros
   y verifica que no se pidan páginas de más.
9. Pipeline perezoso de logs: encadena generadores `leer_lineas` ->
   `parsear` -> `filtrar_errores` -> `batched(…, 100)` para procesar un archivo
   de log de 1 GB con memoria constante; mide la memoria con `tracemalloc`.
10. Agrupación de ventas: ordena las ventas por fecha y usa `itertools.groupby`
    para imprimir un reporte por día con subtotal, número de transacciones y
    venta máxima; explica por qué `groupby` exige datos ordenados por la clave.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
