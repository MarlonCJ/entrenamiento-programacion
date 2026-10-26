# Ruta Completa de Ingeniería en PHP 8.x (Nivel Básico a Senior)

Empieza por la [introducción a PHP](./INTRODUCCION.md) y sigue la [guía de instalación paso a paso](./INSTALACION.md).

## Cómo estudiar esta ruta

Estudia los archivos `01` a `30` en orden. Todos los archivos utilizan `declare(strict_types=1);` y las prácticas modernas de **PHP 8.x** (PSR-12, tipado estricto, `match`, Constructor Property Promotion, `readonly`, `enum`, `Fiber` y seguridad nativa). Puedes ejecutar cualquier archivo desde la terminal:

```bash
php php/01_variables.php
```

Cada archivo contiene **6 secciones pedagógicas** (Modelo mental en el Zend Engine, Casos de uso reales, Sintaxis rápida de PHP 8.x, Ejemplo práctico con salida esperada, Buenas prácticas / PSR-12 / Gotchas y **10 ejercicios progresivos** divididos en `[Básico]`, `[Intermedio]` y `[Senior / Producción]`).

## Plan de Estudios (30 Temas)

### Fase 1: Fundamentos y Control de Flujo
1. `01_variables.php` — Variables, tipos de datos, `declare(strict_types=1)` y modelo de memoria (`zval` y *Copy-On-Write*)
2. `02_constantes.php` — Constantes (`const`), constantes mágicas (`__DIR__`), inmutabilidad, `readonly` y `enum`
3. `03_entrada_salida.php` — Flujos estándar CLI (`STDIN`, `STDOUT`, `STDERR`), formateo con `sprintf` y Heredoc/Nowdoc
4. `04_conversion_validacion.php` — Peligros del *Type Juggling*, conversión segura y validación con `filter_var()`
5. `05_operadores_aritmeticos.php` — Operadores numéricos, división entera (`intdiv`), modos de redondeo y contabilidad en centavos
6. `06_asignacion_unarios.php` — Asignación compuesta, coalescencia nula (`??=`), `.=` y pre/post incremento
7. `07_comparacion_logicos.php` — Identidad estricta (`===`), operador nave espacial (`<=>`), cortocircuito y peligro de `and`/`or`
8. `08_bitwise_ternario_precedencia.php` — Máscaras de bits (*Bitmasks*), ternario, coalescencia (`??`), *Nullsafe* (`?->`) y precedencia
9. `09_condicionales.php` — Cláusulas de guarda (*Guard Clauses*) y expresión `match` (PHP 8.0+) frente a `switch`
10. `10_bucles.php` — `foreach` con destructuring, `for`, `while`, `break`/`continue` y Generadores perezosos (`yield`)

### Fase 2: Estructuras de Datos, Funciones y Modularidad
11. `11_cadenas.php` — Strings en bytes vs Multibyte UTF-8 (`mb_*`), `str_contains`/`str_starts_with` y sanitización
12. `12_arreglos.php` — *Packed Arrays*, `array_is_list()`, destructuring, operador spread (`...`) y peligro de huecos con `unset()`
13. `13_colecciones.php` — Tablas Hash ordenadas ($O(1)$), Sets con `array_flip()`, `array_column()` y `WeakMap`
14. `14_funciones.php` — Contratos tipados, *Union/Intersection Types*, `never`, variádicos y *Named Arguments*
15. `15_ambito_variables.php` — Alcance léxico, `Closure` con `use ($var)` vs Arrow Functions (`fn() =>`) y variables `static`
16. `16_recursion.php` — Recursión, *Call Stack*, recorrido de árboles jerárquicos y Memoización
17. `17_excepciones.php` — Jerarquía `Throwable` (`Error` vs `Exception`), `throw` como expresión, excepciones de dominio y `finally`
18. `18_archivos.php` — Lectura/escritura con bloqueo (`LOCK_EX`), streaming en memoria $O(1)$ (`fgets`/`fgetcsv`/`SplFileObject`) y *Path Traversal*
19. `19_modulos.php` — Espacios de nombres (`namespace`), estándar de autocarga **PSR-4** (`spl_autoload_register`) y `::class`

### Fase 3: POO, Calidad y Algoritmia Clásica
20. `20_programacion_objetos.php` — *Constructor Property Promotion*, clases/propiedades `readonly`, *Value Objects* e invariantes
21. `21_herencia_polimorfismo.php` — Interfaces, clases abstractas, `trait`, *Late Static Binding* (`static::`) y composición
22. `22_pruebas_depurar.php` — Pruebas automatizadas (patrón AAA), *Data Providers*, dobles de prueba (*Spy/Fake*) y depuración
23. `23_algoritmos_busqueda_ordenamiento.php` — Búsqueda binaria $O(\log n)$, ordenamiento estable en PHP 8 (`usort`, `uasort`) y `<=>`
24. `24_estructuras_datos.php` — Pilas (`SplStack`), Colas $O(1)$ (`SplQueue` vs lentitud de `array_shift`) y `SplPriorityQueue`

### Fase 4: Ingeniería de Software Avanzada (Nivel Senior)
25. `25_programacion_funcional.php` — Funciones puras, `array_map`, `array_filter`, `array_reduce`, pipelines y colecciones perezosas
26. `26_asincronia_concurrencia.php` — Multitarea cooperativa con **Fibers** (`Fiber`, PHP 8.1+), planificadores y bloqueos `flock()`
27. `27_regex_fechas_json.php` — Regex PCRE2 (`\A...\z`, grupos con nombre), `DateTimeImmutable` (UTC/ISO-8601) y `JSON_THROW_ON_ERROR`
28. `28_complejidad_optimizacion.php` — Complejidad Big-O, perfilado con `hrtime(true)`, *In-Memory Hash Join*, problema N+1 y caché LRU
29. `29_clean_code_solid_patrones.php` — Clean Code, Principios SOLID y Patrones de Diseño (Strategy, Factory, Decorator, Observer, Repository)
30. `30_seguridad_arquitectura_proyecto.php` — Seguridad OWASP (`password_hash`, `hash_equals`, `random_bytes`, `#[\SensitiveParameter]`, `PDO`), Arquitectura en Capas y **Proyecto Integrador Final**
