/*
TEMA 01: BASES DE DATOS RELACIONALES

Una base relacional organiza informacion en tablas. Cada tabla describe una
entidad; cada fila es un registro y cada columna un atributo. Una clave
primaria identifica cada fila. Una clave foranea relaciona registros de otras
tablas. SQL describe que datos consultar, no un algoritmo paso a paso.

Ejemplo SQLite:
-- Tabla de ejemplo
CREATE TABLE cursos (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL);
INSERT INTO cursos (nombre) VALUES ('Programacion');
SELECT id, nombre FROM cursos;

EJERCICIOS:
1. Describe tablas y columnas para una biblioteca.
2. Propone una tabla para productos con identificador y nombre.
3. Identifica que campos podrian distinguir a cada estudiante.
4. Explica con un ejemplo la diferencia entre fila y columna.
5. Disena tablas para clientes y pedidos.
6. Identifica la relacion entre pedido y cliente.
7. Decide que informacion no conviene repetir en cada pedido.
8. Dibuja tablas para cursos y estudiantes.
9. Explica para que sirve una clave primaria.
10. Escribe una consulta que liste nombres de cursos.
*/
