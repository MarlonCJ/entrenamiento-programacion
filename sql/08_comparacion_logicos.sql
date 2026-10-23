/*
TEMA 08: OPERADORES DE COMPARACION Y LOGICOS

Las comparaciones incluyen =, !=, <>, <, >, <= y >=. AND exige ambas
condiciones, OR exige al menos una y NOT invierte una condicion. Usa parentesis
para que las condiciones combinadas sean claras, especialmente porque AND
tiene mayor precedencia que OR. SQL trabaja con logica de tres valores cuando
aparece NULL; NULL no se compara con =.

Sintaxis:
SELECT nombre FROM productos
WHERE precio >= 10 AND activo = 1;
SELECT nombre FROM clientes
WHERE ciudad = 'Cali' OR ciudad = 'Bogota';

EJERCICIOS:
1. Filtra productos con precio mayor a un valor.
2. Busca empleados de dos departamentos usando OR.
3. Combina precio minimo y stock positivo con AND.
4. Niega una condicion para excluir una categoria.
5. Usa parentesis en una mezcla de AND y OR.
6. Filtra pedidos que no esten cancelados y superen un monto.
7. Compara fechas de pedidos con un limite.
8. Explica por que columna = NULL no selecciona valores NULL.
9. Usa una comparacion para encontrar notas aprobadas.
10. Diseña una consulta que filtre por dos condiciones alternativas agrupadas.
*/
