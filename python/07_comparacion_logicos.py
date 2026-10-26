r"""
============================================================================
TEMA 07: COMPARACIÓN (== VS IS), COMPARACIONES ENCADENADAS Y CORTOCIRCUITO LÓGICO
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: igualdad, identidad y veracidad)
----------------------------------------------------------------------------
1) **`==` compara VALOR, `is` compara IDENTIDAD**: `a == b` llama a
   `a.__eq__(b)` (cada clase define qué significa "igual"); `a is b` comprueba
   si son el MISMO objeto (mismo `id()`), y no se puede sobrescribir.
   `[1, 2] == [1, 2]` es `True`, pero `[1, 2] is [1, 2]` es `False`.
2) **Sin coerción "loca"**: `1 == "1"` es `False` (no hay `===` porque `==` ya
   es estricto entre tipos no relacionados). Entre números sí se compara el
   valor matemático: `1 == 1.0 == True` es `True`.
3) **Orden entre tipos incompatibles lanza error**: `3 < "4"` produce
   `TypeError` (en Python 2 "funcionaba", fuente de bugs históricos). Las
   secuencias se comparan lexicográficamente: `(2026, 1, 5) < (2026, 2, 1)`.
4) **Comparaciones encadenadas**: `0 <= x < 10` equivale a
   `0 <= x and x < 10`, evaluando `x` UNA sola vez.
5) **Veracidad (truthiness)**: en contexto booleano son falsos `None`, `False`,
   `0`, `0.0`, `Decimal(0)`, `""`, `[]`, `{}`, `set()`, `range(0)` y objetos cuyo
   `__bool__` devuelva False o `__len__` devuelva 0. Todo lo demás es verdadero.
6) **`and`, `or`, `not`**: `and`/`or` hacen CORTOCIRCUITO y devuelven UNO DE
   LOS OPERANDOS, no necesariamente un `bool`:
   - `a or b` -> `a` si es verdadero; si no, `b`.
   - `a and b` -> `a` si es falso; si no, `b`.
   - `not a` -> siempre `True` o `False`.
   Precedencia: `not` > `and` > `or`.
7) **NaN no es igual a nada**, ni a sí mismo: `float("nan") == float("nan")`
   es `False`. Pero `x in lista` primero comprueba identidad, así que el MISMO
   objeto NaN sí se "encuentra" en una lista.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Motores de reglas: antifraude bancario, aprobación de créditos, elegibilidad
  de promociones combinando condiciones con `and`/`or`/`any()`/`all()`.
- Validación de rangos: `MIN_EDAD <= edad <= MAX_EDAD`, horarios de atención,
  límites de transferencia.
- Valores por defecto: `nombre_visible = apodo or nombre or "Invitado"`.
- Evitar trabajo costoso: `if cache and cache.vigente(): ...` (si `cache` es
  `None`, el método nunca se llama).
- Ordenar y comparar registros con tuplas: prioridad y luego fecha.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
x == y, x != y, x < y, x <= y, x > y, x >= y   # comparación de valor
x is None, x is not None                       # identidad (singletons)
"vip" in etiquetas, clave not in diccionario   # pertenencia (__contains__)
18 <= edad < 65                                # encadenada
"abc" < "abd"                                  # True (orden por código Unicode)
"Zeta" < "alfa"                                # True ("Z" = 90 < "a" = 97)
(3, "b") < (3, "c")                            # True (lexicográfico)

usuario = None
nombre = usuario and usuario.nombre            # None, sin AttributeError
puerto = puerto_configurado or 8000            # ojo si 0 es válido

all(n > 0 for n in montos)                     # True si TODOS cumplen (vacío -> True)
any(t.pais == "XX" for t in transacciones)     # True si ALGUNO cumple (vacío -> False)

import math
math.isnan(valor)                              # la forma correcta de detectar NaN
sorted(clientes, key=lambda c: (-c.puntos, c.nombre))   # comparar por tupla

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un banco evalúa transacciones con tarjeta con un motor de reglas
antifraude simple y muestra algunas "rarezas" de comparación en su panel.

from dataclasses import dataclass

@dataclass
class Transaccion:
    codigo: str
    monto: int
    pais: str
    intentos_fallidos: int
    titular_verificado: bool
    nota: str | None = None

PAISES_RIESGO = frozenset({"XX", "YY"})

def es_sospechosa(t: Transaccion) -> bool:
    reglas = (
        t.monto > 5_000_000,
        t.pais in PAISES_RIESGO,
        t.intentos_fallidos >= 3,
        not t.titular_verificado and t.monto > 1_000_000,
    )
    return any(reglas)

lote = [
    Transaccion("T-001", 250_000, "CO", 0, True),
    Transaccion("T-002", 1_500_000, "CO", 1, False, "cliente nuevo"),
    Transaccion("T-003", 80_000, "XX", 0, True, ""),
]

for t in lote:
    veredicto = "SOSPECHOSA" if es_sospechosa(t) else "ok"
    print(f"{t.codigo}: {veredicto} ({t.nota or 'sin nota'})")

print(0 <= 0.5 < 1, 1 == 1.0 == True, float("nan") == float("nan"))
print(None or 0 or "" or "respaldo")
print(0 and 1 / 0)
print([1, 2] == [1, 2], [1, 2] is [1, 2])

# Salida esperada:
# T-001: ok (sin nota)
# T-002: SOSPECHOSA (cliente nuevo)
# T-003: SOSPECHOSA (sin nota)
# True True False
# respaldo
# 0
# True False

(Nota: `0 and 1 / 0` devuelve 0 sin lanzar ZeroDivisionError porque `and` se
detiene en el primer operando falso. En la última línea, los linters (y en
versiones recientes el propio compilador, con un SyntaxWarning por stderr)
avisan del `is` con literales: precisamente porque casi siempre es un error.)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- `is` SOLO PARA SINGLETONS: `x is None`, `x is True` (raro), centinelas y
  miembros de `Enum`. Usar `is` con números o cadenas "funciona a veces" por la
  caché de enteros y el interning, y falla en producción.
- `== None` ES UN ANTIPATRÓN: una clase puede redefinir `__eq__`; `is None` es
  más rápido e infalible.
- `if lista:` ES IDIOMÁTICO para "no vacía", pero `if valor:` es un BUG cuando
  0, 0.0 o "" son datos válidos (saldo 0, descuento 0 %). Escribe
  `if valor is not None:`.
- `or` PARA DEFECTOS SE COME LOS FALSOS: `cantidad = cantidad or 1` convierte
  una cantidad 0 legítima en 1.
- NO ENCADENES CON `==` SIN QUERER: `a == b == c` significa `a == b and
  b == c`; y `x < y > z` es válido pero confuso.
- `x == 1 or 2` SIEMPRE ES VERDADERO (`(x == 1) or 2`). Usa `x in (1, 2)`.
- COMPARAR FLOATS: `math.isclose`. Detectar NaN: `math.isnan`.
- CADENAS: el orden es por código Unicode, no alfabético humano ("Á" > "Z").
  Para ordenar texto en español normaliza (`casefold`, `unicodedata`) o usa
  `locale.strxfrm`.
- Si defines `__eq__` en una clase, define también `__hash__` (o déjala no
  hashable a propósito); `@dataclass(frozen=True)` lo hace por ti.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Rango de edad: pide una edad e indica con una comparación encadenada si
   pertenece a "menor" (0–17), "adulto" (18–64) o "mayor" (65+); rechaza
   negativos.
2. Tabla de veracidad: imprime `bool(x)` para `0, 0.0, "", " ", "0", [], [0],
   {}, None, Decimal("0.00")` y anota cuáles te sorprendieron.
3. `==` vs `is`: crea dos listas iguales, un alias y una copia; imprime el
   resultado de `==` e `is` para cada par y explica cada uno en un comentario.

[Intermedio]
4. `nombre_visible(usuario: dict) -> str`: devuelve `apodo`, si no `nombre`, si
   no "Invitado", usando `or`; luego corrige el caso en que el apodo "0" o
   cadenas con solo espacios no deben considerarse válidos.
5. Elegibilidad de crédito: `es_elegible(edad, ingresos, puntaje, en_mora)` que
   apruebe si 21 <= edad <= 70 y no está en mora y (ingresos >= 2_000_000 o
   puntaje >= 750). Escribe pruebas con `assert` para 6 casos límite.
6. Ordenamiento por tuplas: ordena una lista de tickets
   `(prioridad, fecha_iso, id)` con prioridad descendente y fecha ascendente
   usando una clave de tupla.
7. Comparación de versiones: `comparar_versiones("1.10.0", "1.9.3") -> int`
   (-1, 0, 1) convirtiendo a tuplas de enteros; demuestra por qué comparar las
   cadenas directamente da un resultado incorrecto.

[Senior / Producción]
8. Motor de reglas declarativo: define las reglas antifraude como una lista de
   tuplas `(nombre, función)` y escribe `evaluar(transaccion)` que devuelva los
   NOMBRES de las reglas que se activaron, usando generadores y `any`/`all`.
9. Clase `Dinero(monto: Decimal, moneda: str)` con `__eq__` y `__lt__` (usa
   `functools.total_ordering`) que lance `TypeError` al comparar monedas
   distintas y devuelva `NotImplemented` frente a tipos ajenos.
10. Auditoría de NaN: escribe `limpiar_lecturas(lecturas: list[float])` que
    elimine NaN e infinitos de lecturas de sensores, demuestre por qué
    `x == float("nan")` nunca filtra nada y compare el rendimiento con
    `math.isfinite`.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
