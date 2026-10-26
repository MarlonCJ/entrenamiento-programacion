r"""
============================================================================
TEMA 06: ASIGNACIÓN COMPUESTA, DESEMPAQUETADO, WALRUS (:=) Y OPERADORES UNARIOS
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: re-enlazar vs mutar en el sitio)
----------------------------------------------------------------------------
En Python la asignación (`=`) es una SENTENCIA que enlaza un nombre a un
objeto; no devuelve valor (por eso `if x = 5:` es un error de sintaxis). Sobre
esa base se construyen varias formas de asignación que un Senior debe dominar:

1) **Asignación aumentada (`+=`, `-=`, `*=`, `/=`, `//=`, `%=`, `**=`, `&=`,
   `|=`, `^=`, `<<=`, `>>=`, `@=`)**: `x += y` intenta primero `x.__iadd__(y)`
   (mutación EN EL SITIO) y, si el tipo no lo implementa, cae a
   `x = x.__add__(y)` (objeto NUEVO).
   - Inmutables (`int`, `str`, `tuple`): `+=` crea un objeto nuevo y re-enlaza.
   - Mutables (`list`, `set`, `dict` con `|=`): `+=` modifica el MISMO objeto,
     y todos sus alias ven el cambio.
2) **No existen `++` ni `--`**: `++x` es válido pero significa `+(+x)`, es
   decir, NO incrementa nada. Es un bug silencioso típico de quien viene de
   C, Java o JavaScript.
3) **Desempaquetado (unpacking)**: `a, b = b, a`; `primero, *resto = datos`;
   `(x, y), z = (1, 2), 3`. Si el número de elementos no coincide lanza
   `ValueError`.
4) **Expresión de asignación "walrus" `:=` (3.8+)**: asigna Y devuelve el
   valor dentro de una expresión (`if (n := len(datos)) > 10:`). Útil en
   `while`, comprensiones y condiciones; no reemplaza al `=` normal.
5) **Unarios**: `-x` (negación, `__neg__`), `+x` (`__pos__`; en `Decimal`
   aplica el contexto de redondeo), `~x` (inversión de bits: `~x == -x - 1`) y
   `not x` (negación lógica, siempre devuelve `bool`).
6) **Sin `??=` ni `||=`**: Python no tiene asignación lógica. Se usa
   `if valor is None: valor = defecto`, `valor = valor or defecto` (cuidado con
   0 y "") o `dict.setdefault(clave, defecto)`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Acumuladores en reportes: total de ventas del día, conteo de errores en logs,
  saldo de una cuenta tras una lista de movimientos.
- Desempaquetado de filas de base de datos o CSV: `id_, nombre, email = fila`.
- Walrus para leer por bloques: `while (bloque := archivo.read(8192)):` al
  calcular el hash de un archivo grande o subirlo por partes.
- Fusionar configuraciones: `config |= overrides_del_entorno` (dicts, 3.9+).
- Conjuntos de permisos o etiquetas: `etiquetas |= {"urgente"}`.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
saldo = 100_000
saldo -= 25_000          # 75000
saldo *= 2               # 150000
saldo //= 7              # 21428 (división entera)
saldo **= 2              # potencia
saldo %= 1000            # módulo

nombre = "Ana"
nombre += " Gómez"       # str nuevo (inmutable)

etiquetas = {"nuevo"}
etiquetas |= {"urgente", "vip"}           # unión en el sitio
config = {"debug": False, "puerto": 8000}
config |= {"debug": True}                 # {'debug': True, 'puerto': 8000}

a, b = 1, 2
a, b = b, a                               # intercambio
cabeza, *cuerpo, cola = [10, 20, 30, 40]  # 10, [20, 30], 40
(lat, lon), ciudad = (6.25, -75.56), "Medellín"

if (pendientes := len(cola_tareas)) > 100:
    print(f"Alerta: {pendientes} tareas en cola")

conteo = {}
conteo["error"] = conteo.get("error", 0) + 1   # contador sin KeyError
grupos = {}
grupos.setdefault("admin", []).append("ana")  # inicializa solo si no existe

-5, +5, ~5, not 5         # (-5, 5, -6, False)

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un equipo de SRE resume las líneas de acceso de una API (método,
ruta, estado HTTP y milisegundos) y luego investiga un bug causado por `+=`
sobre una tupla de configuración.

registros = [
    "GET /api 200 120",
    "POST /login 401 35",
    "GET /api 200 80",
    "GET /img 404 15",
    "POST /pago 500 900",
]

total_ms = 0
errores = 0
por_estado: dict[str, int] = {}
lentas: list[str] = []

for linea in registros:
    metodo, ruta, estado, ms = linea.split()
    total_ms += int(ms)
    errores += int(estado) >= 400              # True suma 1, False suma 0
    por_estado[estado] = por_estado.get(estado, 0) + 1
    if (duracion := int(ms)) > 500:
        lentas += [f"{metodo} {ruta} ({duracion} ms)"]

promedio = total_ms / len(registros)
print(f"Total: {total_ms} ms | Promedio: {promedio:.1f} ms")
print(f"Errores: {errores} | Por estado: {por_estado}")
print(f"Lentas: {lentas}")

config = (["admin"], 3)
try:
    config[0] += ["auditor"]
except TypeError as error:
    print(f"TypeError: {error}")
print(config)

contador = 5
print(++contador, -contador, ~contador, not contador)

# Salida esperada:
# Total: 1150 ms | Promedio: 230.0 ms
# Errores: 3 | Por estado: {'200': 2, '401': 1, '404': 1, '500': 1}
# Lentas: ['POST /pago (900 ms)']
# TypeError: 'tuple' object does not support item assignment
# (['admin', 'auditor'], 3)
# 5 -5 -6 False

¿Por qué la tupla cambió A PESAR del error? `config[0] += [...]` hace dos
pasos: 1) `config[0].__iadd__([...])` muta la lista (éxito) y 2) intenta
reasignar `config[0] = lista`, lo que la tupla prohíbe (TypeError). El efecto
del paso 1 ya ocurrió.

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- `++contador` NO INCREMENTA: es doble signo positivo. Usa `contador += 1`.
  Linters como Ruff/Pylint lo detectan; actívalos.
- ALIAS + `+=` EN LISTAS: si `b = a` y luego `a += [x]`, `b` también cambia
  (mutación en el sitio). En cambio `a = a + [x]` crea una lista nueva y `b`
  conserva la anterior. Conoce cuál necesitas.
- `+=` CON `str` EN BUCLES GRANDES: cada concatenación puede crear una cadena
  nueva (O(n²) en el peor caso). Acumula en una lista y usa `"".join(partes)`.
- `valor = valor or defecto` REEMPLAZA 0, "", [] y False: si 0 es un valor
  válido (descuento 0 %), usa `if valor is None`.
- EL WALRUS CON MODERACIÓN: si dificulta leer la línea, usa dos sentencias.
  Recuerda los paréntesis: `if n := len(x) > 3` asigna el BOOLEANO a `n`.
- `UnboundLocalError`: hacer `total += 1` dentro de una función cuando `total`
  es global convierte a `total` en local. Pasa el valor como argumento y
  devuélvelo (o, como último recurso, `global`/`nonlocal`).
- DESEMPAQUETAR CON EXACTITUD: `a, b = fila` falla si la fila trae 3 columnas;
  usa `a, b, *_ = fila` si ignoras el resto de forma intencional.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Billetera: parte de `saldo = 50_000` y aplica en orden una recarga de
   20_000, un pago de 35_500, duplica el saldo por una promoción y aplica el
   4x1000 (`saldo -= saldo * 4 // 1000`), mostrando el saldo tras cada paso.
2. Intercambio triple: rota los valores de `primero`, `segundo` y `tercero` en
   una sola línea (el primero pasa al último lugar).
3. Unarios: imprime `-x`, `+x`, `~x` y `not x` para x en `[0, 1, -3, 255]` y
   verifica en cada caso que `~x == -x - 1`.

[Intermedio]
4. Contador de palabras: escribe `contar_palabras(texto) -> dict[str, int]`
   usando `dict.get(..., 0) + 1`; repite la solución con `collections.Counter`
   y compara.
5. Alias vs copia: demuestra con `id()` la diferencia entre `lista += [x]`,
   `lista = lista + [x]` y `lista.extend([x])` cuando hay otro nombre apuntando
   a la misma lista.
6. Desempaquetado de transacciones: dada una lista de tuplas
   `(fecha, tipo, monto, *metadatos)`, acumula depósitos y retiros en variables
   separadas e ignora los metadatos.
7. Fusión de configuraciones: combina `DEFAULTS`, `config_archivo` y
   `config_entorno` con `|` y `|=` respetando la prioridad
   entorno > archivo > defaults, sin mutar `DEFAULTS`.

[Senior / Producción]
8. Lectura por bloques con walrus: `hash_archivo(ruta) -> str` que calcule el
   SHA-256 leyendo de a 64 KB con `while (bloque := f.read(65536)):`.
9. Reproduce y explica el bug de `tupla[0] += [...]` con un objeto de
   configuración real; propón dos alternativas seguras (tupla de tuplas y
   reconstrucción explícita).
10. Agregador de métricas: `agregar(eventos) -> dict` que, a partir de
    diccionarios `{"servicio", "latencia_ms", "ok"}`, calcule por servicio
    conteo, errores, latencia máxima y promedio usando `setdefault` y
    asignaciones compuestas, sin recorrer los eventos más de una vez.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
