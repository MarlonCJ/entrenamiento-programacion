/*
================================================================================
TEMA 28: OPTIMIZACIÓN AVANZADA DE QUERIES (COVERING INDEXES, SARGABILITY Y KEYSET)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
A medida que una tabla pasa de 1,000 filas a 50 millones de filas, una consulta
que tardaba 2 milisegundos puede pasar a tardar 30 segundos y tumbar el servidor
por agotamiento de CPU e I/O de disco. Optimizar SQL de nivel Senior no consiste
en "adivinar", sino en entender cómo el **Optimizador de Consultas** recorre los
árboles B-Tree y cómo redactar predicados **SARGables** (*Search ARGument ABLE*).

Conceptos clave de arquitectura de rendimiento:
1. **Regla del Prefijo Izquierdo en Índices Compuestos**:
   Un índice `CREATE INDEX idx_ped_cli_fecha ON pedidos(cliente_id, fecha)`
   ordena primero por `cliente_id` y, dentro de cada cliente, por `fecha`.
   - Sirve para filtrar por `cliente_id`.
   - Sirve para filtrar por `cliente_id AND fecha`.
   - ¡NO sirve para buscar solo por `fecha`! (Porque `fecha` es la segunda columna).
2. **Covering Index (Índice Cubriente)**:
   Si un índice contiene TODAS las columnas requeridas por la consulta (`WHERE`,
   `JOIN`, `ORDER BY` y `SELECT`), el motor resuelve la consulta leyendo
   únicamente el índice (`USING COVERING INDEX`) sin tocar jamás la tabla base
   (*cero Table Lookups*).
3. **SARGability (Predicados que aprovechan índices)**:
   Si aplicas una función o cálculo sobre la columna indexada en el `WHERE`
   (ej. `WHERE SUBSTR(fecha, 1, 4) = '2026'` o `WHERE precio * 1.19 > 20`), el
   optimizador queda ciego y hace un *Full Table Scan*. Debes despejar la columna
   sola a un lado del operador:
   `WHERE fecha >= '2026-01-01' AND fecha < '2027-01-01'` y `WHERE precio > 20 / 1.19`.
4. **Índices Parciales (Partial Indexes)**:
   Indexar solo el subconjunto de filas que realmente se consulta con frecuencia
   (ej. `CREATE INDEX idx_pedidos_pendientes ON pedidos(fecha) WHERE estado = 'pendiente'`),
   reduciendo el tamaño del índice en un 90% y acelerando los `INSERT`/`UPDATE`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Feeds Infinitos y Paginación de Alta Escala (*Keyset Pagination*): Reemplazar
    `OFFSET 50000` por cursores basados en columnas indexadas `(fecha, id)`.
  - Colas de Trabajo y Procesos Pendientes: Índices parciales sobre
    `WHERE estado = 'pendiente'` o `WHERE activo = 1`.
  - Eliminación de Ordenamientos en Memoria (`USE TEMP B-TREE FOR ORDER BY`):
    Alinear las columnas del `WHERE` y del `ORDER BY` en el mismo índice compuesto
    para que los datos ya salgan ordenados directamente desde el B-Tree.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Índice Compuesto y Covering Index
--    Cubre: WHERE cliente_id = ? ORDER BY fecha DESC y entrega total sin ir a la tabla
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_fecha_total
ON pedidos (cliente_id, fecha DESC, total);

-- B) Índice Parcial (Solo indexa productos activos)
CREATE INDEX IF NOT EXISTS idx_productos_activos_precio
ON productos (categoria_id, precio)
WHERE activo = 1;

-- C) Reescritura SARGable (Mal vs Bien)
-- MAL (No usa índice en fecha):
-- SELECT * FROM pedidos WHERE SUBSTR(fecha, 1, 7) = '2026-02';
-- BIEN (Usa Range Scan en índice de fecha):
SELECT * FROM pedidos
WHERE fecha >= '2026-02-01' AND fecha < '2026-03-01';

-- D) Keyset Pagination (Paginación O(log N) constante sin OFFSET)
SELECT id, fecha, total
FROM pedidos
WHERE (fecha < '2026-02-11')
   OR (fecha = '2026-02-11' AND id < 3)
ORDER BY fecha DESC, id DESC
LIMIT 10;

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: Tenemos una consulta frecuente que obtiene las órdenes pagadas
de un cliente ordenadas por fecha descendente mostrando el `id`, `fecha` y `total`.
Vamos a diseñar un *Covering Index* parcial y comprobar con `EXPLAIN QUERY PLAN`
que el motor ejecuta un `SEARCH ... USING COVERING INDEX` sin ordenar en memoria.
*/
-- CREATE INDEX IF NOT EXISTS idx_cov_pedidos_pagados
-- ON pedidos (cliente_id, fecha DESC, total)
-- WHERE estado = 'pagado';
--
-- EXPLAIN QUERY PLAN
-- SELECT id, fecha, total
-- FROM pedidos
-- WHERE estado = 'pagado' AND cliente_id = 1
-- ORDER BY fecha DESC;
--
-- DROP INDEX IF EXISTS idx_cov_pedidos_pagados;
/*
Resultado esperado de EXPLAIN QUERY PLAN:
QUERY PLAN
`--SEARCH pedidos USING COVERING INDEX idx_cov_pedidos_pagados (cliente_id=?)
(Observa: 1. Usa COVERING INDEX, 2. No hay SCAN, 3. No hay USE TEMP B-TREE FOR ORDER BY)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - ANTIPATRÓN `SELECT *`: Pedir todas las columnas destruye la posibilidad de
    usar *Covering Indexes*, obligando al motor a saltar del índice a la página
    de la tabla por cada fila (*Random I/O*) y transmitiendo datos inútiles por red.
  - `LIKE '%texto%'` CON COMODÍN AL INICIO NO USA ÍNDICES B-TREE: Un índice B-Tree
    está ordenado alfabéticamente desde el primer carácter. `LIKE 'Lap%'` puede
    usar un índice (si `PRAGMA case_sensitive_like = ON` o la columna es `COLLATE NOCASE`),
    pero `LIKE '%piz'` obliga a recorrer toda la tabla. Para búsqueda de texto
    libre usa tablas virtuales **FTS5** (*Full-Text Search*).
  - `EXISTS` VS `IN` Y `NOT EXISTS` VS `NOT IN`:
    - `EXISTS` aplica cortocircuito en cuanto encuentra la primera coincidencia.
    - Peligro crítico con `NOT IN (SELECT col ...)`: si la subconsulta devuelve
      siquiera UN valor `NULL`, ¡`NOT IN` devuelve 0 filas para toda la consulta
      por lógica trivalente! Prefiere siempre `NOT EXISTS` o `LEFT JOIN ... WHERE id IS NULL`.

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Ejecuta `EXPLAIN QUERY PLAN` sobre `SELECT * FROM pedidos WHERE cliente_id = 1`
   sin índices adicionales y observa que realiza `SCAN pedidos`.
2. Reescriba la consulta antipatrón `SELECT id, nombre, precio FROM productos WHERE precio * 2 > 10`
   a su forma **SARGable** despejando la columna `precio`.
3. Reescriba la consulta no-SARGable `SELECT * FROM empleados WHERE SUBSTR(fecha_contratacion, 1, 4) = '2022'`
   usando un rango de fechas (`>=` y `<`) que sí pueda aprovechar un índice.

[Intermedio]
4. Demuestra la **Regla del Prefijo Izquierdo**: crea un índice temporal
   `idx_emp_depto_sal ON empleados(departamento_id, salario)` y compara el
   `EXPLAIN QUERY PLAN` de buscar por `departamento_id = 1` frente a buscar solo
   por `salario > 3000`.
5. Crea un **Covering Index** para la consulta `SELECT categoria_id, nombre, precio FROM productos WHERE categoria_id = 2`
   y demuestra con `EXPLAIN QUERY PLAN` que aparece `USING COVERING INDEX`.
6. Demuestra el peligro de `NOT IN` con `NULL`: compara el resultado de
   `SELECT id, nombre FROM clientes WHERE id NOT IN (1, NULL)` (devuelve 0 filas)
   frente a usar `NOT EXISTS` para encontrar clientes sin pedidos.
7. Elimina un ordenamiento en memoria (`USE TEMP B-TREE FOR ORDER BY`): analiza
   con `EXPLAIN QUERY PLAN` la consulta `SELECT id, nombre, salario FROM empleados WHERE departamento_id = 1 ORDER BY salario DESC`
   antes y después de crear un índice en `(departamento_id, salario DESC)`.

[Senior / Producción]
8. Diseña un **Índice Parcial** (*Partial Index*) sobre `productos` que indexe
   `(categoria_id, precio)` únicamente cuando `activo = 1 AND existencias > 0`,
   y verifica con `EXPLAIN QUERY PLAN` que una consulta del catálogo público lo utiliza.
9. Implementa **Keyset Pagination** compuesta sobre `empleados` ordenados por
   `salario DESC, id DESC`: obtén la Página 1 (`LIMIT 2`) y luego escribe la
   consulta exacta para obtener la Página 2 a partir del último `(salario, id)`
   de la Página 1 sin usar `OFFSET`.
10. Búsqueda de texto completo con **FTS5** (SQLite Full-Text Search): Crea una
    tabla virtual `CREATE VIRTUAL TABLE temp.productos_fts USING fts5(nombre, descripcion)`,
    cárgala con `INSERT INTO temp.productos_fts SELECT nombre, descripcion FROM productos`
    y realiza una búsqueda ultrarrápida con `WHERE productos_fts MATCH 'practica'`.
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
