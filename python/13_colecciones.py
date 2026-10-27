r"""
============================================================================
TEMA 13: DICCIONARIOS (`dict`), CONJUNTOS (`set`), HASHING Y `COLLECTIONS`
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: tablas hash compactas en CPython)
----------------------------------------------------------------------------
1) **Tablas hash y complejidad $O(1)$ promedio**: tanto `dict` como `set`
   calculan `hash(clave)` (un entero de 64 bits) para ir directo al cajón de
   memoria sin recorrer la colección. Buscar `x in conjunto` con 1 000 000 de
   elementos hace 1 operación hash en vez de 1 000 000 de comparaciones.
2) **El `dict` compacto de CPython (Python 3.6+ / garantizado desde 3.7)**:
   antiguamente una tabla hash dispersa desperdiciaba mucha memoria y perdía el
   orden. Hoy CPython separa un arreglo compacto de índices (`indices`) y un
   arreglo denso de entradas (`entries: [hash, key, value]`) en orden de
   inserción. Así ahorra ~25 % de RAM y **preserva el orden de inserción** por
   especificación del lenguaje.
3) **¿Qué puede ser clave de un `dict` o miembro de un `set`? (Hashability)**:
   un objeto es *hashable* si su `__hash__()` nunca cambia durante su vida y
   define `__eq__()`. Si `a == b`, entonces obligatoriamente `hash(a) == hash(b)`.
   - Hashables: `str`, `int`, `float`, `bool`, `bytes`, `frozenset`, `tuple`
     (solo si todos sus elementos son hashables) y `@dataclass(frozen=True)`.
   - NO hashables: `list`, `dict`, `set` (son mutables).
4) **El módulo `collections`**: estructuras especializadas escritas en C:
   - `defaultdict(fabrica)`: inicializa claves ausentes automáticamente.
   - `Counter`: multiconjunto para conteo de frecuencias y `most_common(k)`.
   - `deque`: cola doblemente enlazada con `append`/`popleft` en $O(1)$ y `maxlen`.
   - `ChainMap`: vista jerárquica de varios diccionarios sin copiarlos.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Índices en memoria ($O(1)$): transformar una lista de clientes en
  `{c.id: c for c in clientes}` antes de cruzarla con 100 000 facturas.
- Operaciones de conjuntos (`set`): permisos requeridos vs permisos del usuario
  (`requeridos <= usuario.permisos`), clientes nuevos (`hoy - ayer`) o correos
  en común (`lista_a & lista_b`).
- Conteo de eventos, palabras o códigos de estado HTTP con `Counter`.
- Agrupación de registros por categoría con `defaultdict(list)`.
- Jerarquía de configuración (`CLI > variables de entorno > archivo > defecto`)
  con `ChainMap`.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
from collections import ChainMap, Counter, defaultdict, deque

# Diccionarios y operador de unión | (Python 3.9+)
base = {"timeout": 5, "reintentos": 3}
override = {"reintentos": 5, "debug": True}
config = base | override                           # {'timeout': 5, 'reintentos': 5, 'debug': True}
 stock_a1 = config.get("stock", 0)                  # lectura segura sin KeyError

# Vistas dinámicas de diccionario (soportan operaciones de conjuntos en claves/items)
claves_comunes = base.keys() & override.keys()     # {'reintentos'}

# Conjuntos (ojo: {} crea un dict vacío; para set vacío usa set())
activos: set[str] = {"ana", "luis", "eva"}
morosos: set[str] = {"luis", "carlos"}
al_dia = activos - morosos                         # {'ana', 'eva'} (diferencia)
todos = activos | morosos                          # unión
ambos = activos & morosos                          # {'luis'} (intersección)
inmutable = frozenset(activos)                     # hashable: puede ser clave de dict

# collections: Counter, defaultdict, deque, ChainMap
conteo = Counter(["200", "500", "200", "404", "200"])
top_2 = conteo.most_common(2)                      # [('200', 3), ('500', 1)]

por_ciudad: defaultdict[str, list[str]] = defaultdict(list)
por_ciudad["Bogotá"].append("PED-01")

ultimos_errores: deque[str] = deque(maxlen=3)      # descarta el más viejo al llenarse
jerarquia = ChainMap(override, base)               # busca en override y luego en base

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un motor de analítica de e-commerce cruza ventas por SKU con
`Counter`, agrupa clientes por país con `defaultdict(set)` para contar usuarios
únicos, valida permisos con `frozenset` y resuelve la configuración con `ChainMap`.

from collections import ChainMap, Counter, defaultdict

transacciones = [
    ("CO", "ana@mail.com", "TEC-01"),
    ("CO", "ana@mail.com", "MOU-02"),
    ("MX", "luis@mail.com", "TEC-01"),
    ("CO", "eva@mail.com", "TEC-01"),
]

unidades_por_sku: Counter[str] = Counter()
clientes_unicos_por_pais: defaultdict[str, set[str]] = defaultdict(set)

for pais, correo, sku in transacciones:
    unidades_por_sku[sku] += 1
    clientes_unicos_por_pais[pais].add(correo)

print("Top SKU:", unidades_por_sku.most_common(1))
print("Clientes únicos CO:", len(clientes_unicos_por_pais["CO"]))

# Control de acceso con conjuntos (subconjunto <=)
PERMISOS_PUBLICAR = frozenset({"leer", "escribir", "publicar"})
permisos_editor = {"leer", "escribir"}
faltantes = PERMISOS_PUBLICAR - permisos_editor
print("¿Puede publicar?:", PERMISOS_PUBLICAR <= permisos_editor, "| Faltan:", sorted(faltantes))

# Configuración jerárquica sin copiar diccionarios
cfg_defecto = {"puerto": 8080, "workers": 4, "log": "INFO"}
cfg_entorno = {"workers": 8}
cfg_cli = {"log": "DEBUG"}
cfg_activa = ChainMap(cfg_cli, cfg_entorno, cfg_defecto)
print(f"Config activa -> puerto={cfg_activa['puerto']}, workers={cfg_activa['workers']}, log={cfg_activa['log']}")

# Salida esperada:
# Top SKU: [('TEC-01', 3)]
# Clientes únicos CO: 2
# ¿Puede publicar?: False | Faltan: ['publicar']
# Config activa -> puerto=8080, workers=8, log=DEBUG

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- `1`, `1.0` y `True` SON LA MISMA CLAVE EN UN `dict`: en Python `1 == 1.0 == True`
  y `hash(1) == hash(1.0) == hash(True) == 1`. Si evalúas `{1: "uno", True: "sí"}`,
  el diccionario final es `{1: "sí"}` (conserva la primera clave insertada y
  sobrescribe el valor con el último).
- `{}` ES UN `dict` VACÍO, NO UN `set`: para crear un conjunto vacío escribe
  siempre `set()`.
- `defaultdict` CREA LA CLAVE AL SOLO LEERLA CON `d[clave]`: si haces
  `if d["no_existe"]:` en un `defaultdict(list)`, acabas de insertar `"no_existe": []`
  en el diccionario. Para consultar sin insertar usa `clave in d` o `d.get(clave)`.
- NO MUTES UN OBJETO QUE YA ESTÁ EN UN `set` O COMO CLAVE DE `dict`: si defines
  una clase con `__hash__` basado en un atributo mutable y luego cambias ese
  atributo, el objeto queda en el cajón equivocado de la tabla hash y `obj in conjunto`
  dará `False`. Haz siempre inmutables las claves (`frozen=True`).
- `dict.setdefault(k, [])` EVALÚA EL VALOR POR DEFECTO EN CADA LLAMADA: aunque
  la clave ya exista, construye la lista vacía y la descarta. En un bucle
  caliente prefiere `defaultdict(list)`.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Frecuencia de palabras: escribe `top_palabras(texto: str, n: int) ->
   list[tuple[str, int]]` usando `Counter` tras normalizar a minúsculas y
   quitar signos de puntuación.
2. Auditoría de listas de correo: dadas dos listas `suscritos_web` y
   `suscritos_app`, devuelve en un diccionario los correos que están en ambas,
   solo en web, solo en app (diferencia simétrica `^`) y el total sin duplicados.
3. Índice invertido básico: dada una lista de diccionarios `[{"sku": "A1",
   "precio": 100}, ...]`, construye con comprensión de diccionario un mapa
   `sku -> precio` y consulta 3 códigos usando `.get()` con valor por defecto.

[Intermedio]
4. Agrupador multifacético: dada una lista de empleados `(nombre, departamento,
   rol)`, usa `defaultdict` anidados o claves tupla `(departamento, rol)` para
   listar quiénes trabajan en cada área.
5. Diferencias entre diccionarios: implementa `comparar_configs(antes: dict,
   despues: dict)` usando operaciones de conjuntos sobre `.keys()` y `.items()`
   para devolver `{agregadas, eliminadas, modificadas, intactas}`.
6. Ventana de eventos recientes con `deque`: crea una clase `HistorialReciente`
   que use `deque(maxlen=k)` para almacenar las últimas $k$ búsquedas de un
   usuario sin duplicados consecutivos.
7. Anagramas en $O(n)$: agrupa una lista de palabras en listas de anagramas
   usando `defaultdict(list)` con una clave hashable canónica (tupla ordenada de
   letras o `frozenset` de `Counter.items()`).

[Senior / Producción]
8. Clave de dominio inmutable y hashable: diseña `@dataclass(frozen=True)`
   `ClaveCotizacion(moneda_origen: str, moneda_destino: str, fecha_iso: str)`
   que normalice las monedas a mayúsculas en `__post_init__` (con
   `object.__setattr__`) y úsala como clave de caché de tasas de cambio.
9. Resolución de variables con `ChainMap`: construye un contexto de plantillas
   con ámbitos anidados (`entrar_ambito()` con `mapa.new_child()` y
   `salir_ambito()` con `mapa.parents`) demostrando que las escrituras afectan
   solo al ámbito local sin mutar el global.
10. Detector de anomalías de tráfico (Rate Limiter por ventana deslizante):
    usando `defaultdict(deque)`, implementa `permitir_peticion(ip: str,
    ahora_seg: float, max_peticiones: int, ventana_seg: float) -> bool` que
    purgue marcas de tiempo expiradas con `popleft()` en $O(1)$ amortizado.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
