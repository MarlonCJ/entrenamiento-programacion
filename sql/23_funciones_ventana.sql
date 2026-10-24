/*
================================================================================
TEMA 23: FUNCIONES DE VENTANA (OVER, PARTITION BY, RANKINGS, LAG/LEAD Y FRAMES)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Las Funciones de Ventana (*Window Functions*, introducidas en SQLite 3.25+) son
una de las herramientas más potentes del SQL moderno para análisis de datos.

Modelo mental (`GROUP BY` vs `OVER`):
- `GROUP BY` **colapsa** las filas: si tienes 10 empleados en 2 departamentos,
  `GROUP BY departamento_id` destruye el detalle individual y te devuelve solo
  2 filas resumidas.
- Una Función de Ventana con `OVER (...)` **conserva todas las filas originales**
  y, para cada fila, abre una "ventana deslizante" sobre un conjunto de filas
  relacionadas para calcular rankings, acumulados, promedios móviles o comparar
  la fila actual con la fila anterior/siguiente.

Componentes de la cláusula `OVER`:
1. `PARTITION BY`: divide las filas en grupos independientes (como un `GROUP BY`
   pero sin colapsar las filas). La función se reinicia en cada partición.
2. `ORDER BY`: define el orden dentro de cada partición (esencial para rankings,
   `LAG`, `LEAD` y sumas acumuladas).
3. *Window Frame* (`ROWS BETWEEN ...`): define el subconjunto exacto de filas
   dentro de la partición respecto a la fila actual.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
- **Top-N por categoría**: obtener los 2 productos más caros de cada categoría,
  el último pedido de cada cliente o el mejor estudiante de cada curso.
- **Comparaciones periodo a periodo (MoM / YoY)**: usar `LAG()` para traer las
  ventas del mes anterior a la fila del mes actual y calcular el porcentaje de
  crecimiento en una sola pasada.
- **Totales acumulados (Running Totals) y Promedios Móviles**: calcular cómo
  evoluciona el flujo de caja día a día o el promedio móvil de los últimos 3
  pedidos.
- **Deduplicación de registros**: numerar duplicados con `ROW_NUMBER() OVER (PARTITION BY correo ORDER BY id)`
  y quedarse solo con la fila donde `rn = 1`.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Funciones de Ranking (Diferencia ante empates):
SELECT
    estudiante_id,
    curso_id,
    nota,
    ROW_NUMBER() OVER (PARTITION BY curso_id ORDER BY nota DESC) AS fila_unica, -- 1, 2, 3, 4
    RANK()       OVER (PARTITION BY curso_id ORDER BY nota DESC) AS rango_salto, -- 1, 2, 2, 4
    DENSE_RANK() OVER (PARTITION BY curso_id ORDER BY nota DESC) AS rango_denso  -- 1, 2, 2, 3
FROM resultados;

-- B) Funciones de Desplazamiento (Navegar a filas vecinas con LAG y LEAD):
SELECT
    id,
    cliente_id,
    fecha,
    total,
    LAG(total, 1, 0.0)  OVER (PARTITION BY cliente_id ORDER BY fecha) AS pedido_anterior,
    LEAD(total, 1, 0.0) OVER (PARTITION BY cliente_id ORDER BY fecha) AS pedido_siguiente
FROM pedidos;

-- C) Agregaciones de Ventana y Marcos Deslizantes (Running Total & Moving Average):
SELECT
    id,
    fecha,
    total,
    SUM(total) OVER (ORDER BY fecha, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS acumulado,
    AVG(total) OVER (ORDER BY fecha, id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS media_movil_3
FROM pedidos;

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con resultado esperado)
--------------------------------------------------------------------------------
Escenario: Finanzas quiere analizar los salarios por departamento mostrando para
cada empleado: su puesto salarial dentro de su departamento, el salario promedio
de su departamento, cuánto representa su sueldo del presupuesto total de su
departamento (%) y la diferencia respecto al empleado que le sigue en sueldo.

Consulta paso a paso:
SELECT
    d.nombre AS departamento,
    e.nombre AS empleado,
    e.salario,
    RANK() OVER (
        PARTITION BY e.departamento_id
        ORDER BY e.salario DESC
    ) AS ranking_depto,
    ROUND(AVG(e.salario) OVER (PARTITION BY e.departamento_id), 2) AS media_depto,
    ROUND(
        (e.salario * 100.0) / SUM(e.salario) OVER (PARTITION BY e.departamento_id),
        2
    ) AS pct_presupuesto_depto,
    LAG(e.salario, 1, e.salario) OVER (
        PARTITION BY e.departamento_id
        ORDER BY e.salario DESC
    ) - e.salario AS brecha_vs_superior
FROM empleados e
INNER JOIN departamentos d ON d.id = e.departamento_id
ORDER BY d.nombre, ranking_depto;

Resultado esperado:
+--------------+----------+---------+---------------+-------------+-----------------------+--------------------+
| departamento | empleado | salario | ranking_depto | media_depto | pct_presupuesto_depto | brecha_vs_superior |
+--------------+----------+---------+---------------+-------------+-----------------------+--------------------+
| Tecnologia   | Nora     | 3500.0  | 1             | 3350.0      | 52.24                 | 0.0                |
| Tecnologia   | Rosa     | 3200.0  | 2             | 3350.0      | 47.76                 | 300.0              |
| Ventas       | Pablo    | 2800.0  | 1             | 2800.0      | 100.0                 | 0.0                |
+--------------+----------+---------+---------------+-------------+-----------------------+--------------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
- NO PUEDES USAR FUNCIONES DE VENTANA EN EL `WHERE`:
  En el orden lógico de evaluación de SQL (`FROM` -> `WHERE` -> `GROUP BY` ->
  `HAVING` -> **Ventanas en `SELECT`** -> `ORDER BY`), el `WHERE` se ejecuta
  *antes* de calcular las funciones de ventana.
  Por eso `WHERE ROW_NUMBER() OVER (...) = 1` da error de sintaxis.
  Solución: calcula la función de ventana dentro de una **CTE** y filtra
  `WHERE rn = 1` en la consulta externa.
- ¡CUIDADO CON EL MARCO POR DEFECTO (`RANGE`) AL USAR `ORDER BY` EN `SUM() OVER`!:
  Si escribes `SUM(total) OVER (ORDER BY fecha)` y hay dos pedidos en la misma
  `fecha`, el marco por defecto es `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`,
  que suma juntos los empates en la misma fecha. Para un acumulado estricto
  fila a fila, añade un desempate único (`ORDER BY fecha, id`) o especifica
  explícitamente `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.
- `LAST_VALUE()` y el marco por defecto:
  `LAST_VALUE(col) OVER (ORDER BY fecha)` devuelve el valor de la **fila actual**
  porque el marco por defecto termina en `CURRENT ROW`. Para ver el último valor
  de toda la partición debes usar `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`
  (o simplemente usar `FIRST_VALUE` invirtiendo el `ORDER BY DESC`).

6. EJERCICIOS PROGRESIVOS (10 Retos: [Básico] 1-3, [Intermedio] 4-7, [Senior / Producción] 8-10)
--------------------------------------------------------------------------------
[Básico]
1. Numeración secuencial con `ROW_NUMBER`: Lista todos los pedidos de la tabla
   `pedidos` ordenados por `fecha ASC, id ASC`, añadiendo una columna `num_orden`
   calculada con `ROW_NUMBER() OVER (ORDER BY fecha ASC, id ASC)`.
2. Ranking por curso: Sobre la tabla `resultados`, muestra `curso_id`,
   `estudiante_id`, `nota` y el puesto del estudiante dentro de cada curso
   usando `RANK() OVER (PARTITION BY curso_id ORDER BY nota DESC)`.
3. Comparación con el promedio sin colapsar filas: Lista todos los productos de
   `productos` mostrando `nombre`, `categoria_id`, `precio` y el precio promedio
   de su categoría usando `AVG(precio) OVER (PARTITION BY categoria_id)`.

[Intermedio]
4. `ROW_NUMBER` vs `RANK` vs `DENSE_RANK` ante empates: Escribe una consulta
   (puedes usar una CTE con `VALUES (1, 90), (2, 85), (3, 85), (4, 70)` para
   simular notas empatadas) que muestre las tres funciones lado a lado y explica
   en un comentario la diferencia exacta en la fila posterior al empate.
5. Análisis de compra previa con `LAG`: Para cada fila de `pedidos`, muestra
   `cliente_id`, `id` del pedido, `fecha`, `total`, el monto del pedido anterior
   de ese mismo cliente (`LAG(total)`) y la diferencia `total - pedido_anterior`.
6. Siguiente evento con `LEAD`: Muestra para cada empleado en `empleados` su
   `nombre`, `fecha_contratacion` y la fecha en que fue contratado el siguiente
   empleado en toda la empresa (`LEAD(fecha_contratacion) OVER (ORDER BY fecha_contratacion)`).
7. Total acumulado (Running Total): Calcula el ingreso acumulado histórico a lo
   largo del tiempo en la tabla `pedidos` (ordenando por `fecha, id` y usando
   `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`).

[Senior / Producción]
8. Patrón Top-N por grupo con CTE + `ROW_NUMBER`: Encuentra el producto más caro
   de cada categoría en la tabla `productos`. Envuelve `ROW_NUMBER() OVER (PARTITION BY categoria_id ORDER BY precio DESC)`
   en una CTE y filtra `WHERE rn = 1` en la consulta principal.
9. Promedio móvil de 3 periodos (Moving Average) y `NTILE`: Calcula sobre una
   serie de ventas el promedio móvil de la fila actual y las 2 filas previas
   (`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`), y clasifica los productos en
   2 grupos (mitad superior e inferior de precios) usando `NTILE(2) OVER (ORDER BY precio DESC)`.
10. Detección de rachas y retención (Días entre pedidos por cliente): Usando
    `LAG(fecha) OVER (PARTITION BY cliente_id ORDER BY fecha)` y `julianday()`,
    calcula cuántos días transcurrieron entre cada pedido consecutivo de un
    mismo cliente e identifica su primer pedido histórico con `FIRST_VALUE(fecha)`.
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
