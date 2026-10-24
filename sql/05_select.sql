/*
================================================================================
TEMA 05: SELECT, PROYECCIÓN DE COLUMNAS, ALIAS Y DISTINCT
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
`SELECT` es la instrucción de lectura (DQL - Data Query Language) más utilizada
en el desarrollo de software. Su función en la cláusula inicial se llama
PROYECCIÓN: elegir qué columnas, expresiones o constantes compondrán la tabla de
resultado que viajará desde el motor de base de datos hacia tu aplicación.

Modelo mental del Orden de Ejecución Lógico:
Aunque escribes `SELECT` primero y `FROM` después:
  1. Primero se ejecuta `FROM tabla` (el motor localiza la tabla origen).
  2. Luego se ejecuta `SELECT columnas` (el motor proyecta, calcula o renombra
     las columnas solicitadas para cada fila).

Importante: Una sentencia `SELECT` es 100% de SOLO LECTURA (idempotente). Jamás
altera, añade ni borra los datos almacenados en la tabla original; únicamente
construye un conjunto de resultados en memoria (Result Set).

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Endpoints de API REST / GraphQL: Cuando el frontend necesita renderizar una
    lista de tarjetas de productos, solo proyectas `id, nombre, precio`, ahorrando
    ancho de banda de red y memoria RAM en el servidor.
  - Generación de Reportes y CSVs: Usar alias con `AS` para entregar nombres de
    columnas limpios o traducidos al negocio (`SELECT fecha AS fecha_compra`) o
    adaptarlos a las propiedades (`camelCase`) que espera un DTO en el backend.
  - Descubrimiento de valores únicos (`DISTINCT`): Obtener la lista de ciudades
    donde tenemos clientes activos sin filas repetidas para poblar un `<select>`
    desplegable en la interfaz.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Proyección explícita de columnas (Recomendado siempre en producción)
SELECT id, nombre, precio
FROM productos;

-- B) Renombrar columnas o expresiones en la salida usando alias (AS)
SELECT
    nombre AS producto,
    precio AS precio_usd,
    existencias AS stock_actual
FROM productos;

-- C) Eliminar filas duplicadas del conjunto de resultados con DISTINCT
SELECT DISTINCT ciudad
FROM clientes;

-- D) SELECT sin FROM (Evaluar expresiones constantes o funciones del sistema)
SELECT
    'Sistema Operativo OK' AS estado,
    CURRENT_DATE           AS fecha_servidor,
    sqlite_version()       AS version_motor;

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: El equipo de Frontend solicita el catálogo de productos con
nombres de columnas listos para su interfaz (`id`, `producto`, `precio_lista`,
`unidades_disponibles`), excluyendo columnas internas como `descripcion` o `activo`.
*/
-- SELECT
--     id,
--     nombre      AS producto,
--     precio      AS precio_lista,
--     existencias AS unidades_disponibles
-- FROM productos;
/*
Resultado esperado:
+----+------------------------+--------------+----------------------+
| id | producto               | precio_lista | unidades_disponibles |
+----+------------------------+--------------+----------------------+
| 1  | Cuaderno               | 4.5          | 20                   |
| 2  | Lapiz                  | 1.25         | 100                  |
| 3  | SQL para principiantes | 18.0         | 8                    |
| 4  | Teclado                | 25.5         | 0                    |
+----+------------------------+--------------+----------------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - POR QUÉ `SELECT *` ES UN ANTIPATRÓN EN PRODUCCIÓN:
      1. Tráfico de red y RAM: Si una tabla tiene una columna `descripcion` de
         50 KB o un `BLOB` y haces `SELECT *`, arrastras megabytes inútiles por
         la red en cada petición.
      2. Invalidez de Covering Indexes: Si pides solo `SELECT id, correo FROM clientes`,
         el motor puede responder leyendo únicamente el índice en memoria sin
         tocar el disco. `SELECT *` obliga siempre a leer la tabla completa.
      3. Fragilidad de contratos: Si mañana alguien añade o reordena una columna,
         `SELECT *` puede romper el mapeo por posición o exponer datos sensibles
         (como hashes de contraseñas o tokens internos) en una API.
      *Nota*: Usa `SELECT *` solo para exploración rápida ad-hoc con `LIMIT 10`.
  - GOTCHA CON ALIAS: No olvides la coma `,` entre columnas en el `SELECT`. Si
    escribes `SELECT nombre apellido FROM clientes;` (sin coma), ¡SQL interpretará
    `apellido` como el ALIAS de la columna `nombre` y devolverá una sola columna!
  - `DISTINCT` SE APLICA A TODA LA FILA PROYECTADA: `SELECT DISTINCT ciudad, nombre`
    devuelve combinaciones únicas de `(ciudad, nombre)`, no solo ciudades únicas.

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Explora todas las columnas de la tabla `categorias` usando `SELECT *` y luego
   reescribe la consulta proyectando explícitamente `id` y `nombre`.
2. Consulta la tabla `productos` mostrando únicamente `nombre` y `precio`.
3. Consulta la tabla `estudiantes` proyectando `nombre`, `apellido` y `correo`
   en ese orden exacto.

[Intermedio]
4. Crea un reporte de inventario sobre `productos` que muestre `id AS codigo`,
   `nombre AS articulo`, `precio AS valor_unitario` y `existencias AS stock`.
5. Consulta los pedidos mostrando las columnas en el orden exacto que requiere el
   equipo de contabilidad: `fecha`, `estado`, `total`, `cliente_id` y `id AS folio`.
6. Utiliza `SELECT DISTINCT` sobre la tabla `clientes` para obtener la lista de
   ciudades únicas donde residen nuestros clientes, y haz otra consulta con
   `SELECT DISTINCT estado FROM pedidos;`.
7. Escribe un `SELECT` sin `FROM` que devuelva tu nombre como `desarrollador`,
   la constante `'SQLite'` como `motor`, `CURRENT_TIMESTAMP` como `fecha_hora`
   y `sqlite_version()` como `version`.

[Senior / Producción]
8. Demuestra el bug clásico de la coma olvidada: ejecuta en una consulta
   `SELECT nombre, apellido FROM clientes;` y compáralo con
   `SELECT nombre apellido FROM clientes;`. Explica en un comentario por qué la
   segunda consulta no arroja error de sintaxis pero produce un bug silencioso.
9. Proyecta de la tabla `empleados` las columnas `id`, `nombre`, `salario` y añade
   una columna constante llamada `moneda` con el valor `'USD'` y otra llamada
   `empresa` con el valor `'TechCorp'`.
10. Compara `SELECT DISTINCT departamento_id FROM empleados;` frente a
    `SELECT DISTINCT departamento_id, nombre FROM empleados;`. Documenta por qué
    el número de filas devueltas cambia al añadir `nombre` al `SELECT DISTINCT`.
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
