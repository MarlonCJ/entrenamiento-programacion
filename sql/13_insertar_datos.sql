/*
================================================================================
TEMA 13: INSERCIÓN DE DATOS (INSERT, MULTI-ROW, INSERT...SELECT Y UPSERT)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
`INSERT INTO` es la sentencia DML (Data Manipulation Language) encargada de
registrar nuevas filas en una tabla. Cuando ejecutas un `INSERT`, el motor de
base de datos realiza una serie de pasos críticos de integridad antes de
confirmar el cambio en disco:
1. Verifica tipos y afinidad de columnas.
2. Asigna valores por defecto (`DEFAULT`) a las columnas omitidas.
3. Valida todas las restricciones (`NOT NULL`, `UNIQUE`, `CHECK`, `PRIMARY KEY`
   y `FOREIGN KEY` si `PRAGMA foreign_keys = ON`).
4. Inserta el registro en la estructura B-Tree de la tabla y actualiza todos los
   índices asociados.

Además del `INSERT` simple, en sistemas de producción dominarás tres técnicas
avanzadas:
- Inserción por lotes (*Multi-row INSERT*): Reduce drásticamente el tiempo de
  red y de transacciones al insertar decenas o cientos de filas en una sentencia.
- `INSERT INTO ... SELECT`: Copia o transforma datos de una consulta hacia otra
  tabla sin pasar los datos por la memoria de la aplicación.
- `ON CONFLICT ... DO UPDATE` (*UPSERT*) y `INSERT OR IGNORE`: Manejo declarativo
  e idempotente de colisiones en claves únicas o primarias.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Registro Transaccional: Crear un nuevo cliente, registrar un pedido y sus
    líneas en `detalle_pedido`.
  - Sincronización de Catálogos e Inventarios (*UPSERT*): Si un producto importado
    desde un proveedor ya existe en la base de datos, actualizar su precio y
    sumar sus existencias; si no existe, crearlo automáticamente.
  - Procesos ETL y Tablas de Resumen (`INSERT ... SELECT`): Volcar las ventas
    cerradas del mes en una tabla histórica de auditoría o reporte.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) INSERT explícito (Siempre especifica las columnas, nunca dependas del orden físico)
INSERT INTO categorias (id, nombre)
VALUES (10, 'Hogar');

-- B) Multi-row INSERT (Inserción por lotes en una sola operación atómica)
INSERT INTO productos (id, nombre, precio, existencias, categoria_id, activo, descripcion)
VALUES
    (10, 'Mouse Optico', 12.50, 15, 3, 1, 'Mouse USB ergonomico'),
    (11, 'Agenda Diaria', 8.00, 30, 2, 1, 'Agenda ejecutiva');

-- C) UPSERT moderno (SQLite 3.24+ / PostgreSQL): Inserta o actualiza si hay conflicto
INSERT INTO productos (id, nombre, precio, existencias, categoria_id, activo)
VALUES (10, 'Mouse Optico', 11.99, 5, 3, 1)
ON CONFLICT(nombre) DO UPDATE SET
    precio = excluded.precio,
    existencias = productos.existencias + excluded.existencias;

-- D) INSERT ... RETURNING (SQLite 3.35+ / PostgreSQL): Devuelve la fila insertada
INSERT INTO departamentos (nombre)
VALUES ('Finanzas')
RETURNING id, nombre;

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: El sistema de inventario recibe un lote de reabastecimiento. Si
el producto no existe se crea, y si ya existe (conflicto en `nombre` o `id`), se
actualiza su precio al nuevo valor (`excluded.precio`) y se suman las unidades
recibidas (`excluded.existencias`) al stock actual.
*/
-- BEGIN TRANSACTION;
--
-- INSERT INTO productos (id, nombre, precio, existencias, categoria_id, activo, descripcion)
-- VALUES
--     (1, 'Cuaderno', 4.75, 10, 2, 1, 'Cuaderno de practica actualizado'),
--     (99, 'Regla Metalica', 2.50, 25, 2, 1, 'Regla de 30 cm')
-- ON CONFLICT(id) DO UPDATE SET
--     precio = excluded.precio,
--     existencias = productos.existencias + excluded.existencias,
--     descripcion = excluded.descripcion;
--
-- SELECT id, nombre, precio, existencias FROM productos WHERE id IN (1, 99);
--
-- ROLLBACK; -- Deshacemos para mantener limpia la base de práctica
/*
Resultado esperado antes del ROLLBACK:
+----+----------------+--------+-------------+
| id | nombre         | precio | existencias |
+----+----------------+--------+-------------+
| 1  | Cuaderno       | 4.75   | 30          |
| 99 | Regla Metalica | 2.5    | 25          |
+----+----------------+--------+-------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - NUNCA USES `INSERT INTO tabla VALUES (...)` SIN LISTAR LAS COLUMNAS: Si en
    el futuro alguien ejecuta `ALTER TABLE` y agrega una columna, todos los
    `INSERT` implícitos en tu código se romperán de inmediato.
  - ACTIVA `PRAGMA foreign_keys = ON` EN SQLITE: Por compatibilidad histórica,
    SQLite tiene las claves foráneas desactivadas por defecto al abrir una
    conexión. Actívalas siempre para impedir insertar pedidos con `cliente_id`
    inexistente.
  - PREFIERE `ON CONFLICT DO UPDATE` FRENTE A `INSERT OR REPLACE`: En SQLite,
    `INSERT OR REPLACE` borra físicamente la fila antigua y crea una nueva, lo
    que puede disparar `ON DELETE CASCADE` o cambiar el `id` si el conflicto fue
    por otra columna `UNIQUE`. `ON CONFLICT(...) DO UPDATE` modifica la fila
    existente in-situ de forma segura.

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Inserta una nueva categoría en `categorias` especificando explícitamente sus
   columnas y verifica su creación con un `SELECT`.
2. Inserta un nuevo producto en `productos` omitiendo las columnas `existencias`
   y `activo` para comprobar que el motor asigna sus valores `DEFAULT` (`0` y `1`).
3. Inserta un nuevo cliente en `clientes` que tenga `correo`, pero cuyo
   `telefono` sea `NULL`.

[Intermedio]
4. Inserta 3 nuevos estudiantes en la tabla `estudiantes` utilizando una única
   sentencia `INSERT` multirregistro (*multi-row*).
5. Registra un pedido completo: inserta una cabecera en `pedidos` para un
   cliente existente y luego inserta 2 líneas asociadas a ese pedido en
   `detalle_pedido`.
6. Prueba la integridad de la base de datos: intenta insertar un producto con
   `precio = -5` y observa el fallo de la restricción `CHECK`; luego intenta
   insertar un cliente con un `correo` ya existente y observa el fallo `UNIQUE`.
7. Usa `INSERT OR IGNORE` para intentar insertar una lista de categorías donde
   algunas ya existen (`'Libros'`) y una es nueva, sin que la consulta falle.

[Senior / Producción]
8. Implementa un `UPSERT` (`ON CONFLICT(nombre) DO UPDATE`) sobre `productos`:
   al insertar un producto cuyo `nombre` ya existe, suma las nuevas `existencias`
   al stock actual y actualiza el `precio`.
9. Usa `INSERT INTO ... SELECT`: Crea una tabla temporal `CREATE TEMP TABLE resumen_categorias (categoria_id INT, total_productos INT, valor_stock REAL)`
   ycciónala poblarla directamente desde una consulta agrupada sobre `productos`.
10. Limpieza transaccional: Ejecuta una inserción usando la cláusula `RETURNING`
    para obtener el `id` generado y luego elimina los registros de prueba o usa
    `BEGIN ... ROLLBACK` para dejar la base de práctica en su estado original.
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
