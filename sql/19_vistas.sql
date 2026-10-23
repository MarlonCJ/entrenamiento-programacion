/*
TEMA 19: VISTAS

Una vista es una consulta guardada que se puede consultar como tabla.
CREATE VIEW define la vista y DROP VIEW la elimina. Una vista normal no
almacena una copia independiente de resultados: consulta las tablas
subyacentes. Puede simplificar reportes y limitar las columnas expuestas.

Sintaxis:
CREATE VIEW resumen_productos AS
SELECT nombre, precio FROM productos WHERE activo = 1;
SELECT * FROM resumen_productos;

EJERCICIOS:
1. Crea vista de productos disponibles.
2. Crea vista que combine pedidos y clientes.
3. Consulta una vista con una condicion adicional.
4. Crea vista de resumen de ventas por cliente.
5. Elimina una vista de practica con DROP VIEW IF EXISTS.
6. Explica que ocurre al cambiar una fila de tabla base.
7. Crea vista que exponga solo nombre y correo de clientes.
8. Usa una vista para simplificar un reporte repetido.
9. Compara consulta directa y consulta mediante vista.
10. Documenta columnas y proposito de una vista.
*/
