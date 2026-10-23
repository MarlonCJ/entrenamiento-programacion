# Introduccion a SQL

## Que es SQL

SQL (Structured Query Language) es el lenguaje usado para definir estructuras de bases de datos relacionales y consultar o modificar sus datos. Es declarativo: describes que resultado necesitas y el motor de base de datos decide como obtenerlo.

SQL es un estandar con diferencias entre motores. Esta ruta practica **SQLite**, una base de datos ligera guardada en archivos, para que puedas aprender sin configurar un servidor. Conceptos como variables de procedimientos, bloques `try/catch` y algunos tipos varian por motor y no pertenecen al SQL basico portable.

## Para que se utiliza

- Crear bases de datos, tablas y restricciones.
- Consultar, filtrar, ordenar y resumir informacion.
- Relacionar datos de varias tablas.
- Insertar, actualizar y eliminar registros.
- Controlar transacciones y mejorar consultas.

## Herramientas

1. **SQLite**: motor de base de datos que almacena datos en un archivo.
2. **DB Browser for SQLite**: interfaz grafica gratuita con editor SQL.
3. **Visual Studio Code** (opcional): editor de archivos `.sql`.
4. **SQLite CLI** (opcional): permite ejecutar consultas desde terminal.

## Ejemplo

```sql
CREATE TABLE estudiantes (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL
);

SELECT nombre
FROM estudiantes
WHERE id = 1;
```

## Siguiente paso

Sigue la [guia para instalar SQLite y preparar VS Code](./INSTALACION.md). Luego crea una base de datos de practica y resuelve los temas en orden.
