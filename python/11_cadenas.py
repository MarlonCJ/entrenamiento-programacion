r"""
============================================================================
TEMA 11: CADENAS DE TEXTO (`str`), UNICODE, SLICING, NORMALIZACIÓN Y `JOIN`
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: Unicode flexible e inmutabilidad)
----------------------------------------------------------------------------
1) **`str` es una secuencia INMUTABLE de puntos de código Unicode**: en Python 3
   un `str` almacena texto (caracteres abstractos), mientras que `bytes` almacena
   octetos crudos (`0..255`). Convertir texto a bytes es **codificar**
   (`s.encode("utf-8")`) y de bytes a texto es **decodificar** (`b.decode("utf-8")`).
2) **Representación flexible de CPython (PEP 393)**: internamente CPython elige
   automáticamente 1, 2 o 4 bytes por carácter según el punto de código más alto
   de la cadena (ASCII/Latin-1 = 1 byte; BMP = 2 bytes; emojis = 4 bytes). Así
   indexar `s[i]` y medir `len(s)` son siempre $O(1)$ en puntos de código.
3) **Inmutabilidad y costo de concatenación**: ningún método modifica la cadena
   original; todos devuelven un `str` nuevo. Hacer `resultado += trozo` dentro
   de un bucle puede degradar a $O(n^2)$ si hay varias referencias; el patrón
   idiomático $O(n)$ es acumular en una lista y unir con `"".join(partes)`.
4) **Comparación sin distinción de mayúsculas y tildes**:
   - `s.casefold()` es más agresivo y correcto que `s.lower()` para Unicode
     internacional (p. ej. `'ß'.casefold() == 'ss'`).
   - Un carácter acentuado puede representarse como un único punto de código
     (`NFC`: `'é'` = U+00E9) o descompuesto (`NFD`: `'e'` + tilde combinante
     U+0301, habitual en macOS). Antes de comparar o indexar texto externo,
     normaliza con `unicodedata.normalize("NFC", texto)`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Limpieza y normalización de formularios (nombres, correos, teléfonos, códigos
  postales) antes de guardar en la base de datos.
- Generación de slugs para URLs amigables eliminando acentos con `NFD` y
  categorías Unicode (`Mn`).
- Motores de búsqueda interna insensibles a mayúsculas y tildes (`casefold`).
- Construcción de reportes CSV, consultas parametrizadas o plantillas de correo
  de alto volumen con `"".join(...)`.
- Parseo de cabeceras, rutas o claves con `partition`, `split`, `removeprefix`
  y `removesuffix` (Python 3.9+).

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
import unicodedata

texto = "  Factura #0042 - Pagada  "
limpio = texto.strip()                             # quita espacios en extremos
prefijo_fuera = limpio.removeprefix("Factura ")    # '#0042 - Pagada' (3.9+)
sufijo_fuera = limpio.removesuffix(" - Pagada")    # 'Factura #0042' (3.9+)

# Slicing: cadena[inicio:fin:paso] (crea una cadena nueva, nunca lanza IndexError)
codigo = "PROD-2026-CO"
tipo = codigo[:4]                                  # 'PROD'
pais = codigo[-2:]                                 # 'CO'
invertido = codigo[::-1]                           # 'OC-6202-DORP'

# División y unión eficiente O(n)
clave, sep, valor = "DB_HOST=db.interno=5432".partition("=")
# clave='DB_HOST', sep='=', valor='db.interno=5432' (solo corta en el primero)
csv = ",".join(["SKU-1", "Teclado", "150000"])     # 'SKU-1,Teclado,150000'

# Búsqueda y verificación
es_prefijo = codigo.startswith(("PROD-", "SERV-")) # acepta tupla de prefijos
pos = codigo.find("2026")                          # 5 (-1 si no existe; .index lanza ValueError)

# Unicode: bytes <-> str y normalización
crudo: bytes = "Canción".encode("utf-8")           # b'Canci\xc3\xb3n' (8 bytes)
recuperado: str = crudo.decode("utf-8")            # 'Canción' (7 code points)
nfc = unicodedata.normalize("NFC", "e\u0301")      # 'é' (longitud 1)

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un sistema de comercio electrónico normaliza títulos de productos
para generar slugs de URL sin tildes, enmascara correos electrónicos de clientes
para los logs de auditoría y exporta un lote en formato CSV con `join`.

import unicodedata

def quitar_tildes(texto: str) -> str:
    descompuesto = unicodedata.normalize("NFD", texto)
    return "".join(c for c in descompuesto if unicodedata.category(c) != "Mn")

def generar_slug(titulo: str) -> str:
    base = quitar_tildes(titulo).casefold().strip()
    caracteres = [c if c.isalnum() else " " for c in base]
    palabras = "".join(caracteres).split()         # colapsa espacios múltiples
    return "-".join(palabras)

def enmascarar_email(correo: str) -> str:
    usuario, sep, dominio = correo.strip().casefold().partition("@")
    if not sep or not usuario or "." not in dominio:
        raise ValueError(f"Correo inválido: {correo!r}")
    visible = usuario[0] + "***" if len(usuario) > 1 else "*"
    return f"{visible}@{dominio}"

# Demostración de NFC vs NFD (macOS envía NFD con frecuencia)
titulo_mac = "Cafe\u0301 Molido  Premium (500g)!"
titulo_linux = "Café Molido  Premium (500g)!"
print("¿Iguales sin normalizar?:", titulo_mac == titulo_linux)
print("¿Iguales en NFC?:", unicodedata.normalize("NFC", titulo_mac) == titulo_linux)
print("Slug generado:", generar_slug(titulo_mac))
print("Email enmascarado:", enmascarar_email("  Valentina.Rios@Empresa.CO "))

filas_csv = [
    ";".join([ str(id_p), generar_slug(nombre), f"{precio:.2f}" ])
    for id_p, nombre, precio in [(101, "Cámara Ágil 4K", 899.9), (102, "Trípode Pro", 120.0)]
]
print("CSV:\n" + "\n".join(filas_csv))

# Salida esperada:
# ¿Iguales sin normalizar?: False
# ¿Iguales en NFC?: True
# Slug generado: cafe-molido-premium-500g
# Email enmascarado: v***@empresa.co
# CSV:
# 101;camara-agil-4k;899.90
# 102;tripode-pro;120.00

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- NUNCA USES `strip("prefijo")` PARA QUITAR UNA PALABRA: `strip()`, `lstrip()` y
  `rstrip()` reciben un **conjunto de caracteres**, no una subcadena.
  `"producto_id".removeprefix("prod_")` da `"ucto_id"` si usas `lstrip("prod_")`
  porque borra cualquier `'p'`, `'r'`, `'o'`, `'d'`, `'_'` del inicio. Usa
  siempre `removeprefix()` y `removesuffix()` (Python 3.9+).
- `split()` vs `split(" ")`: `texto.split()` sin argumentos agrupa cualquier
  cantidad de espacios, tabulaciones y saltos de línea consecutivos; en cambio
  `texto.split(" ")` deja cadenas vacías `""` cuando hay dos espacios seguidos.
- `isdigit()` vs `isnumeric()` vs `isdecimal()`: `"²".isdigit()` y `"½".isnumeric()`
  son `True`, pero `int("²")` lanza `ValueError`. Si quieres saber si una
  cadena son dígitos base 10 convertibles con `int()`, usa `s.isdecimal()`.
- CONCATENACIÓN DE LITERALES IMPLÍCITA EN LISTAS: olvidar una coma en
  `["uno" "dos", "tres"]` es válido en Python y produce `["unodos", "tres"]`
  en silencio. Revisa siempre las listas de strings multilínea con un linter.
- ESPECIFICA SIEMPRE `encoding="utf-8"` al abrir archivos o convertir bytes;
  dejar el valor por defecto depende de la configuración regional del sistema.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Normalizador de nombres: escribe `formatear_nombre(crudo: str) -> str` que
   elimine espacios extra (incluso intermedios múltiples) y devuelva el nombre
   en formato título (`"  jUAN   pÉREZ "` -> `"Juan Pérez"`).
2. Extractor de extensión seguro: implementa `obtener_extension(archivo: str) ->
   str` usando `rpartition(".")` que devuelva la extensión en minúsculas sin el
   punto o `""` si no tiene extensión o empieza con punto (`".gitignore"` -> `""`).
3. Palíndromo Unicode: crea `es_palindromo(frase: str) -> bool` que ignore
   espacios, signos de puntuación, tildes y mayúsculas (`"¡Dábale arroz a la
   zorra el abad!"` -> `True`).

[Intermedio]
4. Limpiador de prefijos y sufijos: dada una lista de rutas como
   `"https://cdn.tienda.com/img/zapato.png"`, usa `removeprefix` y `removesuffix`
   para extraer el nombre limpio (`"img/zapato"`).
5. Buscador insensible a acentos: implementa `buscar_productos(catalogo:
   list[str], consulta: str) -> list[str]` usando `quitar_tildes` y `casefold()`.
6. Generador de tabla Markdown: escribe `tabla_markdown(encabezados: list[str],
   filas: list[list[str]]) -> str` que calcule el ancho máximo de cada columna,
   rellene con `.ljust()` / `.rjust()` y una todo con `"\n".join(...)`.
7. Compresor Run-Length (RLE): implementa `comprimir_rle(texto: str) -> str` y
   `descomprimir_rle(rle: str) -> str` (p. ej. `"aaabbc"` <-> `"a3b2c1"`) usando
   una lista acumuladora y `"".join()`.

[Senior / Producción]
8. Sanitizador de logs (prevención de Log Injection y enmascarado PII): escribe
   `sanitizar_linea_log(mensaje: str) -> str` que reemplace saltos de línea `\r`
   y `\n` por secuencias escapadas `\\r` y `\\n`, normalice a `NFC` y oculte
   números de tarjeta de 16 dígitos dejando solo los últimos 4.
9. Parser de DSN de base de datos sin regex: usando únicamente `partition`,
   `rpartition` y `split`, implementa `parsear_dsn(dsn: str) -> dict[str, str | int]`
   para cadenas del tipo `"postgresql://usuario:clave@db.prod.local:5432/ventas"`
   validando cada componente.
10. Comparador de rendimiento de construcción de texto: mide con `timeit` y
    `tracemalloc` la creación de un documento de 200 000 líneas usando `+=`,
    `"".join(lista)` e `io.StringIO`, y documenta en qué escenario conviene
    cada técnica.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
