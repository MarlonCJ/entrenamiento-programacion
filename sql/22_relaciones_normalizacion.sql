/*
================================================================================
TEMA 22: RELACIONES, CARDINALIDAD Y NORMALIZACIÓN (1FN, 2FN, 3FN)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
El diseño relacional y la **Normalización** son el arte de estructurar las tablas
para que cada hecho de la realidad viva en **un único lugar**, evitando la
redundancia de datos y las tres anomalías clásicas que destruyen bases de datos
mal diseñadas:
1. **Anomalía de Actualización**: si guardas el `correo` y `ciudad` del cliente
   repetidos en cada fila de `pedidos` y el cliente cambia de correo, tienes que
   actualizar 50 filas; si olvidas una, tu base de datos se contradice a sí misma.
2. **Anomalía de Inserción**: no poder registrar un nuevo curso o categoría
   porque aún no hay ningún estudiante matriculado o producto asignado.
3. **Anomalía de Eliminación**: borrar el único pedido de un cliente y perder
   accidentalmente todos los datos de contacto del cliente.

Las **Formas Normales (1FN, 2FN, 3FN)** se resumen en un mantra famoso:
> *"Cada columna que no sea clave debe depender de la clave (1FN), de toda la
> clave (2FN) y nada más que de la clave (3FN)."*

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
- **Relación Uno a Muchos (1:N)**: el patrón más común. Una `categoria` tiene
  muchos `productos`; un `cliente` realiza muchos `pedidos`. La clave foránea
  (`FOREIGN KEY`) va SIEMPRE del lado del "Muchos" (`productos.categoria_id`,
  `pedidos.cliente_id`).
- **Relación Muchos a Muchos (N:M)**: un `estudiante` se inscribe en varios
  `cursos`, y un `curso` tiene varios `estudiantes`; un `pedido` incluye varios
  `productos` y un `producto` aparece en varios `pedidos`. Se resuelve creando
  una **tabla intermedia o asociativa** (`matriculas`, `detalle_pedido`) con
  dos claves foráneas que juntas forman una `PRIMARY KEY` compuesta.
- **Relación Uno a Uno (1:1)**: dividir datos opcionales o confidenciales de un
  empleado en una tabla `empleados_datos_fiscales` donde `empleado_id` es a la
  vez `PRIMARY KEY` y `FOREIGN KEY`.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- SIEMPRE activar el cumplimiento de claves foráneas al conectar en SQLite:
PRAGMA foreign_keys = ON;

-- A) Relación 1:N (Departamento -> Empleados) con acciones ON DELETE / ON UPDATE:
CREATE TABLE IF NOT EXISTS areas (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS colaboradores (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    area_id INTEGER NOT NULL,
    FOREIGN KEY (area_id) REFERENCES areas(id)
        ON DELETE RESTRICT    -- Impide borrar un área que aún tiene colaboradores
        ON UPDATE CASCADE
);

-- B) Relación N:M (Tabla intermedia con Clave Primaria Compuesta y atributos propios):
CREATE TABLE IF NOT EXISTS asignaciones_proyecto (
    colaborador_id INTEGER NOT NULL,
    proyecto_id INTEGER NOT NULL,
    rol TEXT NOT NULL,
    horas_semanales INTEGER NOT NULL CHECK (horas_semanales > 0),
    PRIMARY KEY (colaborador_id, proyecto_id),
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    FOREIGN KEY (proyecto_id) REFERENCES cursos(id) ON DELETE RESTRICT
);

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con resultado esperado)
--------------------------------------------------------------------------------
Escenario: Recibes una hoja de cálculo "desnormalizada" de ventas con esta estructura:
`ventas_crudo(pedido_id, fecha, cliente_nombre, cliente_correo, productos_lista, precios_lista)`
Ejemplo de fila problemática:
`(101, '2026-01-15', 'Ana Perez', 'ana@example.test', 'Cuaderno, Lapiz', '4.50, 1.25')`

Aplicando las 3 Formas Normales (tal como está modelado en `00_base_practica.sql`):
- **Paso a 1FN (Atomicidad, sin listas ni grupos repetitivos)**:
  Prohibido guardar `'Cuaderno, Lapiz'` en una celda. Cada ítem de un pedido
  debe ser una fila individual.
- **Paso a 2FN (Dependencia funcional completa de toda la clave compuesta)**:
  En la tabla de líneas `(pedido_id, producto_id)`, el `nombre` del producto
  depende solo de `producto_id`, y la `fecha` del pedido depende solo de
  `pedido_id`. Separamos `pedidos`, `productos` y `detalle_pedido`.
- **Paso a 3FN (Sin dependencias transitivas entre columnas no-clave)**:
  En `pedidos`, `cliente_nombre` y `cliente_correo` dependen de `cliente_id`,
  no del pedido. Los movemos a la tabla `clientes`.

Consulta para reconstruir la información limpia sin duplicidad en el almacenamiento:
SELECT
    p.id AS pedido_id,
    p.fecha,
    c.nombre || ' ' || c.apellido AS cliente,
    pr.nombre AS producto,
    dp.cantidad,
    dp.precio_unitario
FROM pedidos p
INNER JOIN clientes c ON c.id = p.cliente_id
INNER JOIN detalle_pedido dp ON dp.pedido_id = p.id
INNER JOIN productos pr ON pr.id = dp.producto_id
WHERE p.id = 1;

Resultado esperado:
+-----------+------------+-----------+----------+----------+-----------------+
| pedido_id | fecha      | cliente   | producto | cantidad | precio_unitario |
+-----------+------------+-----------+----------+----------+-----------------+
| 1         | 2026-01-15 | Ana Perez | Cuaderno | 1        | 4.5             |
| 1         | 2026-01-15 | Ana Perez | Lapiz    | 4        | 1.375           |
+-----------+------------+-----------+----------+----------+-----------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
- ¡GOTCHA CRÍTICO DE SQLITE (`PRAGMA foreign_keys = ON`)!:
  Por compatibilidad histórica, SQLite tiene las claves foráneas **DESACTIVADAS
  por defecto en cada nueva conexión**. Si no ejecutas `PRAGMA foreign_keys = ON;`
  al abrir la sesión, SQLite te dejará insertar un pedido con `cliente_id = 99999`
  sin dar error.Verifica su estado con `PRAGMA foreign_keys;` (debe devolver `1`).
- ¿CUÁNDO SÍ "DESNORMALIZAR" INTENCIONALMENTE DATOS HISTÓRICOS?:
  Observa en `detalle_pedido` la columna `precio_unitario`. ¿Acaso el precio no
  está ya en `productos.precio`? ¡Cuidado! Si el mes que viene el `Cuaderno` sube
  de $4.50 a $6.00 en `productos`, las facturas del mes pasado NO deben cambiar
  de valor. Guardar `precio_unitario` en `detalle_pedido` NO es un error de
  normalización: es capturar el **valor histórico inmutable en el instante de la
  transacción**.
- Elegir entre `ON DELETE RESTRICT` vs `ON DELETE CASCADE`:
  Usa `RESTRICT` (el comportamiento por defecto) para entidades maestras como
  `clientes` o `productos` (nunca querrás borrar todas las facturas históricas
  por borrar un producto). Usa `CASCADE` solo en entidades débiles que no tienen
  sentido sin su padre (ej. borrar las líneas de un carrito temporal al borrar
  el carrito).

6. EJERCICIOS PROGRESIVOS (10 Retos: [Básico] 1-3, [Intermedio] 4-7, [Senior / Producción] 8-10)
--------------------------------------------------------------------------------
[Básico]
1. Verificación de integridad referencial: Ejecuta `PRAGMA foreign_keys = ON;`
   e intenta insertar un pedido en `pedidos` con `cliente_id = 999` (inexistente).
   Comprueba el error `FOREIGN KEY constraint failed` y explica en un comentario
   qué pasaría si `PRAGMA foreign_keys` estuviera en `OFF`.
2. Identificación de relaciones 1:N: Inspecciona las tablas `categorias` y
   `productos` de `00_base_practica.sql`. Escribe una consulta que muestre
   cuántos productos tiene cada categoría y explica en un comentario por qué la
   columna `categoria_id` está en `productos` y no `producto_id` en `categorias`.
3. Relación N:M en acción: Consulta las tablas `estudiantes`, `matriculas` y
   `cursos` para mostrar el nombre del estudiante, el nombre del curso y la
   fecha de matrícula. Explica por qué la clave primaria de `matriculas` es
   `PRIMARY KEY (estudiante_id, curso_id)`.

[Intermedio]
4. Violación de 1FN (Diagnóstico y corrección): Un desarrollador junior propone
   crear una tabla `cursos_tags (curso_id INTEGER, etiquetas TEXT)` guardando
   `'sql, bases-de-datos, backend'` en una sola columna separada por comas.
   Explica qué problemas causa esto al filtrar o actualizar una etiqueta, y
   escribe los `CREATE TABLE` normalizados en 1FN (`etiquetas` y `curso_etiquetas`).
5. Violación de 2FN y 3FN: Dada una tabla mal diseñada:
   `facturas_malas (pedido_id, producto_id, cliente_id, cliente_nombre, cliente_ciudad, producto_nombre, cantidad)`
   cuya clave primaria es `(pedido_id, producto_id)`, identifica en comentarios
   qué columnas violan la 2FN y cuáles violan la 3FN.
6. Modelado de Biblioteca (1:N y N:M): Un libro puede ser escrito por varios
   autores, y un autor puede escribir varios libros. Además, cada libro pertenece
   a una única editorial. Escribe las sentencias `CREATE TABLE IF NOT EXISTS` para
   `editoriales`, `autores`, `libros` y `libro_autor` con todas sus claves
   primarias y foráneas.
7. Relación 1:1 (Extensión de perfil): Diseña una tabla `empleados_perfil_seguridad`
   que tenga una relación estricta 1 a 1 con `empleados` (usando `empleado_id`
   como `PRIMARY KEY` y `FOREIGN KEY` hacia `empleados(id)`), almacenando
   `nivel_acceso` y `hash_credencial`.

[Senior / Producción]
8. Relación reflexiva (Autorreferencia / Jerarquía en una misma tabla): En una
   empresa, cada empleado tiene un jefe directo que también es un empleado.
   Escribe un `CREATE TABLE empleados_jerarquia` donde `jefe_id` sea una clave
   foránea que apunte a `empleados_jerarquia(id)`, inserta un Director y dos
   subordinados, y haz un `LEFT JOIN` de la tabla consigo misma (`Self-Join`)
   para mostrar `empleado` y `nombre_jefe`.
9. Verdad histórica vs Redundancia dañina: En `detalle_pedido` guardamos
   `precio_unitario` además de existir `productos.precio`. Escribe una consulta
   que compare `detalle_pedido.precio_unitario` con `productos.precio` actual
   (observa el producto `id = 2` en el pedido `1` de `00_base_practica.sql` donde
   `precio_unitario` es `1.375` y el precio actual es `1.25`). Justifica por qué
   este diseño es correcto y no viola la 3FN.
10. Arquitectura completa de Clínica Médica: Diseña el esquema relacional en
    3FN (`CREATE TABLE` con `CHECK`, `UNIQUE`, `PRIMARY KEY` y `FOREIGN KEY`)
    para gestionar `pacientes`, `medicos`, `especialidades`, `citas` y
    `recetas_medicamentos` (donde una cita puede recetar varios medicamentos con
    su dosis y duración).
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
