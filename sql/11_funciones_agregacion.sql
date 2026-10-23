/*
TEMA 11: FUNCIONES DE AGREGACION

COUNT cuenta filas o valores no NULL; SUM suma; AVG calcula media; MIN y MAX
encuentran extremos. Sin GROUP BY, la agregacion resume todo el conjunto.
Las agregaciones generalmente ignoran NULL, excepto COUNT(*), que cuenta filas.
Usa alias para nombrar resultados.

Sintaxis:
SELECT COUNT(*) AS total,
       AVG(precio) AS precio_promedio,
       MIN(precio) AS menor
FROM productos;

EJERCICIOS:
1. Cuenta estudiantes registrados.
2. Suma existencias de todos los productos.
3. Calcula precio promedio.
4. Encuentra el pedido mas antiguo y el mas reciente.
5. Cuenta clientes con correo no NULL.
6. Calcula total de ventas.
7. Cuenta productos cuyo stock es cero.
8. Calcula promedio de notas ignorando NULL.
9. Compara COUNT(*) con COUNT(columna).
10. Resume cantidad, minimo, maximo y promedio de precios en una consulta.
*/
