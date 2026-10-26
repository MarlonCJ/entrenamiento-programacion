r"""
============================================================================
TEMA 27: EXPRESIONES REGULARES, FECHAS CON ZONA HORARIA Y JSON
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: motor re, datetime aware y json)
----------------------------------------------------------------------------
1) **`re` es un motor de backtracking**: compila el patrón a un programa
   interno (`re.compile` lo cachea) y prueba alternativas retrocediendo. Por
   eso patrones como `(a+)+$` pueden tardar un tiempo EXPONENCIAL (ReDoS) ante
   entradas maliciosas. Python 3.11 añadió grupos atómicos `(?>...)` y
   cuantificadores posesivos `a++` para cortar ese retroceso.
2) **`search` vs `match` vs `fullmatch`**: `match` solo ancla al inicio,
   `search` busca en cualquier parte y `fullmatch` exige que TODO el texto
   coincida (lo correcto para validar). En patrones `str`, `\d` y `\w` son
   Unicode: `\d` acepta dígitos árabes-índicos como `٣`; usa `re.ASCII` o
   `[0-9]` si solo quieres 0-9.
3) **Fechas naive vs aware**: un `datetime` sin `tzinfo` (naive) es solo una
   "hora de pared" ambigua. Uno aware (con `tzinfo`) representa un instante
   exacto. Regla Senior: guarda y calcula en UTC, convierte a la zona del
   usuario solo al mostrar. `zoneinfo.ZoneInfo` (3.9+) usa la base IANA y
   gestiona horario de verano. `datetime.utcnow()` está obsoleto en 3.12:
   usa `datetime.now(timezone.utc)`.
4) **`fromisoformat` (3.11+)** entiende casi todo ISO 8601, incluida la `Z`.
   `strptime`/`strftime` usan códigos `%Y-%m-%d %H:%M %z`.
5) **`json` mapea tipos**: dict<->objeto, list/tuple->array, str, int/float,
   True/False/None <-> true/false/null. NO sabe serializar `datetime`,
   `Decimal`, `set` ni dataclasses: se extiende con `default=` al codificar y
   con `object_hook=` (o `parse_float=Decimal`) al decodificar. Las claves de
   un dict SIEMPRE salen como texto: `{1: "a"}` vuelve como `{"1": "a"}`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Regex: extraer campos de logs de Nginx, validar códigos de producto o
  placas vehiculares, enmascarar números de tarjeta en registros.
- Fechas: agendas médicas multipaís, vencimientos de facturas, ventanas de
  SLA, cierres contables a medianoche en la zona del cliente.
- JSON: APIs REST, webhooks de pasarelas de pago, archivos de configuración,
  colas de mensajes y logs estructurados (JSON Lines).

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
import json, re
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from zoneinfo import ZoneInfo

PLACA = re.compile(r"[A-Z]{3}-\d{3}", re.ASCII)        # compila una vez
PLACA.fullmatch("ABC-123")                  # <re.Match ...> o None
m = re.search(r"(?P<usuario>\w+)@(?P<dominio>[\w.]+)", "Escribe a ana@clinica.co")
m["usuario"], m.group("dominio")            # ('ana', 'clinica.co')
re.findall(r"\d+", "3 camas, 12 sillas")    # ['3', '12']
re.sub(r"\d(?=\d{4})", "*", "4111222233334444")  # '************4444'
re.split(r"[;,]\s*", "a, b;c")              # ['a', 'b', 'c']
re.compile(r'''
    (?P<anio>\d{4}) - (?P<mes>\d{2})        # re.VERBOSE: espacios y comentarios
''', re.VERBOSE)

ahora = datetime.now(timezone.utc)                     # aware en UTC
madrid = ahora.astimezone(ZoneInfo("Europe/Madrid"))   # mismo instante
datetime(2026, 3, 1, 9, 0, tzinfo=ZoneInfo("America/Bogota"))
datetime.fromisoformat("2026-03-10T14:30:00Z")         # 3.11+
datetime.strptime("10/03/2026", "%d/%m/%Y").date()     # date(2026, 3, 10)
f"{ahora:%Y-%m-%d %H:%M %z}"                           # '2026-03-10 14:30 +0000'
vence = date(2026, 1, 31) + timedelta(days=30)         # date(2026, 3, 2)

json.dumps({"ok": True, "nombre": "Peña"}, ensure_ascii=False, indent=2)
json.dumps(datos, default=str, sort_keys=True)         # fallback rápido
json.loads('{"precio": 19.90}', parse_float=Decimal)   # {'precio': Decimal('19.90')}
with open("config.json", encoding="utf-8") as f:
    config = json.load(f)                              # load/dump: archivos

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Una red de clínicas recibe citas en texto plano con hora UTC. Hay
que validarlas con regex, mostrarlas en hora de Bogotá y enviarlas por JSON a
otro servicio sin perder el tipo `datetime` ni la precisión del `Decimal`.

import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from decimal import Decimal
from zoneinfo import ZoneInfo

PATRON = re.compile(
    r"(?P<fecha>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s+"
    r"(?P<paciente>PAC-\d{4})\s+(?P<especialidad>\w+)\s+(?P<copago>\d+\.\d{2})"
)
BOGOTA = ZoneInfo("America/Bogota")

@dataclass
class Cita:
    paciente: str
    especialidad: str
    inicio: datetime
    copago: Decimal

def serializar(obj: object) -> str:
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return str(obj)
    raise TypeError(f"No serializable: {type(obj).__name__}")

def revivir(datos: dict) -> dict:
    if "inicio" in datos:
        datos["inicio"] = datetime.fromisoformat(datos["inicio"])
    if "copago" in datos:
        datos["copago"] = Decimal(datos["copago"])
    return datos

lineas = [
    "2026-03-10T14:30:00Z PAC-0042 cardiología 25000.50",
    "2026-03-11T03:15:00Z PAC-0007 pediatría 18000.00",
    "fecha-mala PAC-99 ??? 0",
]
citas: list[Cita] = []
for linea in lineas:
    if (m := PATRON.fullmatch(linea)) is None:
        print(f"Descartada: {linea!r}")
        continue
    inicio = datetime.fromisoformat(m["fecha"]).astimezone(BOGOTA)
    citas.append(Cita(m["paciente"], m["especialidad"], inicio, Decimal(m["copago"])))

for c in citas:
    print(f"{c.paciente} | {c.especialidad} | {c.inicio:%Y-%m-%d %H:%M %z} | copago {c.copago}")

texto = json.dumps(asdict(citas[1]), default=serializar, ensure_ascii=False)
print(texto)
restaurada = json.loads(texto, object_hook=revivir)
print(restaurada["inicio"].astimezone(timezone.utc).isoformat(), restaurada["copago"] * 2)

# Salida esperada:
# Descartada: 'fecha-mala PAC-99 ??? 0'
# PAC-0042 | cardiología | 2026-03-10 09:30 -0500 | copago 25000.50
# PAC-0007 | pediatría | 2026-03-10 22:15 -0500 | copago 18000.00
# {"paciente": "PAC-0007", "especialidad": "pediatría", "inicio": "2026-03-10T22:15:00-05:00", "copago": "18000.00"}
# 2026-03-11T03:15:00+00:00 36000.00

(Fíjate en la segunda cita: en UTC es el día 11, pero en Bogotá sigue siendo
el día 10. Agrupar citas "por día" sin convertir de zona daría reportes mal.)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- USA SIEMPRE CADENAS RAW `r"..."` EN REGEX: `"\b"` es un retroceso (backspace)
  y no un límite de palabra; `r"\b"` sí lo es.
- VALIDA CON `fullmatch`, NO CON `match`: `re.match(r"\d{4}", "2026abc")`
  coincide. Y `$` acepta un `\n` final: usa `\Z` o `fullmatch`.
- CUIDADO CON ReDoS: evita cuantificadores anidados `(\w+)*`, limita la
  longitud de la entrada antes de aplicar el patrón y no compiles regex que
  vengan del usuario (o escápalas con `re.escape`).
- NO PARSEES HTML, EMAILS RFC COMPLETOS NI JSON CON REGEX: usa `html.parser`,
  `email.utils` y `json`.
- NUNCA MEZCLES NAIVE Y AWARE: compararlos lanza `TypeError`. Y `tzinfo=` con
  `pytz` da offsets históricos absurdos; con `zoneinfo` sí es correcto.
- EN WINDOWS `zoneinfo` NECESITA DATOS IANA: el sistema no los trae; instala
  el paquete oficial `tzdata` (`pip install tzdata`) o fallará con
  `ZoneInfoNotFoundError`.
- `timedelta` NO CONOCE MESES: "sumar un mes" requiere lógica propia
  (`calendar.monthrange`) o una librería como `dateutil`.
- JSON Y DINERO: `json.loads` convierte `19.90` en `float`; usa
  `parse_float=Decimal` o envía montos como enteros en centavos o strings.
- `ensure_ascii=True` (por defecto) escapa tildes como `\u00ed`: es JSON
  válido, pero para logs legibles usa `ensure_ascii=False` y archivos UTF-8.
- `json.loads` DE ORIGEN NO CONFIABLE: limita el tamaño del cuerpo y valida
  el esquema (pydantic, jsonschema) antes de usar los datos.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Validador de placas: `es_placa_valida(texto) -> bool` con `fullmatch` para
   el formato `ABC-123` (solo ASCII) y pruebas con 6 casos límite.
2. Edad exacta: `calcular_edad(nacimiento: date, hoy: date) -> int` que tenga
   en cuenta si ya pasó el cumpleaños (incluye el caso de un 29 de febrero).
3. JSON bonito: guarda una lista de empleados con `json.dump(..., indent=2,
   ensure_ascii=False)` en un archivo UTF-8 y vuelve a leerla con `json.load`.

[Intermedio]
4. Parser de logs Nginx: `parsear_linea(linea) -> dict | None` con grupos con
   nombre (ip, fecha, método, ruta, estado, bytes) y un conteo de códigos 5xx.
5. Enmascarado PCI: `enmascarar_tarjetas(texto)` que reemplace con `re.sub` y
   una función de reemplazo todos los números de 13–19 dígitos dejando
   visibles solo los últimos 4.
6. Reunión global: dada una hora en `America/Mexico_City`, muestra la hora
   equivalente en Madrid, Tokio y Buenos Aires con `zoneinfo`, y detecta si
   para algún participante cae fuera del horario 08:00–18:00.
7. Codificador propio: `class CodificadorDominio(json.JSONEncoder)` cuyo
   `default` soporte `datetime`, `date`, `Decimal`, `set` y dataclasses.

[Senior / Producción]
8. Vencimientos con días hábiles: `sumar_dias_habiles(fecha, n, festivos:
   set[date])` que salte fines de semana y festivos; pruebas parametrizadas.
9. Horario de verano: demuestra con `ZoneInfo("Europe/Madrid")` la hora que
   "no existe" el último domingo de marzo y la que se repite en octubre
   (atributo `fold`); explica por qué los cron deben programarse en UTC.
10. Ingesta JSON Lines robusta: lee un archivo `.jsonl` de eventos de pago
    línea a línea con `object_hook` para fechas/montos, registra las líneas
    corruptas (`json.JSONDecodeError` con `lineno`) sin detener el proceso y
    mide con `timeit` un patrón vulnerable a ReDoS frente a su versión segura.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
