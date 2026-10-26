# Ruta Completa de Ingeniería en Python Moderno (Python 3.12+ - Nivel Básico a Senior)

Empieza por la [introducción a Python](./INTRODUCCION.md) y sigue la [guía de instalación paso a paso](./INSTALACION.md).

## Cómo estudiar esta ruta

Estudia los archivos `01` a `30` en orden. Todos usan **Python 3.12+** y las prácticas modernas del ecosistema: *type hints* (`list[int]`, `X | None`, `typing.Final`, `Protocol`), `dataclasses`, `enum`, `match/case`, f-strings, `pathlib`, `decimal`, `itertools`/`functools`/`collections`, `asyncio`, `unittest`/`pytest` y los módulos de seguridad `hashlib`, `hmac` y `secrets`. No se requieren paquetes externos.

Ejecuta cualquier archivo desde la raíz del repositorio:

```powershell
python python\01_variables.py
# o, si el alias "python" no está disponible en Windows:
py python\01_variables.py
```

Cada archivo contiene **6 secciones pedagógicas** dentro de un docstring de módulo (Modelo mental en CPython, Casos de uso reales, Sintaxis y referencia rápida, Ejemplo práctico con salida esperada, Buenas prácticas / Gotchas y **10 ejercicios progresivos** divididos en `[Básico]`, `[Intermedio]` y `[Senior / Producción]`). Escribe tus soluciones en la zona de trabajo al final de cada archivo.

> Consejo: activa un verificador de tipos (`mypy` o Pylance en modo *strict*) y un linter (`ruff`) desde el principio; varios retos lo piden explícitamente.

## Plan de Estudios (30 Temas)

### Fase 1: Fundamentos y Control de Flujo
1. `01_variables.py` - Nombres como referencias a objetos, `id()`, mutables vs inmutables, `int` de precisión arbitraria, caché de enteros pequeños y `deepcopy`
2. `02_constantes.py` - Convención `MAYÚSCULAS`, `typing.Final`, `Enum`/`StrEnum`/`IntEnum`, `MappingProxyType`, `@dataclass(frozen=True)` e inmutabilidad superficial vs profunda
3. `03_entrada_salida.py` - `input()`, `print(sep, end, file, flush)`, stdin/stdout/stderr, f-strings y minilenguaje de formato, `pprint` y `logging`
4. `04_conversion_validacion.py` - Tipado dinámico pero fuerte, conversores (`int`, `float`, `Decimal`), EAFP vs LBYL y validación defensiva de datos externos
5. `05_operadores_aritmeticos.py` - `/` vs `//` vs `%` con negativos, `divmod`, `round()` bancario, IEEE 754, `math`, `Decimal` y `Fraction`
6. `06_asignacion_unarios.py` - Asignación aumentada (`__iadd__`), ausencia de `++`, desempaquetado, operador morsa `:=` y la trampa de `tupla[0] += [...]`
7. `07_comparacion_logicos.py` - `==` vs `is`, comparaciones encadenadas, *truthiness*, cortocircuito de `and`/`or`, `any`/`all` y NaN
8. `08_bitwise_ternario_precedencia.py` - Operadores bit a bit sobre enteros infinitos, `enum.Flag`, expresión condicional y tabla de precedencia
9. `09_condicionales.py` - `if/elif/else`, *guard clauses*, `match/case` estructural (mapeos, secuencias, clases, guardas) y despacho por diccionario
10. `10_bucles.py` - Protocolo de iteración (`iter`/`next`), `for/else`, `enumerate`, `zip(strict=True)`, generadores e `itertools` (`batched`, `pairwise`)

### Fase 2: Estructuras, Funciones y Sistema
11. `11_cadenas.py` - `str` inmutable Unicode, métodos, slicing, normalización y `join` eficiente
12. `12_arreglos.py` - Listas y tuplas, slicing, sobreasignación de `list` en CPython, copias y comprensiones
13. `13_colecciones.py` - `dict`, `set`, `collections` (`Counter`, `defaultdict`, `deque`, `ChainMap`) y *hashing*
14. `14_funciones.py` - Funciones como objetos, parámetros posicionales/nombrados, `*args`/`**kwargs`, `lambda` y *type hints*
15. `15_ambito_variables.py` - Regla LEGB, `global`/`nonlocal`, closures y decoradores básicos
16. `16_recursion.py` - Pila de llamadas, límite de recursión, `lru_cache`, recorridos de árboles y conversión a iterativo
17. `17_excepciones.py` - Jerarquía de excepciones, `try/except/else/finally`, encadenamiento (`raise ... from`), `ExceptionGroup` y excepciones propias
18. `18_archivos.py` - `pathlib`, `open` con codificación, *context managers*, CSV/JSON, lectura en streaming y escritura atómica
19. `19_modulos.py` - Módulos y paquetes, `import`, `__name__ == "__main__"`, caché `sys.modules`, entornos virtuales y `pyproject.toml`

### Fase 3: POO, Calidad y Algoritmia Clásica
20. `20_programacion_objetos.py` - Clases, `__init__`, propiedades, métodos especiales, `@classmethod`/`@staticmethod`, `dataclasses` y `__slots__`
21. `21_herencia_polimorfismo.py` - Herencia, `super()`, MRO C3, clases abstractas (`abc`), `Protocol` (*duck typing* estático) y composición
22. `22_pruebas_depurar.py` - `unittest`/`pytest`, patrón AAA, *mocks*, `assert`, `pdb`/`breakpoint()` y `logging`
23. `23_algoritmos_busqueda_ordenamiento.py` - Búsqueda binaria y `bisect`, TimSort estable, `key=` y ordenamientos clásicos
24. `24_estructuras_datos.py` - Pilas, colas con `deque`, `heapq`, listas enlazadas, árboles y grafos

### Fase 4: Ingeniería de Software Avanzada (Nivel Senior)
25. `25_programacion_funcional.py` - Funciones puras, `map`/`filter`/`reduce`, comprensiones, `functools.partial`, composición e inmutabilidad
26. `26_asincronia_concurrencia.py` - GIL, `threading` vs `multiprocessing`, `concurrent.futures`, `asyncio` (`TaskGroup`, semáforos, *timeouts*)
27. `27_regex_fechas_json.py` - Módulo `re`, `datetime` con zonas horarias (`zoneinfo`), ISO 8601 y `json` con serialización personalizada
28. `28_complejidad_optimizacion.py` - Big-O de las estructuras de CPython, `timeit`, `cProfile`, `lru_cache` y caché LRU
29. `29_clean_code_solid_patrones.py` - Clean Code, SOLID y patrones de diseño pythónicos (*Strategy*, *Factory*, *Decorator*, *Observer*, *Circuit Breaker*)
30. `30_seguridad_arquitectura_proyecto.py` - Seguridad OWASP (`hashlib.scrypt`, `hmac.compare_digest`, `secrets`, SQL parametrizado), arquitectura en capas y **Proyecto Integrador Final**
