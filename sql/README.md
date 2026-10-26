# Ruta Especializada SQL con SQLite (Nivel Básico a Senior)

Empieza por la [introducción a SQL](./INTRODUCCION.md) y sigue la [guía de instalación paso a paso](./INSTALACION.md).

## Cómo estudiar esta ruta

Estudia los archivos `01` a `30` en orden. Antes de comenzar, ejecuta [00_base_practica.sql](./00_base_practica.sql) para crear el esquema relacional y los datos semilla compartidos (dominios de E-Commerce, Académico y Recursos Humanos).

Cada archivo contiene **6 secciones pedagógicas** (Modelo mental, Casos reales, Sintaxis rápida, Ejemplo práctico con tabla de salida esperada, Buenas prácticas/Gotchas y **10 ejercicios progresivos** divididos en `[Básico]`, `[Intermedio]` y `[Senior / Producción]`).

## Plan de Estudios (30 Temas)

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
29. `29_patrones_diseno_datos.sql` — Soft delete, tablas de auditoría histórica, precios inmutables y libro mayor (*Ledger*)
30. `30_proyecto_integrador_empresarial.sql` — Arquitectura, consultas analíticas y optimización de un sistema empresarial completo
