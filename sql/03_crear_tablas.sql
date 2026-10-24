/*
================================================================================
TEMA 03: CREATE TABLE Y DISEÑO ESTRUCTURAL DE TABLAS (DDL)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
`CREATE TABLE` es la sentencia del lenguaje de definición de datos (DDL - Data
Definition Language) que materializa una entidad en la base de datos.

Un desarrollador excelente entiende que crear una tabla es firmar un CONTRATO DE
DATOS a largo plazo. Cambiar el código de una función en el backend toma minutos;
migrar una tabla mal diseñada con 50 millones de filas en producción sin tiempo
de inactividad (Zero-Downtime Migration) es una de las tareas más complejas de la
ingeniería de software.

Principios del contrato de una tabla:
  - Cohesión: Todas las columnas deben describir atributos directos de la entidad
    identificada por la clave primaria.
  - Convención de nombres consistente: Usa `snake_case` en minúsculas, sin tildes,
    sin espacios ni caracteres especiales (`fecha_contratacion`, `precio_unitario`).
  - Idempotencia en scripts: `CREATE TABLE IF NOT EXISTS` evita errores fatales
    cuando un script de inicialización se ejecuta más de una vez.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Migraciones de base de datos (Schema Migrations): Al lanzar una nueva
    funcionalidad (ej. sistema de cupones, historial de auditoría o carrito de
    compras).
  - Tablas temporales (`CREATE TEMP TABLE`): Para almacenar resultados intermedios
    durante un proceso complejo de reportes o ETL que se destruyen automáticamente
    al cerrar la conexión.
  - Inspección y Auditoría de Esquema: Usar `PRAGMA table_info(nombre_tabla)` en
    SQLite para descubrir columnas, tipos, nulabilidad y claves primarias antes
    de escribir consultas.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Creación estándar de una tabla bien estructurada
CREATE TABLE IF NOT EXISTS cupones_descuento (
    id INTEGER PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    porcentaje_descuento REAL NOT NULL,
    usos_disponibles INTEGER NOT NULL DEFAULT 1,
    fecha_expiracion TEXT NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1
);

-- B) Inspeccionar la estructura física de una tabla (Metadatos en SQLite)
PRAGMA table_info(productos);

-- C) Ver la sentencia SQL exacta con la que fue creada una tabla
SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'productos';

-- D) Modificar o eliminar estructura (con extrema precaución)
ALTER TABLE cupones_descuento ADD COLUMN descripcion TEXT;
DROP TABLE IF EXISTS cupones_descuento;

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: Antes de escribir consultas sobre `empleados` y `pedidos`,
necesitamos radiografiar su estructura exacta usando `PRAGMA table_info()`.
*/
-- PRAGMA table_info(empleados);
/*
Resultado esperado:
+-----+--------------------+---------+---------+------------+----+
| cid | name               | type    | notnull | dflt_value | pk |
+-----+--------------------+---------+---------+------------+----+
| 0   | id                 | INTEGER | 0       | NULL       | 1  |
| 1   | nombre             | TEXT    | 1       | NULL       | 0  |
| 2   | departamento_id    | INTEGER | 0       | NULL       | 0  |
| 3   | salario            | REAL    | 1       | NULL       | 0  |
| 4   | fecha_contratacion | TEXT    | 1       | NULL       | 0  |
+-----+--------------------+---------+---------+------------+----+
Cómo leer este resultado como un profesional:
- `cid`: Índice de la columna (0 a N).
- `name` y `type`: Nombre del campo y su tipo declarado.
- `notnull`: `1` significa que exige valor (`NOT NULL`); `0` permite `NULL`
  (nota: en SQLite `INTEGER PRIMARY KEY` muestra `notnull = 0` por estándar histórico,
  pero jamás acepta `NULL` y autogenera el entero si se omite).
- `dflt_value`: Valor por defecto (`DEFAULT`) si no se envía en el `INSERT`.
- `pk`: `1` (o mayor en claves compuestas) indica que forma parte de la `PRIMARY KEY`.

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - EVITA PALABRAS RESERVADAS: Nunca llames a una tabla o columna `order`, `group`,
    `select`, `table`, `user` o `index`. Si te obligan a lidiar con ellas, tendrías
    que escaparlas con comillas dobles `"order"`, lo cual es propenso a bugs. Prefiere
    `pedidos`, `grupos`, `usuarios`.
  - EVITA `AUTOINCREMENT` INNECESARIO EN SQLITE: En SQLite, declarar simplemente
    `id INTEGER PRIMARY KEY` ya es un alias del `ROWID` ultrarrápido de 64 bits que
    se autoincrementa solo. Agregar la palabra `AUTOINCREMENT` añade sobrecarga de
    CPU y lecturas internas a la tabla `sqlite_sequence`. Úsalo solo si necesitas
    garantizar estrictamente que jamás se reutilice un ID borrado.
  - NO MODIFIQUES LAS TABLAS SEMILLA DE PRÁCTICA: Cuando practiques `CREATE TABLE`
    o `DROP TABLE`, usa nombres con prefijo (ej. `lab_autores`, `lab_libros`) o
    tablas temporales (`CREATE TEMP TABLE ...`) para no destruir `productos` ni
    `clientes`.

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Ejecuta `PRAGMA table_info(productos);` e identifica en un comentario cuáles
   columnas tienen valor por defecto (`dflt_value`) y cuáles permiten `NULL`.
2. Ejecuta `PRAGMA table_info(detalle_pedido);` y observa los valores de la
   columna `pk`. ¿Por qué aparecen los números `1` y `2`?
3. Crea una tabla temporal `CREATE TEMP TABLE lab_proveedores` con columnas:
   `id` (PK entera), `empresa` (texto obligatorio), `telefono` (texto opcional)
   y `ciudad` (texto con valor por defecto `'Bogota'`).

[Intermedio]
4. Consulta `sqlite_master` (`SELECT name, sql FROM sqlite_master WHERE type='table';`)
   para obtener el código DDL original de todas las tablas de `00_base_practica.sql`.
5. Crea una tabla temporal `lab_envios` que se relacione con `pedidos(id)` e incluya:
   `id`, `pedido_id`, `transportadora`, `guia_rastreo`, `fecha_despacho` y `costo_envio`.
6. Usa `ALTER TABLE lab_proveedores ADD COLUMN correo_contacto TEXT;` sobre la tabla
   del ejercicio 3 y verifica con `PRAGMA table_info(lab_proveedores);` que la nueva
   columna fue añadida al final.
7. Diseña dos tablas temporales relacionadas: `lab_autores (id, nombre, pais)` y
   `lab_libros (id, titulo, anio_publicacion, autor_id)` asegurando que cada libro
   referencie a su autor.

[Senior / Producción]
8. Audita mediante una consulta a `sqlite_master` o `PRAGMA` qué tablas de la base de
   práctica tienen claves primarias compuestas vs claves primarias simples.
9. Crea una tabla temporal `lab_auditoria_precios` pensada para producción que registre
   cambios de precios en `productos`: debe guardar `id`, `producto_id`, `precio_anterior`,
   `precio_nuevo`, `usuario_responsable` y `fecha_cambio` con valor por defecto
   automático `DEFAULT CURRENT_TIMESTAMP`.
10. Explica y demuestra con un ejemplo en tabla temporal qué sucede en SQLite cuando
    creas una tabla con `WITHOUT ROWID` en una tabla puente de clave primaria compuesta
    (cuándo mejora el rendimiento y cuándo no debe usarse).
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
