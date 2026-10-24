/*
================================================================================
TEMA 02: TIPOS DE DATOS Y AFINIDAD EN SQLITE (Y ESTÁNDAR SQL)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Los tipos de datos definen qué clase de valores puede almacenar una columna,
cuánta memoria ocupan en disco y qué operaciones (suma, ordenamiento, comparación)
son válidas sobre ellos.

A diferencia de motores con tipado estático rígido (PostgreSQL, MySQL, SQL Server),
SQLite utiliza un sistema de TIPADO DINÁMICO CON AFINIDAD DE COLUMNA (o tablas
`STRICT` desde SQLite 3.37+). En SQLite, todo valor almacenado pertenece a una
de estas 5 clases de almacenamiento (Storage Classes):
  1. `NULL`    : Valor ausente o desconocido.
  2. `INTEGER` : Entero con signo (de 1 a 8 bytes según magnitud). Ideal para IDs,
                 contadores, cantidades y banderas booleanas (`0` y `1`).
  3. `REAL`    : Número en coma flotante IEEE de 8 bytes.
  4. `TEXT`    : Cadena de texto codificada en UTF-8 / UTF-16.
  5. `BLOB`    : Bloque binario exacto (archivos, hashes criptográficos, imágenes).

¿Por qué importa dominar esto? Porque en bases de datos el texto `'100'` NO es igual
al entero `100`, y ordenar textos (`'10'`, `'2'`, `'100'`) produce un orden
alfabético (`'10'`, `'100'`, `'2'`) completamente distinto al orden numérico.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Identificadores, códigos postales y teléfonos: Aunque un teléfono (`'099123456'`)
    o código postal (`'01001'`) tenga dígitos, NO operamos matemáticamente con
    ellos y pueden empezar con cero o incluir `+`. Deben ser `TEXT`, nunca `INTEGER`.
  - Dinero y Finanzas: En SQLite no existe `DECIMAL` nativo separado de `REAL`.
    En sistemas financieros de alta precisión, los desarrolladores Senior guardan
    el dinero como `INTEGER` en centavos (ej. `1850` centavos = `$18.50`) para
    evitar errores de redondeo de punto flotante IEEE 754, o validan con `ROUND(val, 2)`.
  - Fechas y Horas: SQLite no tiene clase `DATE` dedicada; se almacenan en `TEXT`
    bajo formato estándar ISO-8601 (`'YYYY-MM-DD'` o `'YYYY-MM-DD HH:MM:SS'`), lo
    que permite ordenarlas cronológicamente y usar funciones como `date()` y `strftime()`.
  - Booleanos: Se almacenan como `INTEGER` restringido a `0` (falso) y `1` (verdadero).

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Inspeccionar el tipo real de cualquier valor o columna con typeof()
SELECT
    typeof(42)         AS tipo_entero,   -- 'integer'
    typeof(19.99)      AS tipo_decimal,  -- 'real'
    typeof('2026-01')  AS tipo_texto,    -- 'text'
    typeof(NULL)       AS tipo_nulo,     -- 'null'
    typeof(X'CAFE')    AS tipo_binario;  -- 'blob'

-- B) Conversión explícita de tipos con CAST(expresion AS tipo)
SELECT
    CAST('125' AS INTEGER) + 5 AS suma_correcta,
    CAST(4.50 AS TEXT)         AS precio_texto;

-- C) Tabla moderna en SQLite con modo STRICT (rechaza tipos incorrectos al instante)
CREATE TABLE IF NOT EXISTS transacciones_estrictas (
    id INTEGER PRIMARY KEY,
    monto_centavos INTEGER NOT NULL,
    fecha_iso TEXT NOT NULL
) STRICT;

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: Auditar los tipos de almacenamiento reales que tienen los datos
de la tabla `productos` y `clientes` en nuestra base de práctica.
*/
-- SELECT
--     nombre,
--     typeof(nombre)      AS tipo_nombre,
--     precio,
--     typeof(precio)      AS tipo_precio,
--     existencias,
--     typeof(existencias) AS tipo_stock,
--     activo,
--     typeof(activo)      AS tipo_booleano
-- FROM productos;
/*
Resultado esperado:
+------------------------+-------------+--------+-------------+-------------+------------+--------+---------------+
| nombre                 | tipo_nombre | precio | tipo_precio | existencias | tipo_stock | activo | tipo_booleano |
+------------------------+-------------+--------+-------------+-------------+------------+--------+---------------+
| Cuaderno               | text        | 4.5    | real        | 20          | integer    | 1      | integer       |
| Lapiz                  | text        | 1.25   | real        | 100         | integer    | 1      | integer       |
| SQL para principiantes | text        | 18.0   | real        | 8           | integer    | 1      | integer       |
| Teclado                | text        | 25.5   | real        | 0           | integer    | 0      | integer       |
+------------------------+-------------+--------+-------------+-------------+------------+--------+---------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - GOTCHA DE AFINIDAD EN SQLITE: Si declaras `precio REAL` e insertas `'4.50'`
    como texto, SQLite lo convierte silenciosamente a `4.5` (`real`). Pero si
    insertas `'gratis'`, ¡SQLite estándar lo guardará como `'gratis'` (`text`)
    a menos que uses una restricción `CHECK (typeof(precio) IN ('integer', 'real'))`
    o declares la tabla como `STRICT`!
  - ERROR COMÚN CON FECHAS: Guardar fechas en formato local `'15/01/2026'` o
    `'03/02/2026'`. Al ordenarlas con `ORDER BY fecha`, `'03/02/2026'` saldrá
    ANTES que `'15/01/2026'` porque `'0'` va antes que `'1'`. Usa SIEMPRE
    formato ISO-8601 `'YYYY-MM-DD'` (`'2026-01-15'`).
  - GOTCHA DE PUNTO FLOTANTE (`REAL`): En binario IEEE 754, `0.1 + 0.2` es
    `0.30000000000000004`. Nunca compares columnas `REAL` con `=` directo sin
    `ROUND()`, o almacena montos monetarios en centavos (`INTEGER`).
  - RENDIMIENTO: Evita almacenar archivos grandes (`BLOB` de varios MB) dentro
    de tablas muy consultadas; guarda el archivo en almacenamiento de objetos
    (S3/disco) y almacena solo la ruta o URL como `TEXT` en la base de datos.

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Escribe un `SELECT` sin `FROM` que use `typeof()` para mostrar el tipo de dato
   de: `100`, `100.0`, `'100'`, `NULL` y `X'00FF'`.
2. Consulta la tabla `clientes` mostrando `nombre`, `correo`, `telefono` y el
   resultado de `typeof(correo)` y `typeof(telefono)` para observar cómo se
   comporta `typeof` ante valores `NULL`.
3. Consulta la tabla `pedidos` mostrando `id`, `fecha`, `total` y convierte `total`
   a número entero usando `CAST(total AS INTEGER) AS total_entero`.

[Intermedio]
4. Demuestra en una consulta la diferencia entre sumar números y concatenar o
   convertir textos: proyecta `'12' + '8'`, `'12' || '8'` y `CAST('12' AS INTEGER) + 8`.
5. Explica en un comentario qué tipo de dato (`INTEGER`, `REAL`, `TEXT`) elegirías
   para: a) Código postal (`'05001'`), b) Stock de almacén, c) Fecha de nacimiento,
   d) Estado activo/inactivo, e) Número de tarjeta o teléfono. Justifica cada uno.
6. Consulta `productos` y proyecta el precio en centavos como un `INTEGER` exacto
   (`CAST(ROUND(precio * 100) AS INTEGER) AS precio_centavos`).
7. Comprueba la imprecisión de coma flotante ejecutando:
   `SELECT 0.1 + 0.2 AS suma_real, ROUND(0.1 + 0.2, 2) AS suma_redondeada;`
   y verifica cuánto da `(0.1 + 0.2) = 0.3`.

[Senior / Producción]
8. Audita si existe algún valor corrupto (texto infiltrado en columnas numéricas)
   en `productos` consultando las filas donde `typeof(precio)` no sea `'real'` ni
   `'integer'`, o donde `typeof(existencias)` no sea `'integer'`.
9. Crea una tabla temporal de prueba `CREATE TEMP TABLE pagos_seguros (...) STRICT`
   con `id INTEGER PRIMARY KEY`, `monto_centavos INTEGER NOT NULL`, `moneda TEXT NOT NULL`
   e intenta insertar un texto en `monto_centavos` (en comentario) para documentar cómo
   protege el modo `STRICT`.
10. Diseña una consulta sobre `detalle_pedido` que calcule el subtotal exacto
    multiplicando `cantidad * precio_unitario`, muestre su `typeof()`, y lo formatee
    redondeado a 2 decimales con `ROUND(..., 2)`.
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
