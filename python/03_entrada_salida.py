r"""
============================================================================
TEMA 03: ENTRADA, SALIDA, F-STRINGS, MINILENGUAJE DE FORMATO Y FLUJOS ESTÁNDAR
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: stdin, stdout y stderr)
----------------------------------------------------------------------------
Todo proceso tiene tres flujos de texto que Python expone en el módulo `sys`:
`sys.stdin` (entrada), `sys.stdout` (salida normal) y `sys.stderr` (errores y
diagnóstico). Las funciones de alto nivel son atajos sobre ellos:

1) **`input(prompt)`**: escribe el prompt en stdout, lee UNA línea de stdin y
   la devuelve SIEMPRE como `str`, sin el salto de línea final. Si el flujo se
   cierra (Ctrl+D / Ctrl+Z, o una tubería vacía) lanza `EOFError`.
2) **`print(*objetos, sep=" ", end="\n", file=sys.stdout, flush=False)`**:
   convierte cada objeto con `str()`, los une con `sep`, añade `end` y escribe
   en `file`. stdout usa búfer: en una terminal se vacía por línea, pero en una
   tubería o contenedor Docker se vacía por bloques (de ahí `flush=True` o la
   variable `PYTHONUNBUFFERED=1` para ver los logs al instante).
3) **Texto vs bytes**: los flujos estándar son `TextIOWrapper` que codifican
   con `sys.stdout.encoding` (UTF-8 en sistemas modernos; en Windows antiguos
   podía ser cp1252 y romper las tildes). `sys.stdout.buffer` da acceso a bytes.
4) **f-strings (PEP 498, formalizadas en la gramática en 3.12 / PEP 701)**:
   `f"{expresion!conversion:formato}"`. Se evalúan en tiempo de ejecución,
   son la forma más rápida y legible de interpolar. Desde 3.12 puedes reutilizar
   el mismo tipo de comillas dentro de las llaves.
5) **Minilenguaje de formato**: `[[relleno]alineación][signo][#][0][ancho]
   [agrupación][.precisión][tipo]`. Lo comparten f-strings, `str.format()` y
   `format()`. Ej.: `f"{1234567.891:>15,.2f}"` -> `   1,234,567.89`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Herramientas CLI internas (scripts de migración, conciliaciones bancarias)
  que piden confirmación con `input()` antes de una operación destructiva.
- Reportes de texto alineados: recibos, resúmenes de cierre de caja, tablas
  de métricas enviadas por correo o Slack.
- Separar datos de diagnóstico: el resultado útil va a stdout (para poder
  hacer `script.py > reporte.csv`) y los avisos a stderr.
- Procesamiento por tuberías: `cat ventas.csv | python resumen.py` leyendo
  `for linea in sys.stdin:` sin cargar todo el archivo en memoria.
- En servicios reales, `print` se reemplaza por el módulo `logging` (niveles,
  marcas de tiempo, destinos configurables).

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
import sys

nombre = input("Nombre del cliente: ").strip()      # siempre str
edad = int(input("Edad: "))                         # convertir explícitamente

print("A", "B", "C", sep=" | ")        # A | B | C
print("Procesando...", end="", flush=True)
print("Aviso: saldo bajo", file=sys.stderr)

saldo = 1234567.891
f"{saldo:,.2f}"           # '1,234,567.89'   agrupación y 2 decimales
f"{saldo:>15,.2f}"        # alineado a la derecha en 15 caracteres
f"{'SKU':<8}|"            # 'SKU     |'      alineado a la izquierda
f"{'OK':*^8}"             # '***OK***'       centrado con relleno
f"{0.0725:.1%}"           # '7.2%'           porcentaje (0.0725 no es exacto en binario)
f"{42:05d}"               # '00042'          ceros a la izquierda
f"{255:#x} {255:08b}"     # '0xff 11111111'  hexadecimal y binario
f"{nombre!r}"             # repr: muestra comillas y caracteres ocultos
f"{saldo=:.1f}"           # 'saldo=1234567.9' (modo depuración, 3.8+)

from pprint import pprint
pprint({"cliente": "ACME", "pedidos": list(range(30))}, width=60)  # salida legible

for linea in sys.stdin:               # leer una tubería línea a línea
    procesar(linea.rstrip("\n"))

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: El punto de venta de una tienda de barrio imprime un recibo de
40 columnas para una impresora térmica.

productos = [
    ("Café de origen", 2, 18_500),
    ("Pan artesanal", 3, 4_200),
    ("Queso campesino", 1, 12_900),
]

ANCHO = 40
print(f"{' RECIBO N.º 0042 ':=^{ANCHO}}")

total = 0
for nombre, cantidad, precio in productos:
    subtotal = cantidad * precio
    total += subtotal
    print(f"{nombre:<20}{cantidad:>3}{subtotal:>17,}")

print("-" * ANCHO)
print(f"{'TOTAL':<23}{total:>17,}")
print("Pago", "Tarjeta", "Aprobado", sep=" | ")
print(f"{total=}")

# Salida esperada:
# =========== RECIBO N.º 0042 ============
# Café de origen        2           37,000
# Pan artesanal         3           12,600
# Queso campesino       1           12,900
# ----------------------------------------
# TOTAL                             62,500
# Pago | Tarjeta | Aprobado
# total=62500

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- `input()` DEVUELVE `str`: `input("Edad: ") + 1` lanza `TypeError`. Convierte
  y valida (tema 04). Y aplica `.strip()`: los usuarios pegan espacios.
- `eval(input())` ESTÁ PROHIBIDO: ejecuta código arbitrario. Para literales
  usa `int()`, `float()`, `json.loads()` o `ast.literal_eval()`.
- FORMATO REGIONAL: `:,` usa coma de miles al estilo inglés. Para "62.500" en
  español: `f"{n:,}".replace(",", ".")` en algo simple, o `locale` / la librería
  Babel en aplicaciones multi-país. Nunca formatees montos con `str(float)`.
- `%` Y `.format()` SIGUEN EXISTIENDO: los verás en código antiguo y en
  `logging` (`log.info("Usuario %s", user)`), donde la interpolación perezosa
  es preferible a una f-string porque solo se formatea si el nivel está activo.
- LOGS QUE NO APARECEN EN DOCKER: stdout con búfer de bloque. Usa
  `flush=True`, `python -u` o `PYTHONUNBUFFERED=1`.
- `print` CON MUCHOS DATOS ES LENTO: para miles de líneas construye una lista
  y escribe una vez con `"\n".join(lineas)` o `sys.stdout.writelines`.
- CARACTERES DE ANCHO DOBLE (emojis, CJK) rompen la alineación por ancho de
  columna: `len()` cuenta puntos de código, no columnas visibles.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Saludo personalizado: pide nombre y ciudad con `input()`, límpialos con
   `.strip().title()` y muestra "Bienvenida, Ana, desde Cali".
2. Barra de progreso simple: imprime "Cargando" seguido de 5 puntos en la MISMA
   línea usando `end=""` y `flush=True`, y termina con " listo".
3. Ficha de producto: con nombre, precio y descuento, imprime el precio con
   2 decimales y separador de miles, y el descuento como porcentaje (`:.0%`).

[Intermedio]
4. `formatear_cop(valor: int) -> str`: devuelve el monto como "$ 1.250.000"
   (punto de miles, sin decimales) y pruébalo con 0, 999 y 12_345_678.
5. Tabla de calificaciones: dada una lista de tuplas (estudiante, nota),
   imprime una tabla con encabezado centrado, nombres a la izquierda, notas a la
   derecha con 1 decimal y una fila final de promedio.
6. Depuración con `=`: dados `subtotal`, `iva` y `total`, imprime sus valores
   con `f"{variable=}"` y aplica formato `:.2f` dentro del mismo especificador.
7. Separar flujos: escribe `procesar(lineas)` que envíe a stdout las líneas
   válidas y a stderr un aviso por cada línea vacía; ejecútalo redirigiendo
   stdout a un archivo y comprueba que los avisos siguen saliendo en pantalla.

[Senior / Producción]
8. Filtro de tubería: crea `resumen_ventas.py` que lea un CSV por `sys.stdin`
   (`fecha,producto,monto`), ignore el encabezado y sume por producto,
   imprimiendo un reporte alineado. Pruébalo con `type ventas.csv | python ...`.
9. Confirmación robusta: `confirmar(pregunta: str) -> bool` que acepte s/si/sí/n/no
   sin importar mayúsculas, repita ante respuestas inválidas y devuelva `False`
   si recibe `EOFError` o `KeyboardInterrupt`.
10. Reporte con `logging`: configura `logging.basicConfig` con formato
    `%(asctime)s %(levelname)s %(message)s`, registra INFO/WARNING/ERROR de un
    proceso de facturación simulado y explica por qué se usa `%s` y no f-strings.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
