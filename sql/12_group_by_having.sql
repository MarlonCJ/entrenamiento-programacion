/*
================================================================================
TEMA 12: AGRUPACIONES Y FILTRADO DE GRUPOS (GROUP BY vs HAVING vs WHERE)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Mientras que las funciones de agregación por sí solas colapsan toda una tabla en
una única fila, `GROUP BY` divide las filas en cubetas o grupos lógicos (por
ejemplo, por categoría, por ciudad o por estado de pedido) y calcula las
agregaciones (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) de manera independiente para
cada grupo.

Modelo mental del pipeline de ejecución en el motor SQL:
1. `FROM` / `JOIN`: Se identifican y conectan las tablas origen.
2. `WHERE`: Se filtran las FILAS INDIVIDUALES antes de agrupar. Las filas que no
   cumplen el `WHERE` se descartan temprano (ahorrando memoria y CPU).
3. `GROUP BY`: Las filas sobrevivientes se particionan en grupos según los
   valores únicos de las columnas indicadas.
4. Funciones de Agregación: Se calculan `COUNT`, `SUM`, `AVG`, etc., por cada grupo.
5. `HAVING`: Se filtran los GRUPOS ya formados según el resultado de sus
   funciones de agregación (ej. `HAVING COUNT(*) >= 2`).
6. `SELECT` -> `ORDER BY` -> `LIMIT`: Se proyectan y ordenan los grupos finales.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Reportes de Ventas por Segmento: Ventas totales por mes, por estado de
    pedido o por cliente (`GROUP BY cliente_id`).
  - Detección de Anomalías y Duplicados: Encontrar correos repetidos o clientes
    con múltiples pedidos el mismo día (`GROUP BY correo HAVING COUNT(*) > 1`).
  - Segmentación VIP: Identificar clientes cuya facturación acumulada supere
    cierto umbral (`GROUP BY cliente_id HAVING SUM(total) > 1000`).

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Agrupación básica con conteo y suma por grupo
SELECT
    estado,
    COUNT(*)   AS cantidad_pedidos,
    SUM(total) AS monto_total
FROM pedidos
GROUP BY estado;

-- B) Combinación profesional de WHERE (filtra filas) + GROUP BY + HAVING (filtra grupos)
SELECT
    categoria_id,
    COUNT(*)              AS total_productos,
    SUM(existencias)      AS stock_categoria,
    ROUND(AVG(precio), 2) AS precio_promedio
FROM productos
WHERE activo = 1                  -- 1. Filtra filas individuales antes de agrupar
GROUP BY categoria_id             -- 2. Forma los grupos por categoría
HAVING SUM(existencias) >= 10     -- 3. Filtra los grupos cuyo stock total sea >= 10
ORDER BY stock_categoria DESC;    -- 4. Ordena el reporte final

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: Recursos Humanos necesita un informe por departamento que
muestre cuántos empleados tiene cada área, su salario promedio y el gasto
salarial total del departamento, mostrando únicamente los departamentos cuya
nómina total supere los 3,000.
*/
-- SELECT
--     departamento_id,
--     COUNT(*)               AS total_empleados,
--     ROUND(AVG(salario), 2) AS salario_promedio,
--     MIN(salario)           AS salario_minimo,
--     MAX(salario)           AS salario_maximo,
--     SUM(salario)           AS masa_salarial
-- FROM empleados
-- GROUP BY departamento_id
-- HAVING SUM(salario) > 3000
-- ORDER BY masa_salarial DESC;
/*
Resultado esperado:
+-----------------+-----------------+------------------+----------------+----------------+---------------+
| departamento_id | total_empleados | salario_promedio | salario_minimo | salario_maximo | masa_salarial |
+-----------------+-----------------+------------------+----------------+----------------+---------------+
| 1               | 2               | 3350.0           | 3200.0         | 3500.0         | 6700.0        |
+-----------------+-----------------+------------------+----------------+----------------+---------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - REGLA DE ORO DEL `SELECT` CON `GROUP BY`: Toda columna que aparezca en el
    `SELECT` y NO esté dentro de una función de agregación (`SUM`, `COUNT`, etc.)
    DEBE estar listada en el `GROUP BY`. De lo contrario, la consulta fallará en
    motores estándar o devolverá valores arbitrarios.
  - NUNCA USES `HAVING` PARA FILTRAR COLUMNAS NO AGREGADAS: Si solo quieres
    agrupar productos activos (`activo = 1`), pon `WHERE activo = 1` ANTES del
    `GROUP BY`, no `HAVING activo = 1`. Filtrar en `WHERE` evita que el motor
    agrupe filas innecesarias y permite aprovechar índices.
  - CÓMO AGRUPA SQL LOS VALORES `NULL`: A diferencia de `=`, donde `NULL = NULL`
    es `UNKNOWN`, `GROUP BY` considera todos los `NULL` como un único grupo
    (por ejemplo, una fila para la ciudad `NULL`).

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Agrupa la tabla `productos` por `categoria_id` y muestra cuántos productos
   hay en cada categoría (`COUNT(*)`).
2. Agrupa la tabla `clientes` por `ciudad` y muestra cuántos clientes pertenecen
   a cada ciudad, ordenando de mayor a menor cantidad.
3. Agrupa la tabla `pedidos` por `estado` y muestra la cantidad de pedidos y la
   suma de `total` para cada estado.

[Intermedio]
4. Para cada `categoria_id` en `productos`, calcula la cantidad de productos, el
   total de unidades en inventario (`SUM(existencias)`) y el precio promedio
   redondeado a 2 decimales.
5. Agrupa la tabla `empleados` por `departamento_id` y muestra el número de
   empleados y el salario promedio por departamento.
6. En la tabla `resultados`, calcula la nota promedio (`AVG(nota)`), nota mínima
   y nota máxima por cada `curso_id`, y en otra consulta calcula el promedio por
   cada `estudiante_id`.
7. Usa `HAVING` para mostrar únicamente las ciudades de la tabla `clientes` que
   tengan al menos 2 clientes registrados (`HAVING COUNT(*) >= 2`).

[Senior / Producción]
8. Combina `WHERE`, `GROUP BY`, `HAVING` y `ORDER BY`: Sobre la tabla `productos`,
   filtra solo los productos activos (`WHERE activo = 1`), agrúpalos por
   `categoria_id`, conserva únicamente las categorías cuyo valor de inventario
   (`SUM(precio * existencias)`) supere `50`, y ordénalas de mayor a menor valor.
9. Análisis de líneas de pedido (`detalle_pedido`): Agrupa por `pedido_id` para
   calcular cuántos ítems distintos tiene cada pedido (`COUNT(*)`), el total de
   unidades compradas (`SUM(cantidad)`) y el subtotal calculado desde el detalle
   (`ROUND(SUM(cantidad * precio_unitario), 2)`).
10. Agrupación por expresiones derivadas (Cohortes por año de contratación):
    Extrae el año de `fecha_contratacion` en `empleados` usando `SUBSTR(fecha_contratacion, 1, 4)`
    como `anio_ingreso`, agrupa por dicho año y muestra cuántos empleados
    ingresaron y su salario promedio.
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
