r"""
============================================================================
TEMA 19: MÓDULOS, PAQUETES, `__NAME__`, `SYS.MODULES`, VENV Y `PYPROJECT.TOML`
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: cómo funciona `import` por dentro)
----------------------------------------------------------------------------
1) **Un módulo es un objeto singleton en memoria (`types.ModuleType`)**: cuando
   ejecutas `import ventas`, Python realiza tres pasos:
   - Primero busca `"ventas"` en el diccionario caché `sys.modules`. Si ya
     está ahí, devuelve ese mismo objeto de inmediato (¡el archivo `.py` solo
     se ejecuta de arriba abajo la **primera vez** que se importa en el proceso!).
   - Si no está en `sys.modules`, recorre la lista de directorios `sys.path`
     (primero la carpeta del script de entrada, luego la biblioteca estándar y
     finalmente el `site-packages` del entorno virtual activo).
   - Compila el código fuente a bytecode (`.pyc` dentro de `__pycache__/`) y lo
     ejecuta dentro del espacio de nombres del nuevo módulo.
2) **`import modulo` vs `from modulo import variable`**:
   - `import config` accede siempre a `config.MODO` en el objeto módulo.
   - `from config import MODO` crea una referencia local en tu archivo apuntando
     al valor que tenía `MODO` en ese instante. Si otro módulo reasigna
     `config.MODO = "PROD"`, tu copia local no se entera.
3) **`if __name__ == "__main__":`**: cuando ejecutas `python reporte.py`, el
   intérprete asigna `__name__ = "__main__"` a ese archivo. Si en cambio otro
   archivo hace `import reporte`, entonces `__name__` vale `"reporte"`. Proteger
   el código ejecutable bajo `if __name__ == "__main__":` permite que el archivo
   se pueda importar en pruebas sin disparar efectos secundarios.
4) **Paquetes, entornos virtuales (`venv`) y `pyproject.toml` (PEP 621)**:
   cada proyecto debe tener su propio entorno virtual (`python -m venv .venv`)
   y declarar sus metadatos, dependencias y configuración de herramientas
   (`ruff`, `mypy`, `pytest`) en un único archivo estándar `pyproject.toml`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Estructurar aplicaciones medianas y grandes en paquetes por dominio o capa
  (`app/dominio/`, `app/servicios/`, `app/adaptadores/`) con APIs públicas claras.
- Evitar y resolver errores de **importación circular** (`ImportError: cannot
  import name '...' from partially initialized module`) en proyectos reales.
- Aislar versiones de librerías por proyecto con `.venv` y fijar versiones
  exactas para despliegues reproducibles en Docker y CI/CD.
- Cargar plugins o recursos embebidos con `importlib`.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
import importlib
import sys
from typing import TYPE_CHECKING

# 1. Formas de importación (PEP 8: ordena stdlib -> terceros -> propios)
import pathlib                                     # módulo completo
from collections import Counter                    # símbolo específico
import datetime as dt                              # alias corto

# 2. Importaciones relativas dentro de un paquete (p. ej. dentro de app/servicios/cobro.py)
# from . impuestos import calcular_iva             # mismo directorio
# from ..dominio.modelos import Factura            # directorio padre

# 3. Romper ciclos de importación que solo son para anotaciones de tipos
if TYPE_CHECKING:
    # Este bloque es False en runtime (no importa nada al ejecutar),
    # pero True para mypy / pyright.
    from decimal import Decimal

# 4. Controlar qué exporta `from paquete import *` y documentar la API pública
__all__ = ["calcular_total", " VERSION_MODULO"]
VERSION_MODULO = "1.0.0"

def calcular_total(neto: int) -> int:
    return round(neto * 1.19)

# 5. Punto de entrada del script
if __name__ == "__main__":
    print("Ejecutado directamente:", calcular_total(1000))

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Inspeccionamos en vivo cómo Python cachea los módulos en
`sys.modules`, creamos dinámicamente un módulo de plugins con `types.ModuleType`
y demostramos la diferencia entre importar el módulo (`import m`) e importar un
atributo (`from m import x`) cuando el estado interno cambia.

import sys
import types

# 1. Creamos y registramos un módulo en memoria para simular `config_app.py`
modulo_cfg = types.ModuleType("config_app")
modulo_cfg.TASA_IVA = 0.19                         # type: ignore[attr-defined]
modulo_cfg.obtener_tasa = lambda: modulo_cfg.TASA_IVA  # type: ignore[attr-defined]
sys.modules["config_app"] = modulo_cfg

# 2. Dos estilos de importación sobre el mismo módulo cacheado en sys.modules
import config_app
from config_app import TASA_IVA as tasa_copiada

print("¿Es singleton en sys.modules?:", config_app is sys.modules["config_app"])
print("Antes del cambio -> modulo:", config_app.TASA_IVA, "| copia local:", tasa_copiada)

# Si en runtime se recarga la configuración en el módulo:
config_app.TASA_IVA = 0.21
print("Después del cambio -> modulo:", config_app.TASA_IVA, "| copia local:", tasa_copiada)

# Limpieza del módulo de demostración
del sys.modules["config_app"]

# 3. Ejemplo de pyproject.toml moderno (PEP 621) que usarías en la raíz del proyecto:
PYPROJECT_EJEMPLO = """
[project]
name = "facturacion-core"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []

[tool.ruff]
line-length = 100

[tool.mypy]
strict = true
""".strip()
print("Líneas de pyproject.toml de referencia:", len(PYPROJECT_EJEMPLO.splitlines()))

# Salida esperada:
# ¿Es singleton en sys.modules?: True
# Antes del cambio -> modulo: 0.19 | copia local: 0.19
# Después del cambio -> modulo: 0.21 | copia local: 0.19
# Líneas de pyproject.toml de referencia: 12

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- NUNCA LLAMES A TU ARCHIVO IGUAL QUE UN MÓDULO DE LA BIBLIOTECA ESTÁNDAR: si
  creas `json.py`, `random.py`, `email.py`, `logging.py` o `unittest.py` en tu
  carpeta, como el directorio actual va primero en `sys.path`, cualquier librería
  que haga `import json` importará tu archivo en vez del oficial y fallará con
  `AttributeError: partially initialized module 'json' has no attribute 'dumps'`.
- IMPORTACIONES CIRCULARES (`a.py` importa `b.py` y `b.py` importa `a.py` al
  nivel superior): cuando `a` aún está a mitad de ejecución, `b` intenta hacer
  `from a import Algo` que todavía no se ha definido. Solución: extrae lo común
  a un tercer módulo `comun.py`, o si solo lo necesitas para *type hints*, usa
  `from __future__ import annotations` y `if TYPE_CHECKING:`.
- NUNCA USES `from modulo import *` EN CÓDIGO DE PRODUCCIÓN: contamina el
  espacio de nombres, oculta de dónde viene cada función e impide que los
  linters detecten variables no usadas o colisiones.
- NO EJECUTES CONSULTAS A BASE DE DATOS NI LLAMADAS DE RED EN EL NIVEL SUPERIOR
  DEL MÓDULO: ejecutarse al hacer `import` rompe las pruebas unitarias y hace
  lento el arranque. Mueve la inicialización a una función o a `if __name__ == "__main__":`.
- NO MODIFIQUES `sys.path.append("...")` A MANO EN LOS ARCHIVOS: instala tu
  paquete en modo editable dentro del entorno virtual (`pip install -e .`) o
  ejecuta como módulo desde la raíz del proyecto (`python -m paquete.modulo`).

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Diagnóstico del entorno: escribe una función `info_entorno() -> dict[str, object]`
   que devuelva la versión de Python (`sys.version_info`), el ejecutable actual,
   si está dentro de un entorno virtual (`sys.prefix != sys.base_prefix`) y las
   primeras 3 rutas de `sys.path`.
2. Uso de `__name__`: escribe un módulo utilitario con dos funciones matemáticas
   y un bloque `if __name__ == "__main__":` que ejecute una batería de auto-pruebas
   con `assert` solo cuando se invoque directamente.
3. Inspector de símbolos públicos: dada una referencia a un módulo (p. ej. `math`
   o `json`), devuelve la lista ordenada de sus funciones públicas (nombres en
   `dir(modulo)` que no empiecen con `_` y sean `callable`).

[Intermedio]
4. Detector de sombreado de la stdlib: usando `sys.stdlib_module_names` (Python
   3.10+) y `pathlib.Path`, escribe `detectar_archivos_conflictivos(carpeta: Path)
   -> list[str]` que alerte si algún archivo `.py` del proyecto se llama igual
   que un módulo nativo de Python.
5. Carga dinámica de plugins con `importlib`: implementa `cargar_funcion(
   especificacion: str) -> Callable` que reciba una cadena `"math:sqrt"` o
   `"json:loads"`, importe el módulo con `importlib.import_module` y obtenga el
   atributo con `getattr`, lanzando un error claro si no existe.
6. Demostración y resolución de importación circular: simula con dos módulos
   en un `TemporaryDirectory` un fallo de importación circular al usar
   `from a import X` y muestra cómo se resuelve cambiando a `import a` o
   moviendo la dependencia común a un tercer módulo.
7. API de paquete con `__all__`: diseña en una carpeta temporal un paquete
   `pagos/` con `__init__.py`, `interno.py` y `publico.py` que exponga en
   `pagos.__all__` únicamente las funciones de alto nivel.

[Senior / Producción]
8. Generador y validador de `pyproject.toml`: escribe una función que lea un
   archivo `pyproject.toml` con el módulo nativo `tomllib` (Python 3.11+) y
   verifique que cumpla las políticas del equipo (`requires-python`, modo
   `strict = true` en `[tool.mypy]` y reglas mínimas de `[tool.ruff]`).
9. Registro perezoso de submódulos (`__getattr__` de módulo, PEP 562): implementa
   en un módulo la función especial `def __getattr__(nombre: str):` para cargar
   pesados submódulos bajo demanda solo cuando alguien acceda a ellos por
   primera vez, registrando cuándo se carga cada uno.
10. Auditor de grafo de dependencias internas: usando el módulo `ast` de la
    biblioteca estándar, analiza todos los archivos `.py` de una carpeta para
    extraer sus nodos `ast.Import` y `ast.ImportFrom`, construye el grafo de
    dependencias entre módulos y verifica que la capa `dominio` no importe nada
    de la capa `infraestructura`.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
