/*
TEMA 13: INSERTAR DATOS CON INSERT

INSERT INTO agrega filas. Nombra explicitamente las columnas para que el orden
sea claro y no dependa de todos los campos de la tabla. VALUES inserta una
fila; se pueden incluir varias filas. Si una restriccion falla, el motor puede
rechazar la insercion. Usa datos de prueba y no repitas identificadores unicos.

Sintaxis:
INSERT INTO productos (nombre, precio, existencias)
VALUES ('Cuaderno', 4.50, 20);
INSERT INTO productos (nombre, precio, existencias)
VALUES ('Lapiz', 1.25, 100), ('Regla', 2.00, 30);

EJERCICIOS:
1. Inserta un estudiante indicando columnas.
2. Inserta tres cursos en una sentencia.
3. Inserta producto omitiendo columna que tiene DEFAULT.
4. Inserta cliente con un campo opcional NULL.
5. Inserta un pedido relacionado con un cliente existente.
6. Prueba la insercion de correo duplicado y observa UNIQUE.
7. Inserta filas de detalle para dos pedidos.
8. Corrige una fila que incumple una restriccion antes de insertarla.
9. Inserta varias categorias de producto.
10. Crea datos de prueba para una pequena tienda con tablas relacionadas.
*/
