/*
================================================================================
TEMA 11: FUNCIONES DE AGREGACIÓN (COUNT, SUM, AVG, MIN, MAX)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Las funciones de agregación toman un conjunto de filas y las colapsan en un
único valor resumen (escalar). Son el pilar de la analítica de datos, reportes
financieros y métricas de negocio (KPIs).

Comportamiento interno en el motor SQL:
- `COUNT(*)`: Cuenta el número total de filas que superan el filtro `WHERE`,
  sin importar si contienen valores `NULL`.
- `COUNT(columna)`: Cuenta únicamente las filas donde `columna IS NOT NULL`.
- `COUNT(DISTINCT columna)`: Cuenta cuántos valores únicos no nulos existen.
- `SUM(columna)` y `AVG(columna)`: Suman o promedian valores numéricos,
  ignorando silenciosamente los `NULL`. Si todas las filas son `NULL` (o no hay
  filas), devuelven `NULL` (no `0`).
- `MIN(columna)` y `MAX(columna)`: Devuelven el valor mínimo o máximo (funcionan
  con números, textos y fechas ISO-8601), ignorando `NULL`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Cuadros de Mando (Dashboards): Calcular ingresos totales del mes (`SUM`),
    ticket promedio de compra (`AVG`), total de órdenes (`COUNT`) y pedido más
    grande (`MAX`).
  - Auditoría de Calidad de Datos: Comparar `COUNT(*)` contra `COUNT(correo)` y
    `COUNT(telefono)` para medir el porcentaje de completitud de datos de clientes.
  - Control de Inventario y Nómina: Conocer el capital total inmovilizado en
    bodega (`SUM(precio * existencias)`) o la masa salarial mensual (`SUM(salario)`).

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Resumen ejecutivo en una sola fila con múltiples funciones de agregación
SELECT
    COUNT(*)                        AS total_productos,
    SUM(existencias)                AS unidades_totales,
    ROUND(AVG(precio), 2)           AS precio_promedio,
    MIN(precio)                     AS precio_minimo,
    MAX(precio)                     AS precio_maximo
FROM productos;

-- B) Diferencia crítica entre COUNT(*), COUNT(columna) y COUNT(DISTINCT columna)
SELECT
    COUNT(*)                AS total_clientes,
    COUNT(correo)           AS clientes_con_correo,
    COUNT(DISTINCT ciudad)  AS ciudades_distintas
FROM clientes;

-- C) Agregación segura cuando la tabla o filtro puede no devolver filas
SELECT COALESCE(SUM(total), 0.0) AS ingresos_pagados
FROM pedidos
WHERE estado = 'pagado';

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: Finanzas solicita un reporte consolidado de inventario que
muestre cuántos productos activos hay en catálogo, cuántas unidades físicas
existen en bodega, el valor monetario total del inventario y el precio promedio.
*/
-- SELECT
--     COUNT(*)                              AS productos_activos,
--     COALESCE(SUM(existencias), 0)         AS unidades_en_bodega,
--     ROUND(COALESCE(SUM(precio * existencias), 0), 2) AS valor_total_inventario,
--     ROUND(AVG(precio), 2)                 AS precio_promedio_catalogo,
--     MIN(precio)                           AS producto_mas_barato,
--     MAX(precio)                           AS producto_mas_caro
-- FROM productos
-- WHERE activo = 1;
/*
Resultado esperado:
+-------------------+--------------------+------------------------+--------------------------+---------------------+-------------------+
| productos_activos | unidades_en_bodega | valor_total_inventario | precio_promedio_catalogo | producto_mas_barato | producto_mas_caro |
+-------------------+--------------------+------------------------+--------------------------+---------------------+-------------------+
| 3                 | 128                | 359.0                  | 7.92                     | 1.25                | 18.0              |
+-------------------+--------------------+------------------------+--------------------------+---------------------+-------------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - GOTCHA DE `SUM()` Y `AVG()` SOBRE CONJUNTOS VACÍOS: Si haces
    `SELECT SUM(total) FROM pedidos WHERE fecha = '2099-01-01'`, el resultado NO
    es `0`, sino `NULL` (porque no hay filas que sumar). En reportes y APIs,
    envuelve siempre `SUM` con `COALESCE(SUM(columna), 0)` para evitar enviar
    `null` al frontend.
  - GOTCHA DE `AVG()` CON VALORES `NULL`: `AVG(columna)` divide la suma entre la
    cantidad de filas NO NULAS (`SUM(col) / COUNT(col)`). Si quieres que los
    `NULL` cuenten como `0` en el promedio, debes usar `AVG(COALESCE(col, 0))`.
  - NO MEZCLES COLUMNAS SIMPLES CON AGREGACIONES SIN `GROUP BY`: Escribir
    `SELECT nombre, MAX(precio) FROM productos` es un antipatrón (deprecado o
    error en motores estrictos como PostgreSQL/SQL Server). En SQLite devuelve
    la fila correspondiente al máximo, pero es mejor ser explícito o usar
    subconsultas / `ORDER BY ... LIMIT 1`.

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Cuenta cuántos productos existen en total en la tabla `productos` y cuántos
   clientes hay registrados en la tabla `clientes`.
2. Calcula la suma total de `existencias` en `productos` y la suma total de la
   columna `total` en la tabla `pedidos`.
3. Obtén el precio mínimo (`MIN`), el precio máximo (`MAX`) y el precio promedio
   redondeado a 2 decimales (`ROUND(AVG(precio), 2)`) de la tabla `productos`.

[Intermedio]
4. En una sola consulta sobre `clientes`, muestra tres columnas: `total_clientes`
   (`COUNT(*)`), `con_correo` (`COUNT(correo)`) y `con_telefono` (`COUNT(telefono)`),
   demostrando cómo `COUNT(columna)` ignora los `NULL`.
5. Cuenta cuántas ciudades distintas tienen presencia en la tabla `clientes` y
   cuántas categorías distintas están asignadas en `productos` usando `COUNT(DISTINCT ...)`.
6. Calcula el promedio (`AVG`), la nota mínima (`MIN`) y la nota máxima (`MAX`)
   de la tabla `resultados`, redondeando el promedio a 2 decimales.
7. Calcula el costo mensual total de la nómina (`SUM(salario)`), el salario
   promedio (`AVG(salario)`) y la fecha de contratación más antigua (`MIN(fecha_contratacion)`)
   en la tabla `empleados`.

[Senior / Producción]
8. Calcula el valor monetario total de los pedidos con `estado = 'pagado'` y
   demuestra el uso de `COALESCE(SUM(total), 0)` consultando un estado o fecha
   inexistente para garantizar que devuelva `0` en vez de `NULL`.
9. Agregación Condicional (Pivot en una fila con `CASE` dentro de `COUNT`/`SUM`):
   En una sola consulta sobre `pedidos`, calcula simultáneamente:
   - `total_ordenes` (`COUNT(*)`)
   - `ordenes_pagadas` (`SUM(CASE WHEN estado = 'pagado' THEN 1 ELSE 0 END)`)
   - `ingresos_efectivos` (`SUM(CASE WHEN estado = 'pagado' THEN total ELSE 0 END)`)
   - `monto_cancelado` (`SUM(CASE WHEN estado = 'cancelado' THEN total ELSE 0 END)`)
10. Métrica de calidad de datos (Porcentaje de completitud): Escribe una consulta
    sobre `clientes` que calcule el porcentaje de clientes que tienen tanto
    `correo` como `telefono` diligenciados (usa `100.0 * COUNT(...) / COUNT(*)`
    y redondea a 2 decimales).
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
