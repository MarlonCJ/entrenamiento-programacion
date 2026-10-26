r"""
============================================================================
TEMA 09: CONDICIONALES, GUARD CLAUSES, MATCH/CASE ESTRUCTURAL Y DESPACHO POR DICT
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: veracidad + coincidencia de patrones)
----------------------------------------------------------------------------
1) **`if / elif / else`**: Python evalúa cada condición en orden, en contexto
   booleano (llama a `bool()` implícitamente: `__bool__` o `__len__`), y
   ejecuta SOLO el primer bloque verdadero. Los bloques se definen por
   INDENTACIÓN (4 espacios, PEP 8), no por llaves.
2) **No crean ámbito**: una variable asignada dentro de un `if` existe después
   del bloque... solo si esa rama se ejecutó. Si no, obtienes `NameError` o
   `UnboundLocalError`. Inicializa antes o asegura todas las ramas.
3) **Guard clauses (retorno temprano)**: valida los casos inválidos al inicio y
   sal con `return` o `raise`. El "camino feliz" queda sin anidar.
4) **`match / case` (3.10+, PEP 634)**: NO es un `switch` de C. Es
   *coincidencia estructural de patrones*: compara la FORMA del dato y extrae
   partes en variables. Soporta:
   - Literales: `case 200:`, `case "pago":`, `case None:`.
   - OR: `case 401 | 403:`.
   - Captura y comodín: `case x:` (captura todo), `case _:` (no captura).
   - Secuencias: `case [primero, *resto]:` (no coincide con `str`).
   - Mapeos: `case {"tipo": "pago", "monto": m}:` (claves extra se ignoran).
   - Clases: `case Punto(x=0, y=y):` o `case int(n):`.
   - Guardas: `case {"monto": m} if m > 1_000:`.
   - Alias: `case ("rechazado" | "fallido") as estado:`.
   No hay "fall-through": solo se ejecuta el primer `case` que coincide.
5) **Despacho por diccionario**: mapear claves a funciones
   (`ACCIONES[comando](args)`) reemplaza cadenas largas de `elif` cuando la
   decisión es una simple búsqueda por valor y debe ser extensible.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Webhooks de pasarelas de pago (Stripe, PayU, Mercado Pago): cada evento JSON
  tiene una forma distinta; `match` con patrones de mapeo los desestructura.
- Validación de solicitudes en APIs con guard clauses (usuario autenticado,
  permisos, payload completo) antes de la lógica de negocio.
- Tarifas por tramos: impuestos progresivos, costos de envío por peso,
  descuentos por volumen (`if/elif` ordenado por rangos).
- CLIs y bots: despacho de comandos (`/saldo`, `/transferir`) con diccionarios
  de funciones o `match comando.split():`.
- Intérpretes y parsers: árboles de sintaxis con patrones de clase.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
if saldo < 0:
    estado = "en mora"
elif saldo == 0:
    estado = "sin fondos"
else:
    estado = "activo"

def costo_envio(peso_kg: float, destino: str | None) -> int:   # guard clauses
    if destino is None:
        raise ValueError("destino requerido")
    if peso_kg <= 0:
        raise ValueError("peso inválido")
    if peso_kg <= 1:
        return 8_000
    if peso_kg <= 5:
        return 15_000
    return 15_000 + int((peso_kg - 5) * 2_000)

match codigo_http:
    case 200 | 201 | 204:
        accion = "ok"
    case 401 | 403:
        accion = "reautenticar"
    case int(n) if 500 <= n < 600:
        accion = "reintentar"
    case _:
        accion = "registrar"

match comando.split():
    case ["saldo"]:
        ...
    case ["transferir", destino, monto]:
        ...
    case ["ayuda", *temas]:
        ...

ACCIONES = {"pdf": exportar_pdf, "csv": exportar_csv}     # despacho por dict
exportar = ACCIONES.get(formato)
if exportar is None:
    raise ValueError(f"formato no soportado: {formato}")
exportar(reporte)

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un e-commerce recibe webhooks heterogéneos de su pasarela de pagos
y decide qué hacer con cada uno usando `match` estructural.

def procesar_evento(evento: dict) -> str:
    match evento:
        case {"tipo": "pago", "estado": "aprobado", "monto": int(monto)} if monto >= 1_000_000:
            return f"Pago grande aprobado: revisión manual ({monto:,})"
        case {"tipo": "pago", "estado": "aprobado", "monto": int(monto)}:
            return f"Pago aprobado por {monto:,}"
        case {"tipo": "pago", "estado": ("rechazado" | "fallido") as estado}:
            return f"Pago {estado}: notificar al cliente"
        case {"tipo": "reembolso", "items": [primero, *resto]}:
            return f"Reembolso de {primero} y {len(resto)} ítem(s) más"
        case {"tipo": str(tipo)}:
            return f"Evento '{tipo}' ignorado"
        case _:
            return "Evento malformado"

eventos = [
    {"tipo": "pago", "estado": "aprobado", "monto": 2_500_000},
    {"tipo": "pago", "estado": "aprobado", "monto": 45_000},
    {"tipo": "pago", "estado": "fallido", "monto": 10_000, "banco": "XYZ"},
    {"tipo": "reembolso", "items": ["SKU-9", "SKU-3", "SKU-7"]},
    {"tipo": "suscripcion"},
    {"monto": 5},
]

for evento in eventos:
    print(procesar_evento(evento))

# Salida esperada:
# Pago grande aprobado: revisión manual (2,500,000)
# Pago aprobado por 45,000
# Pago fallido: notificar al cliente
# Reembolso de SKU-9 y 2 ítem(s) más
# Evento 'suscripcion' ignorado
# Evento malformado

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- LA TRAMPA Nº 1 DE `match`: un nombre suelto CAPTURA, no compara.
  `case LIMITE:` asigna el sujeto a `LIMITE` y coincide SIEMPRE (Python lanza
  SyntaxError si no es el último caso: "makes remaining patterns unreachable").
  Para comparar contra constantes usa nombres con punto: `case Estado.PAGADO:`
  o `case config.LIMITE:`, o una guarda `case x if x == LIMITE:`.
- EL ORDEN IMPORTA: los casos específicos (con guarda) van ANTES que los
  generales, como en el ejemplo con el pago grande.
- `case [a, b]:` NO coincide con cadenas (evita bugs al iterar caracteres),
  pero `case {"k": v}:` sí coincide con cualquier `Mapping`, ignorando claves
  extra. Si necesitas rechazar claves extra, usa `**resto` y verifica.
- `match` NO SIEMPRE ES MEJOR: para comparar un valor contra 3 constantes, un
  `if/elif` o un dict es más simple. Úsalo cuando haya ESTRUCTURA que extraer.
- EVITA EL "CÓDIGO FLECHA" (if dentro de if dentro de if): invierte las
  condiciones y retorna temprano.
- NO COMPARES CON `True`: `if activo == True:` -> `if activo:`; pero si 0 o ""
  son válidos, compara explícitamente (`if saldo is not None:`).
- RANGOS ORDENADOS: en tarifas por tramos, ordena de menor a mayor y aprovecha
  que las ramas anteriores ya descartaron valores (no repitas `5 < x <= 10`).
- SIEMPRE UN CASO POR DEFECTO (`else` / `case _`) que registre o lance error:
  los datos inesperados no deben pasar en silencio.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Semáforo de calificaciones: `clasificar_nota(nota: float) -> str` que
   devuelva "Excelente" (>= 4.5), "Aprobado" (>= 3.0), "Reprobado" (< 3.0) y
   lance `ValueError` fuera del rango 0.0–5.0.
2. Año bisiesto: `es_bisiesto(anio) -> bool` con la regla gregoriana completa
   (divisible entre 4, excepto los de 100, salvo los de 400).
3. Días del mes: con `match` y patrones OR, devuelve 31, 30 o 28/29 según el
   número de mes, reutilizando `es_bisiesto`.

[Intermedio]
4. Impuesto progresivo por tramos: `calcular_impuesto(ingreso_anual)` con
   tramos 0 %, 19 %, 28 % y 33 % aplicados solo al excedente de cada tramo
   (como hace la retención en la fuente), usando `if/elif` ordenado.
5. Refactor a guard clauses: toma una función de 4 `if` anidados que aprueba un
   retiro en cajero (tarjeta activa, PIN correcto, saldo suficiente, límite
   diario) y reescríbela sin anidamiento, con un mensaje por cada rechazo.
6. Calculadora de comandos: `ejecutar(linea: str)` con `match linea.split():`
   que soporte "sumar a b", "restar a b", "historial" y "salir", con un caso
   por defecto que muestre ayuda.
7. Despacho por diccionario: reemplaza un `if/elif` de 6 ramas que calcula el
   costo de envío por transportadora con un `dict` de funciones y maneja la
   transportadora desconocida.

[Senior / Producción]
8. Patrones de clase: define dataclasses `Tarjeta(numero, cvv)`,
   `Transferencia(banco, cuenta)` y `Efectivo()`, y escribe
   `describir_pago(metodo)` con `match` que muestre solo los últimos 4 dígitos
   de la tarjeta y rechace transferencias a bancos no soportados.
9. Router de API: `enrutar(metodo: str, ruta: str)` que use
   `match (metodo, ruta.strip("/").split("/")):` para resolver
   `GET /productos`, `GET /productos/<id>`, `POST /productos` y
   `DELETE /productos/<id>` (con `id` numérico vía guarda), devolviendo 404/405.
10. Validador de webhooks: amplía el ejemplo práctico para verificar con
    patrones `{"monto": int(m) | float(m)}` y guardas que el monto sea
    positivo, que la moneda esté en un `frozenset` permitido y que eventos
    duplicados (mismo `id`) se ignoren usando un `set` de IDs procesados.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
