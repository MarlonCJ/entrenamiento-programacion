/*
TEMA 09: NULL, IS NULL Y CASE

NULL representa un valor ausente o desconocido; no es cero ni cadena vacia.
Usa IS NULL e IS NOT NULL, nunca = NULL. Las comparaciones con NULL resultan
desconocidas. COALESCE devuelve el primer argumento no NULL. CASE expresa
condiciones dentro de una consulta y devuelve un valor.

Sintaxis:
SELECT nombre, COALESCE(telefono, 'Sin telefono') AS telefono
FROM clientes
WHERE telefono IS NULL;
SELECT CASE WHEN stock = 0 THEN 'Agotado' ELSE 'Disponible' END
FROM productos;

EJERCICIOS:
1. Encuentra clientes sin telefono.
2. Busca productos cuyo campo opcional sea NULL.
3. Sustituye correo NULL por etiqueta usando COALESCE.
4. Clasifica notas como aprobadas o reprobadas con CASE.
5. Clasifica productos por existencia.
6. Cuenta valores conocidos y compara COUNT(columna) con COUNT(*).
7. Usa CASE para descuentos segun categoria.
8. Explica resultado de comparar una columna con NULL usando =.
9. Clasifica pedidos por rango de monto.
10. Presenta un campo opcional con valor sustituto sin alterar la tabla.
*/
