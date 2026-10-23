/*
TEMA 17: CTE CON WITH

Una expresion de tabla comun (CTE) se declara con WITH y se consulta como
una tabla temporal dentro de una sola sentencia. Mejora legibilidad y permite
separar una consulta en pasos nombrados. RECURSIVE permite recorridos
jerarquicos en motores compatibles; SQLite lo soporta.

Sintaxis:
WITH ventas AS (
    SELECT cliente_id, SUM(total) AS total_cliente
    FROM pedidos GROUP BY cliente_id
)
SELECT cliente_id, total_cliente
FROM ventas WHERE total_cliente > 100;

EJERCICIOS:
1. Calcula ventas por cliente en una CTE y filtra las altas.
2. Separa promedio de notas y seleccion de aprobados en dos pasos.
3. Crea CTE para productos con stock bajo.
4. Usa dos CTE para combinar ventas y clientes.
5. Reemplaza una subconsulta anidada por una CTE.
6. Crea una CTE para pedidos de un rango de fechas.
7. Usa CTE recursiva para contar del 1 al 10 en SQLite.
8. Recorre una jerarquia simple de categorias con CTE recursiva.
9. Nombra claramente cada paso de una consulta de reporte.
10. Compara legibilidad de CTE con subconsulta equivalente.
*/
