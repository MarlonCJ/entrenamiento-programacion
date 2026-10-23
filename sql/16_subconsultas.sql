/*
TEMA 16: SUBCONSULTAS

Una subconsulta es un SELECT dentro de otra consulta. Puede producir un valor,
una columna o un conjunto de filas. IN comprueba pertenencia; EXISTS comprueba
si hay al menos una fila relacionada. Una subconsulta correlacionada usa valores
de la consulta externa y se evalua de forma dependiente. Considera JOIN o CTE
cuando expresen mejor la consulta.

Sintaxis:
SELECT nombre FROM productos
WHERE precio > (SELECT AVG(precio) FROM productos);

EJERCICIOS:
1. Encuentra productos por encima del precio promedio.
2. Lista clientes que tienen al menos un pedido usando EXISTS.
3. Encuentra estudiantes cuya nota supera el promedio del curso.
4. Busca productos de categorias elegidas mediante IN.
5. Encuentra clientes sin pedidos con NOT EXISTS.
6. Obtiene el pedido mas costoso usando una subconsulta.
7. Compara una subconsulta escalar con un JOIN.
8. Cuenta pedidos por cliente con subconsulta correlacionada.
9. Encuentra empleados que ganan mas que el promedio general.
10. Reescribe una subconsulta compleja de forma legible.
*/
