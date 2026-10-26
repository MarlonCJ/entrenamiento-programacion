r"""
============================================================================
TEMA 05: OPERADORES ARITMÉTICOS, DIVISIÓN ENTERA, MÓDULO MATH Y PRECISIÓN DECIMAL
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: int, float, Decimal y Fraction)
----------------------------------------------------------------------------
Los operadores `+ - * / // % **` son azúcar sintáctico sobre métodos especiales
(`__add__`, `__truediv__`, `__floordiv__`, `__mod__`, `__pow__`...). El resultado
depende de los TIPOS de los operandos, y cada tipo numérico tiene su propio
modelo de precisión:

1) **`int`**: precisión arbitraria. Sumar, restar y multiplicar enteros nunca
   desborda ni pierde exactitud (`10 ** 30 + 1` es exacto).
2) **`float`**: IEEE 754 de 64 bits (≈15–17 dígitos significativos). Muchos
   decimales no tienen representación binaria exacta: `0.1 + 0.2` da
   `0.30000000000000004`.
3) **`/` SIEMPRE devuelve `float`** (división real): `10 / 2 == 5.0`.
4) **`//` es división "piso"** (redondea hacia -infinito, no hacia cero):
   `7 // 2 == 3` pero `-7 // 2 == -4`. Y `%` toma el SIGNO DEL DIVISOR:
   `-7 % 2 == 1`. Siempre se cumple `a == (a // b) * b + a % b`. `divmod(a, b)`
   devuelve ambos en una operación.
5) **`**` es asociativo a la derecha y más fuerte que el unario**:
   `2 ** 3 ** 2 == 512` y `-2 ** 2 == -4`. `pow(base, exp, mod)` calcula
   potencias modulares eficientes (criptografía, hashing).
6) **`round()` usa redondeo bancario (half to even)**: `round(2.5) == 2`,
   `round(3.5) == 4`. Además `round(2.675, 2) == 2.67` porque 2.675 en binario
   es 2.67499999...
7) **`decimal.Decimal`**: aritmética decimal exacta con precisión y modo de
   redondeo configurables (`ROUND_HALF_UP`, `ROUND_HALF_EVEN`...). Es el tipo
   correcto para dinero. **`fractions.Fraction`**: racionales exactos (1/3).

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Banca y facturación: intereses, IVA, cuotas de crédito con `Decimal` y una
  regla de redondeo documentada (la DIAN, el SAT o el banco la definen).
- Repartir montos sin perder centavos: trabajar en centavos (`int`) y repartir
  el residuo de `divmod` (división de cuentas, prorrateo de descuentos).
- Paginación de APIs: `total_paginas = -(-total // por_pagina)` (techo entero)
  o `math.ceil(total / por_pagina)`.
- Tiempo: convertir segundos a `hh:mm:ss` con `divmod`; índices circulares
  (`(indice + 1) % len(lista)`) en turnos rotativos o round-robin.
- Ciencia de datos: `math.fsum`, `math.isclose` y `statistics` para sumar y
  comparar floats con criterio.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
import math
from decimal import Decimal, ROUND_HALF_UP, getcontext
from fractions import Fraction

17 / 5            # 3.4
17 // 5           # 3
17 % 5            # 2
-17 // 5          # -4   (piso, no truncamiento)
-17 % 5           # 3    (signo del divisor)
divmod(17, 5)     # (3, 2)
2 ** 10           # 1024
2 ** -1           # 0.5  (exponente negativo -> float)
pow(7, 128, 13)   # potencia modular sin calcular 7**128 completo
abs(-3.2)         # 3.2

math.floor(-2.5), math.ceil(-2.5), math.trunc(-2.5)   # (-3, -2, -2)
math.isclose(0.1 + 0.2, 0.3)                          # True
math.fsum([0.1] * 10)                                 # 1.0 (sum() da 0.9999999999999999)
math.sqrt(16), math.isqrt(17), math.prod([2, 3, 4])   # (4.0, 4, 24)

Decimal("2.675").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)  # Decimal('2.68')
getcontext().prec = 28                                # precisión por defecto
Fraction(1, 3) + Fraction(1, 6)                       # Fraction(1, 2)

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Una fintech divide un cobro en cuotas sin perder ni inventar
centavos, calcula la duración de una llamada de soporte y muestra en su panel
técnico por qué no usa `float` para dinero.

from decimal import Decimal, ROUND_HALF_UP

def repartir(total: Decimal, partes: int) -> list[Decimal]:
    centavos = int((total * 100).to_integral_value(rounding=ROUND_HALF_UP))
    base, sobrante = divmod(centavos, partes)
    return [Decimal(base + (1 if i < sobrante else 0)) / 100 for i in range(partes)]

def duracion(segundos: int) -> str:
    horas, resto = divmod(segundos, 3600)
    minutos, segundos = divmod(resto, 60)
    return f"{horas:02}:{minutos:02}:{segundos:02}"

cuotas = repartir(Decimal("100.00"), 3)
print(*cuotas)
print(sum(cuotas))
print(duracion(7384))
print(0.1 + 0.2)
print(round(2.5), round(3.5))
print(-7 // 2, -7 % 2)
print(2 ** 100)

# Salida esperada:
# 33.34 33.33 33.33
# 100.00
# 02:03:04
# 0.30000000000000004
# 2 4
# -4 1
# 1267650600228229401496703205376

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- NUNCA `float` PARA DINERO: `0.1 + 0.2 != 0.3`. Usa `Decimal` construido
  desde `str` o enteros de centavos. Redondea UNA vez, al final, con
  `quantize` y una regla explícita.
- NO COMPARES FLOATS CON `==`: usa `math.isclose(a, b, rel_tol=..., abs_tol=...)`.
  Ojo: cerca de cero necesitas `abs_tol`, porque `rel_tol` es relativo.
- `//` Y `%` CON NEGATIVOS difieren de C, Java y JavaScript (que truncan hacia
  cero). Si portas código, usa `math.fmod` / `int(a / b)` cuando necesites
  esa semántica.
- `round()` BANCARIO SORPRENDE a contabilidad: si el negocio exige "mitad hacia
  arriba", usa `Decimal.quantize(..., rounding=ROUND_HALF_UP)`.
- `-2 ** 2 == -4`: el `**` se evalúa antes que el signo. Usa paréntesis.
- `ZeroDivisionError` también ocurre con `//` y `%`; protege los divisores que
  vienen de datos (promedios de listas vacías, tasas con denominador 0).
- MEZCLAR `Decimal` Y `float` lanza `TypeError` (`Decimal("1.1") + 0.1`). Es
  una protección: convierte el float con `Decimal(str(x))` si es inevitable.
- `sum()` de muchos floats acumula error; `math.fsum()` lo compensa.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Calculadora de propinas: dado el valor de una cuenta y un porcentaje de
   propina, muestra propina y total con 2 decimales y separador de miles.
2. Par o impar y múltiplos: pide un número y muestra si es par, si es múltiplo
   de 3 y de 5 usando `%`; prueba también con números negativos.
3. Conversor de tiempo: convierte 100_000 segundos a días, horas, minutos y
   segundos usando `divmod` encadenado.

[Intermedio]
4. `total_paginas(total_items, por_pagina) -> int` sin `math.ceil`, usando
   división entera; valida que `por_pagina` sea mayor que 0.
5. Demostración IEEE 754: suma `0.1` diez veces con un bucle, con `sum()`, con
   `math.fsum()` y con `Decimal("0.1")`; muestra los cuatro resultados y si son
   iguales a 1 con `==` y con `math.isclose`.
6. `redondear_monto(valor: str, regla: str) -> Decimal`: soporta "bancario" y
   "comercial" (half-up) a 2 decimales; compara ambas con "2.665" y "2.675".
7. Índice de masa corporal: `calcular_imc(peso_kg, estatura_m)` que devuelva el
   IMC con 1 decimal y su categoría; lanza `ValueError` si la estatura es 0.

[Senior / Producción]
8. Tabla de amortización: `amortizar(capital: Decimal, tasa_mensual: Decimal,
   meses: int)` con cuota fija (sistema francés), imprimiendo cuota, interés,
   abono a capital y saldo por mes; la última cuota ajusta el residuo.
9. Prorrateo de descuento: reparte un descuento de $10.000 entre los ítems de
   un carrito en proporción a su precio, trabajando en centavos, de modo que la
   suma de los descuentos individuales sea EXACTAMENTE el descuento total.
10. Exponenciación modular: implementa `potencia_modular(base, exp, mod)` con
    el método de "elevar al cuadrado y multiplicar" y verifica contra
    `pow(base, exp, mod)` con exponentes de más de 100 dígitos.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
