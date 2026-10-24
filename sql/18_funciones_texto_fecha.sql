/*
================================================================================
TEMA 18: FUNCIONES DE TEXTO, NÚMERO Y FECHA/HORA
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Los datos crudos rara vez están listos para mostrarse en un reporte o compararse
directamente: los usuarios escriben correos con espacios o mayúsculas mezcladas,
los precios calculados tienen decimales infinitos y las fechas deben agruparse
por año, mes, trimestre o calcularse su antigüedad.

Modelo mental en SQLite:
- Funciones escalares: reciben uno o más valores por fila y devuelven un valor
  transformado por cada fila.
- Fechas en SQLite: SQLite no tiene un tipo físico `DATETIME` separado; almacena
  las fechas como texto ISO-8601 (`'YYYY-MM-DD'` o `'YYYY-MM-DD HH:MM:SS'`),
  números reales (días julianos) o enteros (Unix epoch). El formato ISO-8601 en
  `TEXT` es el estándar recomendado porque se ordena alfabéticamente y
  cronológicamente de forma idéntica y es compatible con `date()`, `datetime()`,
  `julianday()` y `strftime()`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
- Normalización y limpieza de datos (Data Cleansing): usar `TRIM()`, `LOWER()`
  al guardar o buscar correos electrónicos y códigos SKU.
- Reportes financieros y de facturación: usar `ROUND(monto, 2)` para presentar
  importes monetarios e impuestos.
- Cohortes y series temporales: usar `strftime('%Y-%m', fecha)` para agrupar
  ventas mensuales o `julianday('now') - julianday(fecha)` para calcular los
  días de mora de un pedido o la antigüedad de un empleado.
- Generación de códigos, etiquetas o máscaras de privacidad: concatenar con `||`
  y usar `SUBSTR()` para ocultar parte de un teléfono o correo (`'a***@example.test'`).

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) FUNCIONES DE TEXTO Y CONCATENACIÓN:
SELECT
    UPPER(nombre) AS mayusculas,
    LOWER(correo) AS minusculas,
    LENGTH(nombre) AS longitud_caracteres,
    TRIM('  hola  ') AS sin_espacios_extremos,
    SUBSTR(nombre, 1, 3) AS primeros_3_chars,   -- En SQL el índice empieza en 1
    REPLACE(correo, '@example.test', '@empresa.com') AS nuevo_correo,
    INSTR(correo, '@') AS posicion_arroba,
    nombre || ' ' || apellido AS nombre_completo
FROM clientes;

-- B) FUNCIONES NUMÉRICAS:
SELECT
    ROUND(18.4567, 2) AS redondeado,            -- 18.46
    ABS(-42.5) AS valor_absoluto,               -- 42.5
    MAX(10, 25, 18) AS mayor_entre_columnas,    -- 25 (con 2+ argumentos es escalar)
    MIN(10, 25, 18) AS menor_entre_columnas;    -- 10

-- C) FUNCIONES DE FECHA Y HORA (ISO-8601: 'YYYY-MM-DD'):
SELECT
    date('now') AS hoy_utc,
    datetime('now', 'localtime') AS ahora_local,
    date('2026-01-15', '+30 days') AS vencimiento,
    date('2026-02-03', 'start of month', '+1 month', '-1 day') AS ultimo_dia_mes,
    strftime('%Y', fecha) AS anio,
    strftime('%Y-%m', fecha) AS anio_mes,
    CAST(julianday('2026-03-01') - julianday(fecha) AS INTEGER) AS dias_transcurridos
FROM pedidos;

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con resultado esperado)
--------------------------------------------------------------------------------
Escenario: Recursos Humanos y Nómina requieren un reporte de antigüedad de los
empleados al corte `'2026-06-01'`, generando un código interno de empleado
(`EMP-ID-INICIALES`), su salario anual proyectado y sus años de servicio.

Consulta paso a paso:
SELECT
    'EMP-' || printf('%03d', id) || '-' || UPPER(SUBSTR(nombre, 1, 2)) AS codigo_empleado,
    nombre,
    fecha_contratacion,
    strftime('%Y', fecha_contratacion) AS anio_ingreso,
    ROUND((julianday('2026-06-01') - julianday(fecha_contratacion)) / 365.25, 1) AS anios_antiguedad,
    ROUND(salario * 12, 2) AS salario_anual
FROM empleados
ORDER BY anios_antiguedad DESC;

Resultado esperado:
+-----------------+--------+--------------------+--------------+------------------+---------------+
| codigo_empleado | nombre | fecha_contratacion | anio_ingreso | anios_antiguedad | salario_anual |
+-----------------+--------+--------------------+--------------+------------------+---------------+
| EMP-003-NO      | Nora   | 2021-11-20         | 2021         | 4.5              | 42000.0       |
| EMP-001-RO      | Rosa   | 2022-05-01         | 2022         | 4.1              | 38400.0       |
| EMP-002-PA      | Pablo  | 2023-03-15         | 2023         | 3.2              | 33600.0       |
+-----------------+--------+--------------------+--------------+------------------+---------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
- CONCATENACIÓN CON `NULL`:
  En SQL estándar y SQLite, `'Hola ' || NULL` devuelve `NULL` (el `NULL`
  contamina toda la cadena). Si concatenas columnas opcionales como `telefono`
  o `correo`, envuélvelas siempre con `COALESCE(correo, 'Sin correo')`.
- ÍNDICES EN COLUMNAS CON FUNCIONES (Consultas No-SARGables):
  Si tienes un índice en `pedidos(fecha)` y filtras con:
  `WHERE strftime('%Y', fecha) = '2026'`
  el motor NO podrá usar el índice normal porque debe aplicar la función fila
  por fila (Full Scan). En su lugar, filtra por rangos directos:
  `WHERE fecha >= '2026-01-01' AND fecha < '2027-01-01'`.
- FORMATO DE FECHAS INVÁLIDO:
  SQLite exige estrictamente dos dígitos para meses y días (`'2026-02-03'`).
  Si guardas `'2026-2-3'` o `'03/02/2026'`, las funciones `date()` y `strftime()`
  devolverán `NULL` y el ordenamiento con `ORDER BY fecha` fallará.
- `MAX(a, b)` vs `MAX(columna)`:
  En SQLite, `MAX(col)` con 1 argumento es función de agregación (colapsa filas);
  `MAX(col1, col2)` con 2 o más argumentos es función escalar (equivale a
  `GREATEST()` en otros motores y devuelve el mayor por cada fila).

6. EJERCICIOS PROGRESIVOS (10 Retos: [Básico] 1-3, [Intermedio] 4-7, [Senior / Producción] 8-10)
--------------------------------------------------------------------------------
[Básico]
1. Formateo de texto: Muestra el `id`, el nombre completo en mayúsculas
   (`UPPER(nombre || ' ' || apellido)`) y la longitud total del nombre
   (`LENGTH(nombre)`) de todos los registros en `clientes`.
2. Extracción de prefijos y reemplazos: De la tabla `productos`, muestra el
   `nombre`, los primeros 4 caracteres en mayúsculas como `codigo_corto` usando
   `SUBSTR`, y la `descripcion` reemplazando la palabra `'practica'` por
   `'profesional'` con `REPLACE`.
3. Redondeo y diferencias numéricas: Consulta `detalle_pedido` mostrando
   `pedido_id`, `producto_id`, `cantidad * precio_unitario` redondeado a 2
   decimales con `ROUND`, y la diferencia absoluta (`ABS`) entre `precio_unitario`
   y `10.00`.

[Intermedio]
4. Etiquetas seguras ante `NULL`: Construye una columna `ficha_contacto` en
   `clientes` con el formato: `'Ana Perez (Bogota) - Correo: ana@example.test'`.
   Si el cliente no tiene correo (`NULL`), debe mostrar `'Sin correo registrado'`
   sin que toda la cadena se vuelva `NULL`.
5. Agrupación mensual con `strftime`: Agrupa la tabla `pedidos` por año-mes
   (`strftime('%Y-%m', fecha)`) y calcula cuántos pedidos hubo y la suma de
   `total` en cada mes.
6. Cálculo de vencimientos y diferencias de días: Para cada pedido en `pedidos`,
   muestra su `fecha`, la `fecha_vencimiento_garantia` sumándole `'+30 days'`
   con `date()`, y cuántos días transcurrieron entre `'2026-01-01'` y la fecha
   del pedido usando `julianday()`.
7. Extracción de usuario y dominio de correo: De la tabla `estudiantes`, usa
   `SUBSTR` e `INSTR(correo, '@')` para separar el `correo` en dos columnas
   calculadas: `usuario_email` (antes del `@`) y `dominio_email` (después del `@`).

[Senior / Producción]
8. Enmascaramiento de datos sensibles (PII Masking): Crea una consulta sobre
   `estudiantes` o `clientes` que ofusque el correo electrónico por privacidad
   mostrando solo los 2 primeros caracteres del usuario, seguidos de `'***'`,
   y luego el dominio completo desde el `@` (ej. `'sa***@example.test'`).
9. Optimización SARGable de filtros de fecha: Escribe dos consultas que
   obtengan los pedidos de febrero de 2026:
   - La primera usando `WHERE strftime('%Y-%m', fecha) = '2026-02'`.
   - La segunda usando un rango de fechas (`>=` y `<`) que permita aprovechar
     un índice sobre `fecha`. Explica en un comentario por qué la segunda es
     la práctica estándar en producción.
10. Reporte de antigüedad y aniversario laboral: Sobre `empleados`, muestra el
    `nombre`, `fecha_contratacion`, años completos trabajados al día `'2026-12-31'`,
    y calcula la fecha exacta de su próximo aniversario laboral en el año `2026`
    usando `'2026-' || strftime('%m-%d', fecha_contratacion)`.
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
