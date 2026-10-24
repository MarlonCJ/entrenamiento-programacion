/*
================================================================================
TEMA 01: BASES DE DATOS RELACIONALES
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Una base de datos relacional organiza la información en TABLAS (relaciones)
compuestas por FILAS (tuplas/registros) y COLUMNAS (atributos/campos).

El modelo mental fundamental de un desarrollador profesional se basa en tres
pilares:
  - Entidad única por tabla: Cada tabla representa UN solo concepto del mundo
    real (`clientes`, `productos`, `pedidos`). No mezcles datos de clientes y
    productos en una misma tabla tipo hoja de cálculo.
  - Identidad e Integridad (Claves):
      * Clave Primaria (PRIMARY KEY - PK): Identificador único e irrepetible de
        cada fila (ej. `clientes.id`).
      * Clave Foránea (FOREIGN KEY - FK): Columna que apunta a la PK de otra
        tabla para conectar entidades sin duplicar datos (ej. `pedidos.cliente_id`
        apunta a `clientes.id`).
  - Naturaleza Declarativa de SQL: En lenguajes imperativos (JS, Python) le
    dices a la máquina CÓMO iterar paso a paso (`for`, `if`). En SQL declaras
    QUÉ conjunto de datos necesitas y el optimizador del motor decide la ruta
    más eficiente para obtenerlo.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Sistemas E-Commerce y Fintech: Donde un pedido pertenece a un cliente y
    contiene múltiples productos, exigiendo que jamás exista un cobro huérfano.
  - Plataformas SaaS y Académicas: Para modelar relaciones Uno-a-Muchos (1:N, un
    departamento tiene muchos empleados) y Muchos-a-Muchos (N:M, estudiantes se
    inscriben en múltiples cursos mediante la tabla puente `matriculas`).
  - Prevención de anomalías de actualización: Si Ana cambia de correo, lo
    actualizas en 1 sola fila de `clientes`, no en 500 facturas históricas.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Definir una entidad maestra ( Lado "1" de la relación )
CREATE TABLE clientes (
    id INTEGER PRIMARY KEY,          -- Clave Primaria (PK)
    nombre TEXT NOT NULL,            -- Atributo obligatorio
    correo TEXT UNIQUE               -- Atributo único de negocio
);

-- B) Definir una entidad dependiente ( Lado "N" de la relación )
CREATE TABLE pedidos (
    id INTEGER PRIMARY KEY,          -- PK del pedido
    cliente_id INTEGER NOT NULL,     -- Clave Foránea (FK) hacia clientes(id)
    fecha TEXT NOT NULL,
    total REAL NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- C) Inspeccionar tablas existentes en SQLite
SELECT name FROM sqlite_master WHERE type = 'table';

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: Queremos verificar en nuestra base de práctica cómo se
relacionan los clientes con sus pedidos sin duplicar el nombre ni el correo del
cliente en cada compra.

Paso 1: Consultamos la tabla maestra `clientes`
*/
-- SELECT id, nombre, apellido, correo FROM clientes;
/*
Resultado esperado:
+----+--------+----------+-------------------+
| id | nombre | apellido | correo            |
+----+--------+----------+-------------------+
| 1  | Ana    | Perez    | ana@example.test  |
| 2  | Luis   | Gomez    | luis@example.test |
| 3  | Mia    | Torres   | NULL              |
+----+--------+----------+-------------------+

Paso 2: Consultamos la tabla transaccional `pedidos` observando `cliente_id`
*/
-- SELECT id AS pedido_id, cliente_id, fecha, estado, total FROM pedidos;
/*
Resultado esperado:
+-----------+------------+------------+-----------+-------+
| pedido_id | cliente_id | fecha      | estado    | total |
+-----------+------------+------------+-----------+-------+
| 1         | 1          | 2026-01-15 | pagado    | 10.0  |
| 2         | 1          | 2026-02-03 | pendiente | 18.0  |
| 3         | 2          | 2026-02-11 | cancelado | 25.5  |
+-----------+------------+------------+-----------+-------+
Observación clave: `cliente_id = 1` vincula los pedidos 1 y 2 con Ana Pérez.
Mia (`id = 3`) aún no tiene pedidos, pero su registro existe de forma
independiente en `clientes`.

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - ERROR COMÚN (Síndrome de Excel): Guardar `producto_1`, `producto_2`,
    `producto_3` como columnas dentro de `pedidos`, o guardar una lista separada
    por comas `'1,2,4'`. Eso viola la Primera Forma Normal (1NF) y destruye la
    capacidad de filtrar, indexar y sumar por producto.
  - GOTCHA DE SQLITE (`PRAGMA foreign_keys`): Por compatibilidad histórica,
    SQLite trae las claves foráneas desactivadas al abrir una conexión. Siempre
    ejecuta `PRAGMA foreign_keys = ON;` al iniciar tu sesión o conexión.
  - BUENA PRÁCTICA (Claves Subrogadas vs Naturales): Usa un `id INTEGER PRIMARY KEY`
    inmutable como clave primaria interna, incluso si existe un dato único como
    `correo` o `documento` (que el usuario podría cambiar o corregir en el futuro).
  - RENDIMIENTO: Pensar en conjuntos (Set-based thinking). Nunca hagas un bucle
    en tu backend que ejecute 1,000 consultas `SELECT` fila por fila (el temido
    problema N+1) cuando una sola consulta relacional devuelve todo el bloque.

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Consulta todas las filas de la tabla `categorias` y explica en un comentario
   cuál columna actúa como Clave Primaria (PK) y qué representa cada fila.
2. Ejecuta una consulta sobre `productos` mostrando `id`, `nombre` y `categoria_id`.
   Identifica a qué categoría pertenece el producto 'Cuaderno' comparando con `categorias`.
3. Lista `id`, `nombre` y `departamento_id` de la tabla `empleados` y determina
   qué empleados trabajan en el mismo departamento.

[Intermedio]
4. Diseña en comentarios el esquema de tablas (nombres de tablas, columnas, PK y FK)
   para una biblioteca donde un Autor escribe muchos Libros (1:N).
5. Observa las tablas `estudiantes`, `cursos` y `matriculas` en `00_base_practica.sql`.
   Escribe una consulta sobre `matriculas` y explica por qué se necesita esa tabla
   intermedia en lugar de poner `curso_id` dentro de `estudiantes`.
6. Examina `pedidos` y `detalle_pedido`. ¿Qué datos del cliente o del producto NO se
   repiten en `pedidos` y por qué sin embargo `precio_unitario` SÍ se guarda en
   `detalle_pedido`? (Pista: piensa qué pasa con las facturas pasadas si mañana sube
   el precio de un producto en el catálogo).
7. Consulta la tabla `sqlite_master` (`SELECT type, name, tbl_name FROM sqlite_master;`)
   para listar todas las tablas e índices automáticos creados en la base de práctica.

[Senior / Producción]
8. Ejecuta `PRAGMA foreign_key_list(detalle_pedido);` y `PRAGMA table_info(detalle_pedido);`
   para auditar cómo está compuesta la clave primaria y las referencias foráneas de
   una tabla puente de producción.
9. Detecta el antipatrón de diseño: Un desarrollador junior propone crear una sola
   tabla `ventas_planas (id, cliente_nombre, cliente_correo, cliente_ciudad, producto_nombre,
   categoria_nombre, precio, cantidad)`. Documenta en un comentario las 3 anomalías
   (Inserción, Actualización y Borrado) que sufrirá el sistema en producción.
10. Propón mediante sentencias `CREATE TABLE` de prueba (usando nombres como
    `proy_usuarios`, `proy_roles`, `proy_usuario_rol`) el modelo relacional completo
    para un sistema de permisos donde un usuario puede tener múltiples roles y un rol
    puede asignarse a múltiples usuarios.
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
