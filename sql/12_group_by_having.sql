/*
TEMA 12: GROUP BY Y HAVING

GROUP BY crea grupos con el mismo valor para calcular agregaciones por grupo.
HAVING filtra grupos despues de agregarlos; WHERE filtra filas antes de agrupar.
En consultas portables, selecciona columnas agrupadas o agregadas. SQLite
permite algunas consultas flexibles, pero evita depender de ese comportamiento.

Sintaxis:
SELECT categoria_id, COUNT(*) AS productos, AVG(precio) AS promedio
FROM productos
GROUP BY categoria_id
HAVING COUNT(*) >= 2;

EJERCICIOS:
1. Cuenta productos por categoria.
2. Calcula venta total por cliente.
3. Calcula nota promedio por curso.
4. Muestra categorias con al menos cinco productos.
5. Encuentra clientes con ventas acumuladas superiores a un limite.
6. Cuenta pedidos por estado.
7. Compara filtro de fila WHERE con filtro de grupo HAVING.
8. Agrupa pedidos por mes usando una fecha de texto ISO.
9. Muestra departamentos con salario promedio por encima del umbral.
10. Agrupa por dos columnas y cuenta combinaciones.
*/
