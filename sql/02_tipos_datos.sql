/*
TEMA 02: TIPOS DE DATOS EN SQLITE

SQLite usa afinidad de tipo: INTEGER, REAL, TEXT, BLOB y NULL describen las
clases principales de valores. A diferencia de motores estrictamente tipados,
SQLite permite conversiones segun afinidad. Para fechas se suele guardar texto
ISO-8601 o valores numericos. Define el tipo apropiado y valida reglas de
dominio; no confundas el texto '12' con una cantidad cuidadosamente validada.

Sintaxis:
CREATE TABLE mediciones (
    nombre TEXT,
    cantidad INTEGER,
    precio REAL,
    evidencia BLOB,
    observacion TEXT
);
SELECT typeof(12), typeof(12.5), typeof('hola'), typeof(NULL);

EJERCICIOS:
1. Elige tipos para nombre, edad, precio y fecha de un cliente.
2. Diseña columnas para un producto y justifica cada tipo.
3. Guarda una fecha de pedido como texto ISO-8601.
4. Compara typeof de un entero, decimal, texto y NULL.
5. Explica por que una cantidad no deberia guardarse como frase.
6. Elige tipo para un codigo postal y explica si debe ser numerico.
7. Define columnas para titulo, duracion en minutos y fecha de pelicula.
8. Identifica valores que pueden ser NULL en una tabla de empleados.
9. Propone como guardar una cantidad monetaria y que precision validar.
10. Crea una tabla con al menos cuatro afinidades de datos diferentes.
*/
