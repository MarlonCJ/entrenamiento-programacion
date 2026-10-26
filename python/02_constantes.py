r"""
============================================================================
TEMA 02: CONSTANTES, typing.Final, ENUM E INMUTABILIDAD SUPERFICIAL VS PROFUNDA
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: Python no tiene "const")
----------------------------------------------------------------------------
Python NO tiene una palabra reservada para constantes. Cualquier nombre puede
re-enlazarse en tiempo de ejecución. La "constancia" se logra combinando tres
capas, y un Senior sabe qué protege cada una:

1) **Convención (PEP 8)**: `MAYUSCULAS_CON_GUIONES` a nivel de módulo
   (`IVA = 0.19`). Es un contrato social: el intérprete no lo impide.
2) **`typing.Final` (análisis estático)**: `TASA: Final = 0.19` hace que mypy o
   pyright marquen como error cualquier reasignación. En ejecución NO hay
   protección: `TASA = 1` funciona igual. Es una herramienta de equipo + CI.
3) **Objetos inmutables (protección real en ejecución)**: lo que sí impide
   cambios es el TIPO del objeto: `tuple`, `frozenset`, `str`, `int`,
   `types.MappingProxyType` (vista de solo lectura de un dict),
   `@dataclass(frozen=True)`, `NamedTuple` y los miembros de `enum.Enum`.

**Inmutabilidad superficial vs profunda**: una tupla es inmutable, pero si
contiene una lista, la lista SÍ puede mutar: `t = ([1], 2); t[0].append(9)` es
válido. Solo es "profundamente" inmutable si todo lo que contiene también lo
es. Prueba rápida: un objeto profundamente inmutable suele ser *hashable*
(`hash(t)` lanza `TypeError` si dentro hay una lista).

**`Enum`**: crea un conjunto cerrado de valores con nombre. Cada miembro es un
singleton (se compara con `is`), no se puede reasignar y se puede recorrer.
`StrEnum` (3.11+) e `IntEnum` permiten que el miembro se comporte como `str` o
`int` al serializar a JSON o guardar en base de datos.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Parámetros de negocio: tasas de impuestos, límites de transferencia diaria,
  códigos de moneda, timeouts de APIs (`TIMEOUT_HTTP_S: Final = 10`).
- Estados de dominio: `EstadoPedido.PAGADO` en vez de cadenas mágicas
  ("pagado", "Pagado", "PAGADO "...) que generan bugs silenciosos.
- Tablas de tarifas compartidas entre módulos: exponerlas como
  `MappingProxyType` evita que un módulo las altere para todos.
- Objetos de configuración cargados al arrancar (desde variables de entorno)
  como `@dataclass(frozen=True)`: hashables, seguros entre hilos y sin
  modificaciones accidentales a mitad de una petición.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
from typing import Final
from enum import Enum, StrEnum, IntEnum, auto
from types import MappingProxyType
from dataclasses import dataclass
from typing import NamedTuple

LIMITE_TRANSFERENCIA: Final[int] = 5_000_000      # mypy prohíbe reasignar
MONEDAS_SOPORTADAS: Final = frozenset({"COP", "USD", "EUR"})
DIAS_HABILES: Final = ("lun", "mar", "mié", "jue", "vie")

class Prioridad(IntEnum):
    BAJA = 1
    MEDIA = 2
    ALTA = 3

class Canal(StrEnum):
    WEB = auto()          # auto() en StrEnum genera "web"
    APP = auto()

class Coordenada(NamedTuple):   # tupla con nombres, inmutable
    lat: float
    lon: float

PLANES = MappingProxyType({"basico": 9_900, "pro": 29_900})   # dict de solo lectura

Prioridad.ALTA > Prioridad.BAJA     # True (IntEnum compara como int)
Canal.WEB == "web"                  # True (StrEnum es un str)
Prioridad(2)                        # Prioridad.MEDIA (búsqueda por valor)
Prioridad["ALTA"]                   # Prioridad.ALTA  (búsqueda por nombre)

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Una pasarela de pagos carga su configuración al iniciar y necesita
garantizar que ningún módulo la modifique durante la ejecución.

from dataclasses import dataclass, FrozenInstanceError
from enum import Enum
from types import MappingProxyType
from typing import Final

class EstadoPedido(Enum):
    PENDIENTE = "pendiente"
    PAGADO = "pagado"
    ENVIADO = "enviado"

@dataclass(frozen=True)
class ConfigPasarela:
    proveedor: str
    timeout_s: int
    reintentos: int = 3

TARIFAS_ENVIO: Final = MappingProxyType({"estandar": 8_000, "express": 15_000})

config = ConfigPasarela("PayFlex", timeout_s=10)

try:
    config.timeout_s = 99
except FrozenInstanceError as error:
    print(f"Bloqueado: {type(error).__name__}")

try:
    TARIFAS_ENVIO["express"] = 0
except TypeError:
    print("TARIFAS_ENVIO es de solo lectura")

estado = EstadoPedido("pagado")
print(estado, estado.name, estado.value)
print(estado is EstadoPedido.PAGADO)
print(config)

# Salida esperada:
# Bloqueado: FrozenInstanceError
# TARIFAS_ENVIO es de solo lectura
# EstadoPedido.PAGADO PAGADO pagado
# True
# ConfigPasarela(proveedor='PayFlex', timeout_s=10, reintentos=3)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- `Final` NO PROTEGE EN EJECUCIÓN: sin mypy/pyright en el pipeline de CI es
  solo un comentario elegante. Actívalo en el proyecto o no te fíes de él.
- MAYÚSCULAS + LISTA = TRAMPA: `ROLES_ADMIN = ["root"]` parece constante, pero
  `ROLES_ADMIN.append("invitado")` funciona. Usa `tuple` o `frozenset`.
- `MappingProxyType` ES UNA VISTA: si alguien conserva el dict original y lo
  modifica, la vista refleja el cambio. Crea el dict dentro de la llamada
  (como en el ejemplo) para que no quede ninguna referencia mutable suelta.
- `frozen=True` ES SUPERFICIAL: un campo `list` dentro de una dataclass
  congelada sigue siendo mutable. Usa `tuple[str, ...]` en los campos.
- NO COMPARES ENUMS CON SU VALOR CRUDO (`estado == "pagado"` da `False` con
  `Enum`); convierte en el borde del sistema: `EstadoPedido(valor_de_la_bd)`.
- "NÚMEROS MÁGICOS": `if intentos > 3` debe ser `if intentos > MAX_REINTENTOS`.
  El nombre documenta la intención y centraliza el cambio.
- Las constantes viven a nivel de MÓDULO (p. ej. `config.py`), no dentro de
  funciones, para que se evalúen una sola vez al importar.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Constantes de una tienda: define con `Final` `IVA`, `ENVIO_GRATIS_DESDE` y
   `MONEDA`; calcula el total de un carrito de 3 productos y muestra si aplica
   envío gratis. Ejecuta mypy (si lo tienes) tras reasignar `IVA` y anota el error.
2. Días de atención: guarda los días hábiles en una `tuple` e intenta
   `DIAS[0] = "dom"` dentro de un `try/except TypeError` mostrando el mensaje.
3. `Enum` de tallas: crea `Talla` (S, M, L, XL), recórrela con un `for`
   mostrando `nombre -> valor` y obtén un miembro desde la cadena "M".

[Intermedio]
4. Inmutabilidad superficial: crea `PERMISOS = ("leer", ["escribir"])`, muta
   la lista interna y demuestra que `hash(PERMISOS)` falla; luego crea una
   versión profundamente inmutable y muestra su hash.
5. `@dataclass(frozen=True) class Moneda(codigo, simbolo, decimales)`: crea
   instancias para COP, USD y EUR, úsalas como claves de un `dict` de tasas y
   explica por qué una dataclass normal no podría ser clave.
6. `IntEnum Prioridad` para un sistema de tickets: ordena una lista de tickets
   por prioridad con `sorted(..., key=...)` y filtra los de prioridad ALTA.
7. Tabla de solo lectura: expone `CODIGOS_HTTP` como `MappingProxyType` y
   escribe `describir_codigo(codigo: int) -> str` con valor por defecto
   "Desconocido" para códigos ausentes.

[Senior / Producción]
8. Configuración desde entorno: escribe `cargar_config() -> Config` (dataclass
   congelada) que lea `os.environ` con valores por defecto, convierta tipos y
   lance `ValueError` si `PUERTO` no es un entero entre 1 y 65535.
9. Máquina de estados con `Enum`: define `EstadoPedido` y un diccionario
   inmutable `TRANSICIONES` (estado -> frozenset de estados destino). Escribe
   `transicionar(actual, nuevo)` que lance `ValueError` ante transiciones inválidas.
10. `congelar(obj)`: función recursiva que convierta listas en tuplas, sets en
    frozensets y dicts en `MappingProxyType` (con valores también congelados).
    Pruébala con una configuración anidada y verifica que nada pueda mutar.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
