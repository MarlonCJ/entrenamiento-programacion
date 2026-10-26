r"""
============================================================================
TEMA 08: OPERADORES BIT A BIT, enum.Flag, EXPRESIÓN CONDICIONAL Y PRECEDENCIA
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: enteros infinitos en complemento a 2)
----------------------------------------------------------------------------
1) **Operadores bit a bit sobre `int`**: `&` (AND), `|` (OR), `^` (XOR),
   `~` (NOT), `<<` (desplazamiento izquierda) y `>>` (derecha). Como el `int`
   de Python tiene precisión arbitraria, se comporta como si tuviera infinitos
   bits en complemento a dos: no hay "32 bits" como en JavaScript ni overflow.
   - `~x == -x - 1` (por eso `~5 == -6`).
   - `x << n == x * 2**n` sin límite (`1 << 100` es exacto).
   - `x >> n == x // 2**n` (piso): `-7 >> 1 == -4`.
   - Para simular 32 bits sin signo enmascara: `x & 0xFFFFFFFF`.
2) **Herramientas de inspección**: `bin(x)`, `hex(x)`, `f"{x:08b}"`,
   `x.bit_length()` y `x.bit_count()` (3.10+, cuenta bits encendidos).
3) **Los mismos símbolos en otros tipos**: en `set` son unión `|`,
   intersección `&`, diferencia simétrica `^` y diferencia `-`; en `dict` `|`
   fusiona; en `bool` funcionan pero NO hacen cortocircuito.
4) **`enum.Flag` / `IntFlag`**: forma idiomática de combinar permisos o
   banderas con nombre (`Permiso.LEER | Permiso.ESCRIBIR`) y preguntar con `in`.
5) **Expresión condicional ("ternario")**: `valor_si_true if condicion else
   valor_si_false`. Es una EXPRESIÓN (devuelve valor); se evalúa solo la rama
   elegida.
6) **Precedencia (de mayor a menor)**: `()` / llamadas / índices ->
   `await` -> `**` -> unarios `+x -x ~x` -> `* @ / // %` -> `+ -` ->
   `<< >>` -> `&` -> `^` -> `|` -> comparaciones (`< == != in not in is is
   not`) -> `not` -> `and` -> `or` -> `if-else` -> `lambda` -> `:=`.
   DIFERENCIA CLAVE CON C/JS: en Python `& ^ |` tienen MÁS precedencia que las
   comparaciones, así que `x & 1 == 0` significa `(x & 1) == 0`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Sistemas de permisos y roles (RBAC) compactos: un entero por usuario en la
  base de datos, combinable con `|` y verificable con `&`.
- Protocolos binarios, IoT y hardware: leer campos empaquetados en un byte de
  estado de un sensor o un lector de tarjetas (`(byte >> 4) & 0b1111`).
- Redes: máscaras de subred (`ip & mascara`), aunque el módulo `ipaddress` lo
  encapsula mejor.
- Feature flags y opciones de configuración (`re.IGNORECASE | re.MULTILINE`).
- Etiquetas y segmentos de clientes con operaciones de conjuntos.
- Expresión condicional en f-strings, plantillas y valores por defecto simples.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
0b1100 & 0b1010       # 8  (0b1000)
0b1100 | 0b1010       # 14 (0b1110)
0b1100 ^ 0b1010       # 6  (0b0110)
~0b1100               # -13
1 << 3                # 8
40 >> 2               # 10
(255).bit_length()    # 8
(0b1011).bit_count()  # 3

estado = 0b1011_0010
bit_activo = (estado >> 4) & 1           # leer el bit 4
estado |= 1 << 0                         # encender bit 0
estado &= ~(1 << 5)                      # apagar bit 5
estado ^= 1 << 7                         # alternar bit 7

import re
patron = re.compile(r"total", re.IGNORECASE | re.MULTILINE)   # flags combinados

{"a", "b"} | {"b", "c"}    # {'a', 'b', 'c'}
{"a", "b"} & {"b", "c"}    # {'b'}

nivel = "VIP" if puntos >= 1_000 else "regular"
mensaje = f"{n} {'artículo' if n == 1 else 'artículos'}"

2 + 3 * 4 ** 2        # 50  (** > * > +)
-2 ** 2               # -4  (** antes que el unario)
not 1 == 2            # True (== antes que not)
a > 1 & b < 2         # ¡OJO! se lee a > (1 & b) < 2 (comparación encadenada)

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un CMS editorial guarda los permisos de cada rol como banderas y un
microcontrolador de una bodega refrigerada reporta su estado en un registro de
bits.

from enum import Flag, auto

class Permiso(Flag):
    LEER = auto()        # 1
    ESCRIBIR = auto()    # 2
    BORRAR = auto()      # 4
    PUBLICAR = auto()    # 8

EDITOR = Permiso.LEER | Permiso.ESCRIBIR | Permiso.PUBLICAR

def puede(rol: Permiso, accion: Permiso) -> str:
    return "permitido" if accion in rol else "denegado"

print(puede(EDITOR, Permiso.PUBLICAR), puede(EDITOR, Permiso.BORRAR))
print(EDITOR.value, bin(EDITOR.value), EDITOR.value.bit_count())

sin_publicar = EDITOR & ~Permiso.PUBLICAR
print(sin_publicar.value, Permiso.PUBLICAR in sin_publicar)

registro = 0b0000
registro |= 0b0101       # enciende compresor (bit 0) y alarma (bit 2)
registro &= ~0b0001      # apaga el compresor
registro ^= 0b1000       # alterna el modo descongelado (bit 3)
print(f"{registro:04b}", registro)

print(-7 >> 1, ~5, 1 << 40)
print(2 + 3 * 4 ** 2, -2 ** 2, (-2) ** 2)

# Salida esperada:
# permitido denegado
# 11 0b1011 3
# 3 False
# 1100 12
# -4 -6 1099511627776
# 50 -4 4

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- `&` Y `|` NO SON `and` Y `or`: no hacen cortocircuito y operan sobre bits.
  `usuario is not None & usuario.activo` es un bug doble (precedencia y
  evaluación). Usa `and`/`or` para lógica booleana.
- PANDAS / NUMPY: allí `&` y `|` SÍ se usan para condiciones vectorizadas y
  exigen paréntesis: `df[(df.edad > 18) & (df.pais == "CO")]`. Sin paréntesis
  obtienes la comparación encadenada equivocada o un error ambiguo.
- `~` CON ENTEROS "SIN SIGNO": `~0b1100` es -13, no `0b0011`. Para invertir
  solo N bits usa `x ^ ((1 << N) - 1)` o enmascara con `& 0xFF`.
- NÚMEROS MÁGICOS DE BITS: `if flags & 4` no dice nada; usa `enum.Flag` o
  constantes con nombre (`ALARMA = 1 << 2`).
- TERNARIOS ANIDADOS = ILEGIBLES: `a if x else b if y else c` es válido pero
  difícil de mantener. Más de una condición -> `if/elif` o un diccionario.
- `x = valor_a if cond else valor_b` sí; pero NO uses el ternario para
  ejecutar efectos secundarios (`enviar() if ok else registrar()`).
- EL VIEJO TRUCO `cond and a or b` falla cuando `a` es falso (0, ""). Usa la
  expresión condicional real.
- ANTE LA DUDA, PARÉNTESIS: no obligues al lector a recordar la tabla de
  precedencia (`(a + b) * c`, `(-x) ** 2`, `(flags & MASCARA) != 0`).

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Visor de bits: para los números 5, 12, 255 y 1024 imprime su valor decimal,
   binario con 12 dígitos (`:012b`), hexadecimal, `bit_length()` y `bit_count()`.
2. Par o impar sin `%`: escribe `es_par(n) -> bool` usando `n & 1` y pruébala
   con números negativos.
3. Etiqueta de inventario: con una expresión condicional imprime "Agotado",
   o "Disponible (N uds.)" según el stock de 4 productos.

[Intermedio]
4. `Permiso(Flag)` para un sistema bancario (CONSULTAR, TRANSFERIR, APROBAR,
   AUDITAR): define roles CAJERO, SUPERVISOR y AUDITOR, y escribe
   `verificar(rol, permiso)` que lance `PermissionError` si no lo tiene.
5. Byte de estado de un sensor: dado `estado = 0b1011_0110`, extrae con
   desplazamientos y máscaras el nivel de batería (bits 0–2), si hay error
   (bit 3) y el código de modo (bits 4–7).
6. Precedencia en práctica: predice el resultado de 8 expresiones (por ejemplo
   `not 3 > 2 and 1`, `-3 ** 2`, `2 ** 3 ** 2`, `5 & 3 == 1`, `1 + 2 << 1`),
   anótalo en un comentario y luego verifícalo imprimiendo cada una.
7. Segmentación de clientes con conjuntos: a partir de los conjuntos
   `compraron_web`, `compraron_app` y `suscritos`, calcula clientes
   omnicanal, solo web, y los que compraron pero no están suscritos.

[Senior / Producción]
8. Empaquetado de fecha en 16 bits (formato FAT): `empaquetar_fecha(anio, mes,
   dia) -> int` con año-1980 en 7 bits, mes en 4 y día en 5; y su inversa
   `desempaquetar_fecha(valor)`. Valida rangos y prueba ida y vuelta.
9. Conjunto de bits: clase `ConjuntoBits` que represente un conjunto de enteros
   pequeños en un solo `int`, con `agregar`, `quitar`, `__contains__`,
   `__len__` (usando `bit_count`) y `__or__`/`__and__`.
10. Persistencia de permisos: guarda una combinación de `IntFlag` como entero
    en un diccionario que simule una base de datos, recupérala, añade y quita
    permisos, y escribe una migración que renombre una bandera sin romper los
    valores almacenados.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
