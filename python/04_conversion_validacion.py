r"""
============================================================================
TEMA 04: CONVERSIÓN EXPLÍCITA, TIPADO FUERTE, EAFP Y VALIDACIÓN DEFENSIVA
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: tipado dinámico pero FUERTE)
----------------------------------------------------------------------------
Python casi nunca convierte tipos por ti. `"3" + 4` no da "34" ni 7: lanza
`TypeError`. Esta "fortaleza" elimina toda una familia de bugs de JavaScript o
PHP, pero obliga a convertir EXPLÍCITAMENTE todo lo que llega del exterior
(formularios, CSV, variables de entorno, JSON, `input()`):

1) **Constructores como conversores**: `int()`, `float()`, `str()`, `bool()`,
   `Decimal()`, `list()`... Cada uno llama al protocolo del objeto
   (`__int__`, `__index__`, `__float__`, `__str__`, `__bool__`).
2) **Las únicas coerciones implícitas** son numéricas y seguras:
   `bool` -> `int` -> `float` -> `complex` (`True + 1.5 == 2.5`). Además, la
   "veracidad" (truthiness) en `if`/`while` llama a `__bool__` o `__len__`.
3) **`int()` es estricto pero tiene matices**: acepta espacios y guiones bajos
   (`int(" 1_000 ") == 1000`), una base (`int("ff", 16) == 255`, `int("0b101",
   0) == 5`), pero rechaza decimales en texto (`int("4.5")` -> `ValueError`).
   Con un float TRUNCA hacia cero: `int(-4.9) == -4`.
4) **`float()` acepta "nan", "inf" y notación científica**: `float("1e3")` es
   `1000.0` y `float("nan")` es válido... y peligroso si no lo filtras.
5) **`bool(texto)` NO interpreta el texto**: `bool("False")` es `True` porque
   cualquier `str` no vacío es verdadero. Hay que parsear explícitamente.
6) **EAFP vs LBYL**: la cultura de Python prefiere *"Easier to Ask Forgiveness
   than Permission"*: intenta convertir y captura `ValueError`, en vez de
   validar con `str.isdigit()` (que falla con negativos, decimales y acepta
   "²" que luego `int()` rechaza).

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Importación masiva de CSV/Excel de proveedores: cantidades con espacios,
  precios con coma decimal ("19,90"), celdas vacías, "N/A".
- Variables de entorno: `os.environ` SIEMPRE devuelve `str`; `DEBUG="false"`
  es verdadero si haces `bool(os.environ["DEBUG"])`.
- APIs: validar el payload en el borde del sistema y trabajar con tipos
  limpios dentro (en proyectos grandes con Pydantic o dataclasses + validación).
- Dinero: convertir montos a `Decimal` desde `str`, nunca desde `float`.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
from decimal import Decimal, InvalidOperation

int("42")              # 42
int("  -7 ")           # -7   (espacios permitidos)
int("1_500")           # 1500 (guiones bajos permitidos)
int("ff", 16)          # 255
int(9.99)              # 9    (trunca, no redondea)
float("3.14")          # 3.14
float("1e-3")          # 0.001
str(3.0)               # '3.0'
Decimal("0.1")         # Decimal('0.1')  exacto
Decimal(0.1)           # Decimal('0.1000000000000000055511151231257827...')
bool("")               # False
bool("0")              # True   (¡cadena no vacía!)
list("abc")            # ['a', 'b', 'c']

isinstance(x, (int, float)) and not isinstance(x, bool)   # "es número real"

def a_bool(texto: str) -> bool:                           # parseo explícito
    valor = texto.strip().lower()
    if valor in {"1", "true", "sí", "si", "yes", "on"}:
        return True
    if valor in {"0", "false", "no", "off", ""}:
        return False
    raise ValueError(f"booleano inválido: {texto!r}")

try:                                                     # estilo EAFP
    edad = int(texto_edad)
except ValueError:
    edad = None

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un importador de inventario recibe filas de un CSV de proveedor con
datos sucios. Debe aceptar las válidas y reportar las inválidas sin detenerse.

from decimal import Decimal, InvalidOperation

def parsear_cantidad(texto: str) -> int:
    valor = int(texto.strip())
    if valor <= 0:
        raise ValueError(f"cantidad no positiva: {valor}")
    return valor

def parsear_precio(texto: str) -> Decimal:
    try:
        precio = Decimal(texto.strip().replace(",", "."))
    except InvalidOperation:
        raise ValueError(f"precio inválido: {texto!r}") from None
    if not precio.is_finite() or precio < 0:
        raise ValueError(f"precio fuera de rango: {texto!r}")
    return precio.quantize(Decimal("0.01"))

filas = [
    ("SKU-1", " 3 ", "19,90"),
    ("SKU-2", "dos", "5.00"),
    ("SKU-3", "1", "NaN"),
    ("SKU-4", "2", "7.5"),
]

validas, errores = [], []
for sku, cantidad_txt, precio_txt in filas:
    try:
        cantidad = parsear_cantidad(cantidad_txt)
        precio = parsear_precio(precio_txt)
    except ValueError as error:
        errores.append(f"{sku}: {error}")
        continue
    validas.append((sku, cantidad, precio))

for sku, cantidad, precio in validas:
    print(f"{sku} -> {cantidad} x {precio} = {cantidad * precio}")
print(*errores, sep="\n")

# Salida esperada:
# SKU-1 -> 3 x 19.90 = 59.70
# SKU-4 -> 2 x 7.50 = 15.00
# SKU-2: invalid literal for int() with base 10: 'dos'
# SKU-3: precio fuera de rango: 'NaN'

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- `Decimal(0.1)` HEREDA EL ERROR DEL FLOAT: construye siempre desde `str`
  (`Decimal("0.1")`) o desde `int`.
- `Decimal("NaN") < 0` LANZA `InvalidOperation` (los NaN "señalizan" al
  comparar con orden). Por eso el ejemplo comprueba `is_finite()` PRIMERO y el
  cortocircuito de `or` evita la comparación.
- `float("nan")` PASA CUALQUIER `try/except`: es un float válido. Filtra con
  `math.isfinite(x)` cuando la entrada venga de usuarios.
- NO ATRAPES `Exception` A CIEGAS: captura `ValueError`/`TypeError`
  concretos; un `except:` desnudo oculta bugs reales e incluso `KeyboardInterrupt`.
- `raise ... from None` oculta la excepción interna cuando ya la traduces a un
  mensaje de dominio; `from error` la encadena cuando quieres conservar la causa.
- `str.isdigit()` NO ES VALIDACIÓN NUMÉRICA: `"-5".isdigit()` es `False` y
  `"²".isdigit()` es `True`. Intenta convertir y captura el error.
- `int(round(x))` vs `int(x)`: `int()` trunca; si necesitas redondear, decide
  la regla (ver tema 05) y hazlo explícito.
- Valida en el BORDE (entrada del sistema) y confía en los tipos dentro: no
  repitas `isinstance` en cada función interna.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Calculadora de edad: pide el año de nacimiento con `input()`, conviértelo con
   `int()` y muestra la edad; si el texto no es numérico, muestra un mensaje
   amable en lugar de un traceback.
2. Tabla de conversiones: imprime el resultado (o el nombre de la excepción) de
   `int("12")`, `int("12.5")`, `float("12,5")`, `int(12.9)`, `bool("False")`,
   `int("0x1F", 16)` y `int("1_000")`.
3. Suma de precios con coma: convierte la lista `["1.200,50", "350,00",
   "99,99"]` (formato latino) a `Decimal` y muestra la suma.

[Intermedio]
4. `a_bool(texto: str) -> bool` para variables de entorno: acepta variantes en
   español e inglés sin importar mayúsculas y lanza `ValueError` en otro caso.
5. `leer_entero(prompt, minimo, maximo) -> int`: repite la pregunta hasta que
   el usuario escriba un entero dentro del rango, informando el motivo del error.
6. `es_numero(valor) -> bool`: devuelve `True` para `int`, `float` y `Decimal`
   finitos, y `False` para `bool`, `str`, `None`, `nan` e `inf`.
7. Normalizador de teléfonos: `normalizar_telefono(texto) -> str` que elimine
   espacios, guiones y paréntesis, quite el prefijo "+57" si existe y valide que
   queden exactamente 10 dígitos.

[Senior / Producción]
8. Validador de payload: `validar_pedido(datos: dict) -> dict` que reciba JSON
   ya decodificado, convierta `cantidad` a `int`, `precio` a `Decimal` y
   `fecha` a `datetime.date` (`date.fromisoformat`), acumulando TODOS los errores
   en una lista y lanzando una excepción propia `ErrorValidacion` con ellos.
9. Lector de configuración tipada: dado un diccionario de esquema
   `{"PUERTO": int, "DEBUG": a_bool, "TASA": Decimal}`, escribe
   `cargar(entorno: dict[str, str], esquema) -> dict` que aplique cada
   conversor e indique la variable y el valor que fallaron.
10. Importador CSV con reporte: lee un CSV con `csv.DictReader`, separa filas
    válidas e inválidas (con número de línea y motivo), y escribe las inválidas
    en `rechazados.csv` para que el proveedor las corrija.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
