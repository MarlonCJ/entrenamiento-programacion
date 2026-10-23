/*
TEMA 04: RESTRICCIONES Y CLAVES

Las restricciones protegen la consistencia de los datos. PRIMARY KEY identifica
filas; NOT NULL exige un valor; UNIQUE evita duplicados; CHECK impone una
condicion; DEFAULT asigna un valor si se omite. FOREIGN KEY relaciona tablas.
En SQLite activa claves foraneas con PRAGMA foreign_keys = ON por conexion.

Sintaxis:
PRAGMA foreign_keys = ON;
CREATE TABLE productos (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    precio REAL NOT NULL CHECK (precio >= 0),
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

EJERCICIOS:
1. Exige que el nombre de estudiante no sea NULL.
2. Evita correos duplicados con UNIQUE.
3. Impide precios negativos con CHECK.
4. Asigna stock cero como valor DEFAULT.
5. Relaciona pedidos con clientes mediante clave foranea.
6. Impide que una nota salga del rango 0..100.
7. Crea clave primaria compuesta para una tabla de matriculas.
8. Explica diferencia entre NOT NULL y UNIQUE.
9. Prueba que ocurre al insertar un valor que incumple CHECK.
10. Define restricciones para una tabla de cuentas con saldo valido.
*/
