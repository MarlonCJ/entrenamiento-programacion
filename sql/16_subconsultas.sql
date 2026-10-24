/*
================================================================================
TEMA 16: SUBCONSULTAS (ESCALARES, DE LISTA, CORRELACIONADAS Y TABLAS DERIVADAS)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Una subconsulta (subquery) es una sentencia `SELECT` anidada dentro de otra
sentencia SQL (`SELECT`, `INSERT`, `UPDATE` o `DELETE`).

Modelo mental: piensa en una subconsulta como una función auxiliar que se evalúa
para responder una pregunta intermedia antes (o durante) la consulta principal.
Según lo que devuelve y cómo interactúa con la consulta externa, se clasifica en:

- Subconsulta Escalar (1 fila, 1 columna): devuelve un único valor (ej. el
  precio promedio). Se usa donde iría una constante (`WHERE precio > (...)` o
  en la lista `SELECT`).
- Subconsulta de Columna / Lista (N filas, 1 columna): devuelve un conjunto de
  valores. Se usa con operadores de pertenencia como `IN` o `NOT IN`.
- Tabla Derivada (N filas, M columnas): una subconsulta en la cláusula `FROM`
  que actúa como una tabla temporal virtual en memoria para esa consulta.
- Subconsulta Correlacionada: a diferencia de las independientes (que se
  ejecutan una sola vez al inicio), la subconsulta correlacionada hace
  referencia a columnas de la tabla externa. Conceptualmente, se re-evalúa
  por cada fila candidata de la consulta externa (común con `EXISTS` / `NOT EXISTS`
  o comparaciones contra el promedio del propio grupo).

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
- Filtrar contra métricas dinámicas: "productos cuyo precio supera el promedio
  actual del catálogo" (sin quemar valores fijos en el código).
- Verificación de existencia (`EXISTS` / `NOT EXISTS`): encontrar clientes que
  han comprado al menos una vez, o clientes inactivos sin ningún pedido, sin
  duplicar filas como haría un `INNER JOIN` de 1 a muchos.
- Comparaciones por grupo: encontrar empleados que ganan más que el salario
  promedio de su propio departamento.
- Operaciones `UPDATE` o `DELETE` basadas en datos de otra tabla: cancelar
  pedidos de clientes de cierta ciudad o aplicar descuentos a productos sin ventas.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Subconsulta escalar en WHERE (se ejecuta 1 vez):
SELECT nombre, precio
FROM productos
WHERE precio > (SELECT AVG(precio) FROM productos);

-- B) Subconsulta de lista con IN:
SELECT nombre
FROM productos
WHERE categoria_id IN (
    SELECT id FROM categorias WHERE nombre IN ('Libros', 'Electronica')
);

-- C) Subconsulta correlacionada con EXISTS (semi-join eficiente):
SELECT c.id, c.nombre
FROM clientes c
WHERE EXISTS (
    SELECT 1 FROM pedidos p
    WHERE p.cliente_id = c.id AND p.estado = 'pagado'
);

-- D) Subconsulta correlacionada con NOT EXISTS (anti-join seguro ante NULLs):
SELECT c.id, c.nombre
FROM clientes c
WHERE NOT EXISTS (
    SELECT 1 FROM pedidos p WHERE p.cliente_id = c.id
);

-- E) Tabla derivada en FROM:
SELECT resumen.cliente_id, resumen.gasto_total
FROM (
    SELECT cliente_id, SUM(total) AS gasto_total
    FROM pedidos
    WHERE estado = 'pagado'
    GROUP BY cliente_id
) AS resumen
WHERE resumen.gasto_total >= 10.00;

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con resultado esperado)
--------------------------------------------------------------------------------
Escenario: Dirección Comercial solicita un reporte de los empleados cuyo salario
es superior al salario promedio de su propio departamento, mostrando también
el promedio de dicho departamento y la diferencia salarial.

Datos en `00_base_practica.sql` (`empleados`):
- id=1, Rosa,  depto=1, salario=3200
- id=2, Pablo, depto=2, salario=2800
- id=3, Nora,  depto=1, salario=3500
(Promedio depto 1 = 3350.0 | Promedio depto 2 = 2800.0)

Consulta paso a paso:
SELECT
    e.id,
    e.nombre,
    e.departamento_id,
    e.salario,
    (
        SELECT ROUND(AVG(e2.salario), 2)
        FROM empleados e2
        WHERE e2.departamento_id = e.departamento_id
    ) AS promedio_depto
FROM empleados e
WHERE e.salario > (
    SELECT AVG(e3.salario)
    FROM empleados e3
    WHERE e3.departamento_id = e.departamento_id
);

Resultado esperado:
+----+--------+-----------------+---------+----------------+
| id | nombre | departamento_id | salario | promedio_depto |
+----+--------+-----------------+---------+----------------+
| 3  | Nora   | 1               | 3500.0  | 3350.0         |
+----+--------+-----------------+---------+----------------+
(Rosa gana 3200 < 3350; Pablo gana 2800 = 2800; solo Nora supera su promedio).

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
- EL PELIGRO MORTAL DE `NOT IN` CON `NULL`:
  Si la subconsulta dentro de `WHERE id NOT IN (SELECT col FROM tabla)` devuelve
  aunque sea un solo valor `NULL`, la expresión equivale a `id <> 1 AND id <> NULL`,
  lo cual evalúa a `UNKNOWN` en lógica trivalente y la consulta devuelve **0 filas**
  silenciosamente.
  Regla de oro: prefiere SIEMPRE `NOT EXISTS` sobre `NOT IN` (o filtra
  explícitamente `WHERE col IS NOT NULL` dentro del `NOT IN`).
- `EXISTS` vs `IN` e `INNER JOIN`:
  - `INNER JOIN` entre `clientes` (1) y `pedidos` (N) duplica al cliente si tiene
    varios pedidos (obligándote a usar `DISTINCT`).
  - `EXISTS` hace cortocircuito (short-circuit): en cuanto encuentra la primera
    fila que cumple la condición en la tabla interna, deja de buscar y devuelve
    verdadero. Usa `SELECT 1` por convención dentro de `EXISTS`.
- Subconsultas correlacionadas en el `SELECT` sobre millones de filas:
  Pueden causar un problema de rendimiento tipo N+1 dentro del propio motor si
  no hay índices en la columna de correlación. Considera usar un `LEFT JOIN`
  con una CTE pre-agrupada o Funciones de Ventana (`AVG() OVER (PARTITION BY ...)`).
- Error de subconsulta escalar con múltiples filas:
  Si usas `=` o `>` con una subconsulta (`WHERE precio = (SELECT ...)`), la
  subconsulta debe garantizar máximo 1 fila (`AVG`, `MAX`, `LIMIT 1`, o filtro
  por clave `UNIQUE`).

6. EJERCICIOS PROGRESIVOS (10 Retos: [Básico] 1-3, [Intermedio] 4-7, [Senior / Producción] 8-10)
--------------------------------------------------------------------------------
[Básico]
1. Productos sobre la media: Escribe una consulta con una subconsulta escalar
   que liste `id`, `nombre` y `precio` de todos los productos cuyo precio sea
   estrictamente mayor que el precio promedio de la tabla `productos`.
2. Filtro con `IN`: Muestra el `nombre` y `precio` de los productos que
   pertenecen a las categorías llamadas `'Libros'` o `'Papeleria'` utilizando
   una subconsulta con `IN` sobre la tabla `categorias` (sin usar `JOIN`).
3. Pedido más costoso: Obtén todas las columnas del pedido (o pedidos, si hay
   empate) que tenga el `total` más alto registrado en la tabla `pedidos`
   usando una subconsulta con `MAX(total)`.

[Intermedio]
4. Existencia con `EXISTS`: Lista `id`, `nombre`, `apellido` y `ciudad` de los
   clientes que tienen al menos un pedido registrado en la tabla `pedidos`,
   usando `EXISTS`. Verifica que ningún cliente aparezca duplicado.
5. Anti-join seguro con `NOT EXISTS`: Encuentra los clientes (`id`, `nombre`,
   `apellido`) que NUNCA han realizado un pedido. Luego añade una variante que
   liste los productos que nunca han sido incluidos en `detalle_pedido`.
6. Notas superiores al promedio de su curso: Usando la tabla `resultados`,
   muestra `estudiante_id`, `curso_id` y `nota` de aquellos registros cuya
   nota supere el promedio de ese mismo `curso_id` (subconsulta correlacionada).
7. Subconsulta escalar vs `JOIN`: Muestra `id`, `nombre` del cliente y una
   columna calculada `cantidad_pedidos` obtenida mediante una subconsulta
   correlacionada en el `SELECT`. Debajo, escribe la consulta equivalente usando
   `LEFT JOIN` y `GROUP BY`, y comenta cuándo preferirías cada una.

[Senior / Producción]
8. Auditoría de discrepancias financieras (Tabla derivada): En un sistema real,
   el campo `pedidos.total` podría desincronizarse de la suma real de sus líneas
   en `detalle_pedido` (`SUM(cantidad * precio_unitario)`). Usa una subconsulta
   en `FROM` (o correlacionada) para detectar cualquier pedido donde `pedidos.total`
   difiera en más de 0.01 del total calculado desde `detalle_pedido`.
9. Trampa de `NOT IN` con `NULL` (Demostración práctica): Escribe un comentario
   y una consulta de prueba (puedes usar una subconsulta con `UNION ALL SELECT NULL`)
   que demuestre cómo `WHERE id NOT IN (...)` devuelve 0 filas cuando aparece
   un `NULL`, y reescríbela de forma blindada con `NOT EXISTS`.
10. Refactorización de consulta de reporte: Imagina una consulta que obtiene
    los clientes cuyo gasto total en pedidos con `estado = 'pagado'` supera el
    gasto promedio por pedido de toda la tienda, e incluye la fecha de su último
    pedido. Escríbela combinando una tabla derivada y una subconsulta escalar
    con nombres de alias claros y formato de producción.
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
