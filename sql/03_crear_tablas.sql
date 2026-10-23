/*
TEMA 03: CREATE TABLE Y ESTRUCTURA

CREATE TABLE define una tabla y sus columnas. Una columna tiene nombre, tipo
y restricciones. Usa identificadores claros, singular o plural de manera
consistente y evita palabras reservadas. SQLite permite IF NOT EXISTS. La
estructura debe representar una sola entidad y tener una clave primaria.

Sintaxis:
CREATE TABLE IF NOT EXISTS autores (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    pais TEXT
);
PRAGMA table_info(autores);

EJERCICIOS:
1. Crea tabla estudiantes con id, nombre y correo.
2. Crea tabla cursos con id, titulo y duracion.
3. Crea tabla productos con nombre, precio y existencias.
4. Crea tabla clientes con datos de contacto.
5. Crea tabla pedidos con fecha e identificador.
6. Inspecciona columnas de una tabla con PRAGMA table_info.
7. Usa nombres descriptivos para una tabla de empleados.
8. Decide que columna debe ser clave primaria y explica por que.
9. Crea tabla de libros con titulo, autor y anio de publicacion.
10. Crea dos tablas relacionadas para autores y libros.
*/
