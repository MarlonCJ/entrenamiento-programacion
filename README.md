# Escuela de Ingeniería y Fundamentos de Programación

Proyecto de entrenamiento intensivo para dominar desde los fundamentos hasta prácticas de ingeniería de software de nivel profesional (**Senior**) en **PHP, JavaScript, TypeScript, Python, Java y SQL**.

> **Empieza aquí:** Lee primero la [**Guía de Excelencia para el Desarrollador**](./GUIA_EXCELENCIA_DESARROLLADOR.md) para conocer el método de estudio, cómo resolver problemas paso a paso y los principios de código limpio y arquitectura que aplicarás en cada reto.

---

## Cómo está organizado el proyecto

Cada lenguaje contiene **30 temas progresivos** divididos en 4 fases de crecimiento profesional. SQL cuenta con su propia ruta especializada de **30 temas** enfocada en diseño relacional, consultas analíticas, transacciones ACID, optimización de índices y arquitectura de datos.

Dentro de **cada archivo** encontrarás 6 secciones diseñadas para que comprendas rápido y a profundidad cómo usar cada concepto:

1. **¿Qué es y por qué importa? (Modelo Mental)**: Explicación clara, directa y cómo funciona internamente en memoria o en el motor del lenguaje.
2. **¿Cuándo usarlo en el mundo real?**: Casos de uso reales en la industria (e-commerce, banca, APIs, reportes, automatización).
3. **Sintaxis y Referencia Rápida**: Ejemplos concisos y comentados de todas las variantes importantes.
4. **Ejemplo Práctico de Uso Real (Paso a paso)**: Un mini-sistema o caso realista resuelto de principio a fin con su salida esperada.
5. **Buenas Prácticas y Errores Comunes (`Clean Code & Gotchas`)**: Consejos de nivel Senior y trampas frecuentes que debes evitar en producción.
6. **10 Ejercicios Progresivos (`[Básico]` → `[Intermedio]` → `[Senior / Producción]`)**: Retos graduados para resolver en la zona de trabajo al final del archivo.

---

## Plan de Estudios: Los 30 Temas (Lenguajes de Programación)

### Fase 1: Fundamentos y Control de Flujo
1. `01_variables` — Variables, tipos de datos y modelo de memoria
2. `02_constantes` — Constantes e inmutabilidad
3. `03_entrada_salida` — Entrada, salida y formateo por consola
4. `04_conversion_validacion` — Conversión segura y validación defensiva de datos
5. `05_operadores_aritmeticos` — Operaciones numéricas, precisión decimal y matemáticas
6. `06_asignacion_unarios` — Operadores de asignación compuesta e incremento/decremento
7. `07_comparacion_logicos` — Comparaciones estrictas, álgebra booleana y cortocircuito
8. `08_bitwise_ternario_precedencia` — Operadores bit a bit, ternario, coalescencia nula y precedencia
9. `09_condicionales` — Decisiones, cláusulas de guarda (`Guard Clauses`) y `switch`/`match`
10. `10_bucles` — Iteración, control de bucles y recorrido de estructuras

### Fase 2: Estructuras de Datos, Funciones y Modularidad
11. `11_cadenas` — Manipulación, formateo y procesamiento de cadenas de texto
12. `12_arreglos` — Arreglos, listas y tuplas
13. `13_colecciones` — Mapas/diccionarios ($O(1)$), conjuntos (`Set`) y colecciones
14. `14_funciones` — Diseño de funciones, parámetros, contratos y retorno de valores
15. `15_ambito_variables` — Alcance (`scope`), ciclo de vida y *closures*
16. `16_recursion` — Recursión, pila de llamadas (*call stack*) y casos base
17. `17_excepciones` — Manejo profesional de errores, excepciones personalizadas y `finally`
18. `18_archivos` — Lectura, escritura y procesamiento seguro de archivos
19. `19_modulos` — Módulos, paquetes, importaciones y organización de proyectos

### Fase 3: POO, Calidad y Algoritmia Clásica
20. `20_programacion_objetos` — Clases, objetos, encapsulación e invariantes de dominio
21. `21_herencia_polimorfismo` — Herencia, composición, interfaces y polimorfismo
22. `22_pruebas_depurar` — Pruebas automatizadas (`AAA`), aserciones y depuración científica
23. `23_algoritmos_busqueda_ordenamiento` — Búsqueda lineal, búsqueda binaria y algoritmos de ordenamiento
24. `24_estructuras_datos` — Pilas (`Stack` LIFO), Colas (`Queue` FIFO) y aplicaciones reales

### Fase 4: Ingeniería de Software Avanzada (Nivel Senior)
25. `25_programacion_funcional` — Funciones puras, `map`/`filter`/`reduce`, Streams/Genéricos e inmutabilidad
26. `26_asincronia_concurrencia` — Asincronía (`async`/`await`, Promesas, Hilos/Fibers) y concurrencia
27. `27_regex_fechas_json` — Expresiones regulares, fechas ISO-8601/UTC y serialización JSON segura
28. `28_complejidad_optimizacion` — Complejidad algorítmica (Big-O), memoización y optimización de memoria
29. `29_clean_code_solid_patrones` — Clean Code, Principios SOLID y Patrones de Diseño (Factory, Strategy, Observer/Repository)
30. `30_seguridad_arquitectura_proyecto` — Seguridad (OWASP, sanitización), arquitectura en capas y **Proyecto Integrador Final**

---

## Plan de Estudios: Ruta Especializada SQL (30 Temas)

1. `01_bases_relacionales.sql` — Modelo relacional, tablas, filas, columnas y claves
2. `02_tipos_datos.sql` — Tipos de datos, afinidad en SQLite, fechas y valores monetarios
3. `03_crear_tablas.sql` — Diseño DDL: `CREATE TABLE`, `ALTER TABLE` y `DROP TABLE`
4. `04_restricciones_claves.sql` — Integridad de datos: `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK`, `NOT NULL`
5. `05_select.sql` — Proyecciones, alias, expresiones y `DISTINCT`
6. `06_filtros.sql` — Filtrado con `WHERE`, `IN`, `BETWEEN` y `LIKE`
7. `07_operadores_aritmeticos.sql` — Cálculos en consultas, impuestos, márgenes y redondeo
8. `08_comparacion_logicos.sql` — Lógica booleana (`AND`, `OR`, `NOT`) y precedencia de operadores
9. `09_null_case.sql` — Lógica trivalente de `NULL`, `COALESCE`, `NULLIF` y expresiones `CASE WHEN`
10. `10_orden_limite.sql` — Ordenamiento múltiple (`ORDER BY`) y paginación (`LIMIT`, `OFFSET`)
11. `11_funciones_agregacion.sql` — Resumen de datos con `COUNT`, `SUM`, `AVG`, `MIN` y `MAX`
12. `12_group_by_having.sql` — Agrupaciones y filtrado de grupos (`GROUP BY` vs `HAVING` vs `WHERE`)
13. `13_insertar_datos.sql` — Inserción simple, múltiple, `INSERT ... SELECT` y manejo de conflictos (`UPSERT`)
14. `14_actualizar_eliminar.sql` — Modificación y borrado seguro (`UPDATE` y `DELETE` con validaciones)
15. `15_joins.sql` — Combinación de tablas: `INNER JOIN`, `LEFT JOIN`, auto-joins y múltiples tablas
16. `16_subconsultas.sql` — Subconsultas escalares, de lista, correlacionadas y `EXISTS`
17. `17_cte.sql` — Expresiones de tabla común (`WITH` / CTE) y consultas legibles paso a paso
18. `18_funciones_texto_fecha.sql` — Procesamiento de texto y aritmética de fechas en el motor SQL
19. `19_vistas.sql` — Vistas reutilizables (`CREATE VIEW`), abstracción y seguridad de lectura
20. `20_indices.sql` — Índices B-Tree, selectividad y aceleración de búsquedas
21. `21_transacciones.sql` — Transacciones (`BEGIN`, `COMMIT`, `ROLLBACK`) y consistencia de datos
22. `22_relaciones_normalizacion.sql` — Relaciones 1:1, 1:N, N:M y Formas Normales (1FN, 2FN, 3FN)
23. `23_funciones_ventana.sql` — Analítica avanzada con `OVER`, `PARTITION BY`, `ROW_NUMBER`, `RANK`, `LAG` y `LEAD`
24. `24_seguridad_explain_mantenimiento.sql` — Prevención de SQL Injection, `EXPLAIN` y mantenimiento (`VACUUM`, `ANALYZE`)
25. `25_triggers_automatizacion.sql` — Triggers (`BEFORE`/`AFTER`), validaciones automáticas y auditoría en motor
26. `26_json_busqueda_avanzada.sql` — Funciones JSON en SQL (`json_extract`, `json_each`, `json_object`) y búsqueda avanzada
27. `27_concurrencia_aislamiento_acid.sql` — Propiedades ACID a fondo, `SAVEPOINT`, bloqueos y condiciones de carrera
28. `28_optimizacion_avanzada_queries.sql` — Índices compuestos, *covering indexes*, paginación *keyset* y antipatrones SQL
29. `29_patrones_diseno_datos.sql` — Soft delete, tablas de auditoría histórica, precios inmutables y versionado
30. `30_proyecto_integrador_empresarial.sql` — Arquitectura, consultas analíticas y optimización de un sistema empresarial completo

---

## Lenguajes y Guías Rápidas

- **Guía transversal:** [Guía de Excelencia para el Desarrollador](./GUIA_EXCELENCIA_DESARROLLADOR.md)
- **PHP:** [README](./php/README.md) — [Introducción](./php/INTRODUCCION.md) — [Instalación paso a paso](./php/INSTALACION.md) — [Carpeta `./php/`](./php/)
- **JavaScript:** [README](./javascript/README.md) — [Introducción](./javascript/INTRODUCCION.md) — [Instalación paso a paso](./javascript/INSTALACION.md) — [Carpeta `./javascript/`](./javascript/)
- **TypeScript:** [README](./typescript/README.md) — [Introducción](./typescript/INTRODUCCION.md) — [Instalación paso a paso](./typescript/INSTALACION.md) — [Carpeta `./typescript/`](./typescript/)
- **Python:** [README](./python/README.md) — [Introducción](./python/INTRODUCCION.md) — [Instalación paso a paso](./python/INSTALACION.md) — [Carpeta `./python/`](./python/)
- **Java:** [README](./java/README.md) — [Introducción](./java/INTRODUCCION.md) — [Instalación paso a paso](./java/INSTALACION.md) — [Carpeta `./java/`](./java/)
- **SQL:** [README](./sql/README.md) — [Introducción](./sql/INTRODUCCION.md) — [Instalación paso a paso](./sql/INSTALACION.md) — [Carpeta `./sql/`](./sql/)
