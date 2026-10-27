r"""
============================================================================
TEMA 18: ARCHIVOS, `PATHLIB`, CONTEXT MANAGERS, CSV/JSON Y ESCRITURA ATÓMICA
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: descriptores, buffers y pathlib)
----------------------------------------------------------------------------
1) **Rutas como objetos con `pathlib.Path`**: concatenar rutas con `+` o `"\\"`
   rompe el código entre Windows y Linux. `Path("datos") / "2026" / "ventas.csv"`
   adapta el separador al sistema operativo y ofrece métodos directos
   (`.exists()`, `.is_file()`, `.read_text()`, `.glob()`, `.stem`, `.suffix`).
2) **Descriptores del sistema operativo y `with` (*Context Manager*)**: abrir un
   archivo reserva un recurso escaso del SO (*file descriptor*). El bloque
   `with open(...) as f:` ejecuta `f.__enter__()` al entrar y garantiza que
   `f.__exit__()` vacíe el buffer a disco (`flush`) y cierre el archivo incluso
   si ocurre una excepción en medio.
3) **Codificación explícita (`encoding="utf-8"`)**: nunca llames a `open()` o
   `Path.read_text()` sin indicar `encoding="utf-8"`. En Windows la codificación
   por defecto histórica (`cp1252`) corrompe tildes, eñes y emojis.
4) **Lectura en streaming ($O(1)$ RAM) vs lectura total (`read()`)**: iterar
   directamente `for linea in archivo:` lee línea a línea desde el buffer sin
   cargar un archivo de 10 GB en memoria.
5) **Escritura atómica (prevención de archivos truncados)**: abrir un archivo
   importante con `"w"` lo trunca a 0 bytes de inmediato; si el proceso muere a
   mitad de escritura, pierdes tanto el archivo viejo como el nuevo. El patrón
   de producción es escribir en un archivo temporal en el mismo directorio y
   reemplazarlo atómicamente con `os.replace(temp, destino)`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Procesamiento de extractos bancarios o logs masivos en formato CSV o JSON
  Lines (`.jsonl`, un objeto JSON por línea) en streaming.
- Guardado seguro de archivos de configuración, estados locales o cachés en
  disco mediante escritura atómica (`tempfile` + `os.replace`).
- Exploración y limpieza de directorios (rotación de backups, búsqueda de
  facturas por extensión con `Path.rglob("*.pdf")`).
- Creación de archivos temporales en pruebas unitarias con `tempfile.TemporaryDirectory()`.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
import csv, json, os, tempfile
from pathlib import Path

# 1. Operaciones modernas con pathlib.Path
base = Path("almacen") / "reportes"
base.mkdir(parents=True, exist_ok=True)            # crea carpetas si no existen
ruta_txt = base / "resumen.txt"
ruta_txt.write_text("Cierre OK\n", encoding="utf-8")
contenido = ruta_txt.read_text(encoding="utf-8")
 nombre_sin_ext = ruta_txt.stem                     # 'resumen' | .suffix -> '.txt'

# 2. Lectura en streaming línea a línea (memoria constante O(1))
with ruta_txt.open("r", encoding="utf-8") as archivo:
    for numero, linea in enumerate(archivo, start=1):
        limpia = linea.rstrip("\r\n")

# 3. CSV con DictReader y DictWriter (newline="" es obligatorio en Windows)
ruta_csv = base / "inventario.csv"
with ruta_csv.open("w", encoding="utf-8", newline="") as f:
    escritor = csv.DictWriter(f, fieldnames=["sku", "stock"])
    escritor.writeheader()
    escritor.writerow({"sku": "A1", "stock": 10})

# 4. JSON con formato legible y caracteres Unicode intactos
datos = {"tienda": "Bogotá", "activo": True}
texto_json = json.dumps(datos, ensure_ascii=False, indent=2)

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un proceso de cierre contable procesa un archivo `.jsonl` de ventas
en un directorio temporal, calcula el resumen por ciudad y guarda el estado
final usando **escritura atómica** para que un corte de energía nunca deje el
archivo de cierre corrupto.

import json
import os
from pathlib import Path
import tempfile

def escribir_json_atomico(destino: Path, datos: dict[str, object]) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)
    # Se crea el temporal en el MISMO directorio para que os.replace sea atómico
    fd, ruta_tmp = tempfile.mkstemp(dir=destino.parent, prefix=".tmp_", suffix=".json")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())                   # fuerza volcado físico a disco
        os.replace(ruta_tmp, destino)              # reemplazo atómico POSIX/Windows
    except Exception:
        if os.path.exists(ruta_tmp):
            os.unlink(ruta_tmp)
        raise

with tempfile.TemporaryDirectory() as tmp_dir:
    carpeta = Path(tmp_dir)
    ruta_eventos = carpeta / "ventas.jsonl"
    ruta_cierre = carpeta / "cierre_diario.json"

    # Escribimos 3 eventos en formato JSON Lines (streaming friendly)
    lineas = [
        json.dumps({"ciudad": "Medellín", "monto": 120_000}, ensure_ascii=False),
        json.dumps({"ciudad": "Bogotá", "monto": 85_000}, ensure_ascii=False),
        json.dumps({"ciudad": "Medellín", "monto": 45_000}, ensure_ascii=False),
    ]
    ruta_eventos.write_text("\n".join(lineas) + "\n", encoding="utf-8")

    # Leemos en streaming línea a línea sin cargar todo el archivo de golpe
    totales: dict[str, int] = {}
    with ruta_eventos.open("r", encoding="utf-8") as f:
        for linea in f:
            evento = json.loads(linea)
            ciudad = evento["ciudad"]
            totales[ciudad] = totales.get(ciudad, 0) + int(evento["monto"])

    escribir_json_atomico(ruta_cierre, {"totales_por_ciudad": totales})
    leido = json.loads(ruta_cierre.read_text(encoding="utf-8"))
    print("Cierre guardado atómicamente:", leido)
    print("Archivos en carpeta:", [p.name for p in sorted(carpeta.iterdir())])

# Salida esperada:
# Cierre guardado atómicamente: {'totales_por_ciudad': {'Medellín': 165000, 'Bogotá': 85000}}
# Archivos en carpeta: ['cierre_diario.json', 'ventas.jsonl']

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- OLVIDAR `newline=""` AL ESCRIBIR CSV EN WINDOWS: sin `newline=""`, el módulo
  `csv` escribe `\r\r\n` y aparecen filas en blanco intercaladas al abrir el
  archivo en Excel.
- VULNERABILIDAD DE PATH TRAVERSAL (`../../etc/passwd`): si construyes una ruta
  con el nombre enviado por un usuario (`carpeta_base / nombre_usuario`), un
  atacante puede mandar `"../../secreto.env"`. Resuelve siempre la ruta con
  `ruta = (carpeta_base / nombre).resolve()` y verifica que siga dentro de la
  base con `ruta.is_relative_to(carpeta_base.resolve())` (Python 3.9+).
- `json.dumps` ESCAPA TILDES POR DEFECTO (`\u00f3`): pasa `ensure_ascii=False`
  para conservar caracteres UTF-8 legibles.
- `f.read()` o `f.readlines()` EN ARCHIVOS GRANDES: cargan todo el archivo en
  RAM y pueden tumbar el contenedor por `MemoryError` (OOM). Itera el archivo
  línea a línea (`for linea in f:`) o por bloques de bytes (`while bloque := f.read(65536):`).
- NUNCA USES `pickle` CON ARCHIVOS DE ORIGEN NO CONFIABLE: `pickle.loads()`
  permite ejecución arbitraria de código remoto al deserializar. Usa JSON, CSV,
  SQLite o Parquet.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Explorador de directorio con `pathlib`: escribe `resumir_carpeta(ruta: Path)
   -> dict[str, int]` que cuente cuántos archivos hay por cada extensión
   (`.py`, `.md`, `.json`) ignorando subdirectorios ocultos que empiecen con `.`.
2. Numerador de líneas: lee un archivo de texto en streaming y genera otro
   archivo con cada línea precedida por su número (`0001: ...`) sin usar
   `.readlines()`.
3. Conversor de CSV a JSON: lee un archivo CSV con `csv.DictReader` y guárdalo
   como lista de objetos JSON con `indent=2` y `ensure_ascii=False`.

[Intermedio]
4. Validador contra Path Traversal: implementa `ruta_segura(directorio_base:
   Path, ruta_solicitada: str) -> Path` que devuelva la ruta resuelta si está
   dentro de `directorio_base` (con `.is_relative_to()`) o lance `PermissionError`.
5. Procesador de JSON Lines (`.jsonl`) tolerante a fallos: lee un archivo
   `.jsonl` línea a línea, acumula los registros válidos y guarda las líneas
   corruptas (con su número de línea y motivo) en `errores.log`.
6. Context manager propio con `@contextlib.contextmanager`: escribe
   `directorio_trabajo_temporal()` que cree una carpeta temporal, la entregue
   al bloque `with` y garantice su limpieza al salir.
7. Cálculo de hash SHA-256 en streaming: implementa `sha256_archivo(ruta: Path)
   -> str` leyendo en bloques de 64 KB (`f.read(65536)`) con `hashlib.sha256()`
   para que funcione con archivos de cualquier tamaño usando memoria mínima.

[Senior / Producción]
8. Escritura atómica con backup rotativo: amplía `escribir_json_atomico` para
   que, si el archivo destino ya existía, conserve hasta 3 versiones previas
   (`.bak.1`, `.bak.2`, `.bak.3`) antes de reemplazarlo.
9. Unificador (*merge*) de múltiples archivos CSV en streaming: recibe una lista
   de rutas CSV con millones de filas, valida que todos compartan los mismos
   encabezados y escríbelos en un único CSV de salida sin cargar más de una fila
   en memoria a la vez, reportando el total de filas procesadas.
10. Bloqueo de archivo y bitácora append-only con suma de verificación: diseña
    una clase `BitacoraAuditoria` que añada eventos en formato `.jsonl` donde
    cada línea incluya el hash SHA-256 de la línea anterior (cadena de custodia)
    y un método `verificar_integridad() -> bool` que detecte si alguien editó o
    borró una línea del archivo.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
