/*
================================================================================
TEMA 15: COMBINACIÓN DE TABLAS (INNER JOIN, LEFT JOIN, MULTI-JOIN Y SELF-JOIN)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
En una base de datos normalizada, la información no se duplica en una sola
tabla gigante: los clientes están en `clientes`, las órdenes en `pedidos` y los
artículos en `productos`. La cláusula `JOIN` permite reconstruir estas relaciones
en tiempo de consulta combinando filas de dos o más tablas mediante una condición
de enlace (`ON`), habitualmente igualando la clave foránea (`FOREIGN KEY`) con
la clave primaria (`PRIMARY KEY`).

Modelo mental de los tipos de `JOIN`:
- `INNER JOIN` (Intersección): Devuelve únicamente las filas que tienen
  coincidencia en AMBAS tablas. Si un cliente nunca ha hecho un pedido, NO
  aparecerá en un `clientes INNER JOIN pedidos`.
- `LEFT JOIN` (Tabla izquierda completa + coincidencias de la derecha): Devuelve
  TODAS las filas de la tabla izquierda (`FROM`). Si una fila no tiene
  coincidencia en la tabla derecha, las columnas de la tabla derecha se rellenan
  con `NULL`. Es indispensable para encontrar registros "huérfanos" o sin
  actividad (`WHERE derecha.id IS NULL`, conocido como *Anti-Join*).
- `CROSS JOIN` (Producto cartesiano): Combina cada fila de A con cada fila de B
  ($N \times M$ filas). Útil para generar matrices de combinaciones.
- *Self-Join* (Autounión): Unir una tabla consigo misma usando dos alias
  distintos para comparar filas dentro de la misma entidad.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Facturación y Detalle de Órdenes: Unir `pedidos` + `clientes` +
    `detalle_pedido` + `productos` para generar el recibo completo de compra.
  - Detección de Inactividad (*Anti-Join* con `LEFT JOIN`): Encontrar clientes
    que se registraron pero nunca han comprado, o productos que jamás se han
    vendido.
  - Reportes Ejecutivos Cruzados: Calcular ingresos totales por nombre de
    categoría o masa salarial por nombre de departamento.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) INNER JOIN con alias de tabla claros y cortos
SELECT
    p.id       AS producto_id,
    p.nombre   AS producto,
    p.precio,
    c.nombre   AS categoria
FROM productos AS p
INNER JOIN categorias AS c ON p.categoria_id = c.id;

-- B) LEFT JOIN para incluir registros sin coincidencias (y patrón Anti-Join)
SELECT
    cl.id,
    cl.nombre,
    pe.id AS pedido_id
FROM clientes AS cl
LEFT JOIN pedidos AS pe ON pe.cliente_id = cl.id
WHERE pe.id IS NULL; -- Filtra clientes que tienen CERO pedidos

-- C) Multi-JOIN (3 o más tablas en cadena)
SELECT
    pe.id               AS pedido_id,
    cl.nombre           AS cliente,
    pr.nombre           AS producto,
    dp.cantidad,
    dp.precio_unitario
FROM pedidos AS pe
INNER JOIN clientes AS cl       ON pe.cliente_id = cl.id
INNER JOIN detalle_pedido AS dp ON dp.pedido_id = pe.id
INNER JOIN productos AS pr      ON dp.producto_id = pr.id;

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: El equipo comercial requiere un reporte de todos los clientes
registrados que muestre cuántos pedidos ha realizado cada uno y el monto total
facturado, incluyendo con `0` a los clientes que aún no han realizado compras.
*/
-- SELECT
--     c.id,
--     c.nombre || ' ' || c.apellido    AS cliente,
--     c.ciudad,
--     COUNT(p.id)                      AS total_pedidos,
--     ROUND(COALESCE(SUM(p.total), 0), 2) AS monto_acumulado
-- FROM clientes AS c
-- LEFT JOIN pedidos AS p ON p.cliente_id = c.id
-- GROUP BY c.id, c.nombre, c.apellido, c.ciudad
-- ORDER BY monto_acumulado DESC, c.id ASC;
/*
Resultado esperado:
+----+------------+--------+---------------+-----------------+
| id | cliente    | ciudad | total_pedidos | monto_acumulado |
+----+------------+--------+---------------+-----------------+
| 1  | Ana Perez  | Bogota | 2             | 28.0            |
| 2  | Luis Gomez | Cali   | 1             | 25.5            |
| 3  | Mia Torres | Bogota | 0             | 0.0             |
+----+------------+--------+---------------+-----------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - EL ERROR MÁS COMÚN EN `LEFT JOIN` (Filtro en `WHERE` vs `ON`):
    Si haces `FROM clientes c LEFT JOIN pedidos p ON p.cliente_id = c.id WHERE p.estado = 'pagado'`,
    ¡convertiste silenciosamente tu `LEFT JOIN` en un `INNER JOIN`! Porque para
    los clientes sin pedidos, `p.estado` es `NULL`, y `WHERE NULL = 'pagado'`
    los elimina. Si quieres conservar todos los clientes y solo unir sus pedidos
    pagados, pon la condición en el `ON`:
    `LEFT JOIN pedidos p ON p.cliente_id = c.id AND p.estado = 'pagado'`.
  - CONTEO EN `LEFT JOIN`: Usa `COUNT(tabla_derecha.id)` y NUNCA `COUNT(*)`.
    `COUNT(*)` cuenta la fila generada por el `LEFT JOIN` aunque la derecha sea
    `NULL`, devolviendo `1` pedido para clientes que tienen `0` pedidos.
  - CALIFICA SIEMPRE LAS COLUMNAS CON SU ALIAS (`p.id`, `c.nombre`): Evita
    errores de columna ambigua (`ambiguous column name`) y hace que cualquier
    desarrollador entienda de qué tabla proviene cada dato sin adivinar.

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Une `productos` con `categorias` (`INNER JOIN`) para mostrar el `id` del
   producto, su `nombre`, su `precio` y el `nombre` de su categoría.
2. Une `pedidos` con `clientes` para mostrar el `id` del pedido, la `fecha`, el
   `estado`, el `total` y el nombre completo del cliente.
3. Une `empleados` con `departamentos` para listar el nombre de cada empleado,
   su `salario` y el nombre de su departamento.

[Intermedio]
4. Usa `LEFT JOIN` entre `clientes` y `pedidos` para listar todos los clientes
   junto con sus pedidos, y luego filtra con `WHERE p.id IS NULL` (*Anti-Join*)
   para mostrar únicamente los clientes que nunca han hecho un pedido.
5. Une 3 tablas (`matriculas`, `estudiantes` y `cursos`) para mostrar el nombre
   del estudiante, el nombre del curso inscrito y la fecha de matrícula.
6. Une 4 tablas (`pedidos`, `clientes`, `detalle_pedido` y `productos`) para
   generar el desglose línea por línea de cada orden: número de pedido, cliente,
   producto, cantidad, precio unitario y subtotal (`cantidad * precio_unitario`).
7. Une `categorias` con `productos` usando `LEFT JOIN` y agrupa por categoría
   para mostrar el nombre de la categoría, cuántos productos tiene (`COUNT(p.id)`)
   y el total de unidades en stock (`COALESCE(SUM(p.existencias), 0)`).

[Senior / Producción]
8. Demuestra la diferencia entre filtrar en `ON` vs `WHERE` en un `LEFT JOIN`:
   Lista TODOS los clientes junto con la cantidad y suma de sus pedidos
   `'pagado'` usando `LEFT JOIN pedidos p ON p.cliente_id = c.id AND p.estado = 'pagado'`,
   garantizando que los clientes sin pedidos pagados aparezcan con `0`.
9. Reporte académico consolidado con múltiples `LEFT JOIN`: Lista TODOS los
   estudiantes junto con los cursos en los que están matriculados y, si ya tienen
   calificación en `resultados`, muestra su `nota` (o `'Pendiente'` con `COALESCE`
   si aún no tienen nota).
10. *Self-Join* (Autounión): Une la tabla `empleados` consigo misma (`empleados e1`
    y `empleados e2`) para encontrar pares de compañeros que trabajan en el mismo
    departamento (`e1.departamento_id = e2.departamento_id AND e1.id < e2.id`) y
    mostrar la diferencia salarial entre ambos.
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
