r"""
============================================================================
TEMA 01: VARIABLES, NOMBRES COMO REFERENCIAS Y MODELO DE OBJETOS DE CPYTHON
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de CPython: "todo es objeto")
----------------------------------------------------------------------------
En Python una variable NO es una "caja" que contiene un valor: es un NOMBRE
(una etiqueta) que apunta a un OBJETO que vive en el heap del intérprete.
Entender este modelo distingue a un desarrollador Senior:

1) **Todo es objeto**: `42`, `"hola"`, `None`, una función o una clase son
   objetos con tres atributos: identidad (`id(obj)`, en CPython es la
   dirección de memoria), tipo (`type(obj)`) y valor.
2) **Asignar es enlazar, nunca copiar**: `b = a` hace que `b` apunte al MISMO
   objeto que `a`. No se duplica nada. Los nombres viven en espacios de nombres
   (diccionarios como `globals()` o el frame local de una función).
3) **Tipado dinámico pero fuerte**: el TIPO pertenece al objeto, no al nombre.
   Un nombre puede apuntar a un `int` y luego a un `str`, pero Python nunca
   convierte tipos a escondidas: `"3" + 4` lanza `TypeError`.
4) **Mutables vs inmutables**:
   - Inmutables: `int`, `float`, `bool`, `str`, `tuple`, `frozenset`, `bytes`,
     `None`. "Modificarlos" crea un objeto NUEVO (`x += 1` re-enlaza `x`).
   - Mutables: `list`, `dict`, `set`, `bytearray` y la mayoría de objetos de
     clases propias. Se modifican en el sitio y TODOS los alias ven el cambio.
5) **Conteo de referencias + recolector de ciclos**: CPython libera un objeto
   cuando su contador de referencias llega a 0 (`sys.getrefcount(obj)`), y el
   módulo `gc` limpia ciclos (A apunta a B y B apunta a A).
6) **`int` de precisión arbitraria**: no hay desbordamiento; `2 ** 200` es
   exacto. El límite es la memoria (y, por seguridad, la conversión int↔str
   está limitada a 4300 dígitos por defecto: `sys.set_int_max_str_digits`).
7) **Caché de enteros pequeños e interning**: CPython reutiliza los objetos
   `int` de -5 a 256 y "interna" muchos `str` cortos tipo identificador. Por
   eso `a is b` a veces da `True` "por casualidad": es un detalle de
   implementación, NUNCA lógica de negocio.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- IDs gigantes sin miedo: números de guía de transportadoras, IDs Snowflake o
  `BIGINT` de PostgreSQL caben en un `int` de Python sin perder dígitos (a
  diferencia del `number` de JavaScript).
- `None` como "ausencia intencional": `fecha_baja = None` en un cliente activo;
  se compara SIEMPRE con `is None`.
- Bugs de aliasing en producción: pasar un `dict` de configuración a una
  función que lo muta "por dentro" cambia el original para todo el sistema.
  Saber cuándo copiar (`dict(cfg)`, `copy.deepcopy(cfg)`) evita incidentes.
- Type hints (`precio: float = 0.0`) para que mypy/pyright e IDEs detecten
  errores antes de llegar a producción (Python NO los valida en ejecución).

3. SINTAXIS Y REFERENCIA RÁPIDA (Python 3.12+)
----------------------------------------------------------------------------
numero_guia = 90_071_992_547_409_930_001   # int sin límite, "_" como separador
precio_unitario = 19.99                    # float (IEEE 754 de 64 bits)
moneda = "COP"                             # str (Unicode, inmutable)
es_premium = True                          # bool (subclase de int: True == 1)
fecha_baja = None                          # NoneType (único objeto None)
intentos: int = 0                          # type hint (documenta, no obliga)

# Asignación múltiple e intercambio sin variable temporal (empaquetado de tuplas):
origen, destino = "Medellín", "Lima"
origen, destino = destino, origen

# Desempaquetado extendido:
primero, *resto = ["SKU-1", "SKU-2", "SKU-3"]   # resto == ["SKU-2", "SKU-3"]

# Inspección del objeto:
type(precio_unitario)           # <class 'float'>
isinstance(es_premium, int)     # True (bool hereda de int)
id(moneda)                      # identidad del objeto (dirección en CPython)

# Alias vs copia:
carrito = ["pan", "leche"]
alias = carrito                 # MISMO objeto
copia = carrito.copy()          # objeto nuevo (copia superficial)

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un servicio logístico inspecciona un registro de envío, muestra el
tipo real de cada campo y demuestra el bug de aliasing frente a una copia
profunda antes de enviar el registro a otro módulo.

from copy import deepcopy

def describir(nombre: str, valor: object) -> str:
    return f"{nombre}: {type(valor).__name__}"

envio = {
    "guia": 90071992547409930001,
    "peso_kg": 12.5,
    "fragil": True,
    "notas": None,
    "paquetes": ["caja-A", "caja-B"],
}

for clave, valor in envio.items():
    print(describir(clave, valor))

alias = envio                 # mismo objeto, no es una copia
copia = deepcopy(envio)       # objeto nuevo e independiente (también sus listas)
alias["paquetes"].append("caja-C")

print(alias is envio, copia is envio)
print(len(envio["paquetes"]), len(copia["paquetes"]))
print(envio["guia"] + 1)

# Salida esperada:
# guia: int
# peso_kg: float
# fragil: bool
# notas: NoneType
# paquetes: list
# True False
# 3 2
# 90071992547409930002

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en CPython)
----------------------------------------------------------------------------
- `is` COMPARA IDENTIDAD, `==` COMPARA VALOR: `a = 256; b = 256; a is b` suele
  dar `True` por la caché de enteros pequeños, pero con 1000 puede dar `False`.
  Usa `is` solo con singletons: `None`, `True`, `False`, centinelas.
- ARGUMENTOS POR DEFECTO MUTABLES: `def agregar(item, lista=[])` comparte la
  MISMA lista entre todas las llamadas (se crea una vez, al definir la función).
  Usa `lista: list | None = None` y dentro `if lista is None: lista = []`.
- `a = b = []` crea UNA sola lista con dos nombres. Con inmutables
  (`a = b = 0`) no hay problema porque nunca se modifican en el sitio.
- NO SOMBREES BUILT-INS: llamar a una variable `list`, `id`, `type`, `input`,
  `sum` o `str` rompe esas funciones en todo el módulo.
- `bool` ES UN `int`: `True + True == 2` y `isinstance(True, int)` es `True`.
  Al validar "es un número" excluye bool explícitamente si importa.
- `copy()` ES SUPERFICIAL: copia el contenedor externo, pero las listas o dicts
  anidados siguen compartidos. Para estructuras anidadas usa `deepcopy`.
- NOMBRES: `snake_case` para variables y funciones, descriptivos
  (`total_con_iva`, no `t2`). PEP 8 es el estándar de facto.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Ficha de un servidor: crea las variables `hostname`, `memoria_mb`, `activo`,
   `ultimo_error = None` y `peticiones = 0`; incrementa `peticiones` tres veces
   y muestra un resumen con una f-string, incluyendo `type()` de cada valor.
2. Intercambio elegante: declara `turno_manana` y `turno_noche` con nombres de
   empleados e intercámbialos en una sola línea con empaquetado de tuplas.
3. Enteros sin límite: calcula `2 ** 128` (rango de un UUID), muéstralo con
   separadores de miles (`f"{n:,}"`) e imprime cuántos dígitos tiene.

[Intermedio]
4. `detectar_tipo(valor) -> str`: devuelve "none", "bool", "int", "float",
   "str", "list", "dict" u "otro". Ojo: `bool` debe detectarse ANTES que `int`.
5. Laboratorio de identidad: demuestra con `id()` que `x += 1` sobre un `int`
   crea un objeto nuevo, mientras que `lista += [1]` conserva el mismo `id`.
6. Alias peligroso: escribe `aplicar_descuento(pedido: dict)` que mute el
   pedido recibido; demuestra el efecto en el original y luego escribe
   `aplicar_descuento_puro(pedido) -> dict` que devuelva un pedido nuevo.
7. Desempaquetado de registros: dada la lista `["2026-01-15", "ACME", 3, 450.0,
   "nota1", "nota2"]`, extrae `fecha, cliente, cantidad, precio, *notas` y
   calcula el total.

[Senior / Producción]
8. Bug del argumento mutable: crea `registrar_evento(evento, historial=[])`,
   llámala 3 veces y muestra que el historial "se acumula" entre llamadas;
   corrígela con el patrón del centinela `None` y añade type hints.
9. Copia superficial vs profunda: con una configuración anidada
   (`{"db": {"hosts": ["a", "b"]}}`), demuestra con `is` qué sub-objetos
   comparten `dict(cfg)`, `cfg.copy()` y `copy.deepcopy(cfg)`.
10. Contador de referencias: usando `sys.getrefcount`, muestra cómo cambia el
    contador de un objeto al crear alias, meterlo en una lista y borrar nombres
    con `del`; explica en comentarios por qué el número inicial no es 1.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
