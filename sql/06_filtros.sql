/*
================================================================================
TEMA 06: FILTRADO DE FILAS CON WHERE, IN, BETWEEN Y LIKE
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
La cláusula `WHERE` actúa como un filtro horizontal (selección relacional) que
evalúa un predicado lógico sobre cada fila de la tabla origen. Solo aquellas
filas donde la condición evalúa a `TRUE` pasan a la siguiente etapa; las que
evalúan a `FALSE` o `UNKNOWN` (`NULL`) quedan descartadas.

Orden de ejecución lógico en el motor:
  `FROM` (localiza la tabla) -> `WHERE` (descarta filas que no cumplen) -> `SELECT` (proyecta columnas).

Herramientas de filtrado expresivo:
  - `IN (v1, v2, ...)`: Comprueba si un valor pertenece a un conjunto discreto
    de opciones (reemplaza cadenas largas de `OR`).
  - `BETWEEN min AND max`: Comprueba si un valor se encuentra en un rango cerrado
    INCLUSIVO (`valor >= min AND valor <= max`).
  - `LIKE 'patron'`: Busca coincidencias de patrones en texto usando comodines:
      * `%` : Coincide con cero, uno o muchos caracteres cualesquiera.
      * `_` : Coincide exactamente con UN (1) solo carácter en esa posición.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Buscadores y Autocompletado (Search Bars): Cuando el usuario escribe `'lap'`
    en el buscador de una tienda y ejecutas `WHERE nombre LIKE '%lap%'` o
    `WHERE nombre LIKE 'lap%'`.
  - Filtros de Rango de Precios o Fechas en E-Commerce: Filtrar productos entre
    `$5.00` y `$20.00` (`WHERE precio BETWEEN 5 AND 20`) o pedidos del mes de
    febrero (`WHERE fecha BETWEEN '2026-02-01' AND '2026-02-28'`).
  - Filtros de Selección Múltiple (Checkboxes en UI): Mostrar pedidos cuyos
    estados sean `'pendiente'` o `'pagado'` (`WHERE estado IN ('pendiente', 'pagado')`).

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Rango inclusivo con BETWEEN (incluye ambos extremos: 4.50 y 20.00)
SELECT nombre, precio
FROM productos
WHERE precio BETWEEN 4.50 AND 20.00;

-- B) Pertenencia a lista con IN y exclusión con NOT IN
SELECT id, cliente_id, estado, total
FROM pedidos
WHERE estado IN ('pendiente', 'pagado');

-- C) Patrones de texto con LIKE (% y _)
SELECT nombre, correo FROM clientes WHERE nombre LIKE 'A%';       -- Empieza con 'A'
SELECT nombre, correo FROM clientes WHERE correo LIKE '%.test';   -- Termina en '.test'
SELECT nombre, correo FROM clientes WHERE nombre LIKE '_ia';      -- 3 letras, termina en 'ia'

-- D) GLOB en SQLite (Sensible a mayúsculas/minúsculas usando sintaxis Unix * y ?)
SELECT nombre FROM clientes WHERE nombre GLOB 'A*';

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: El área de logística necesita ver los productos cuyo precio esté
entre `$1.00` y `$18.00` (inclusive) que pertenezcan a las categorías `1` (Libros)
o `2` (Papelería).
*/
-- SELECT id, nombre, precio, categoria_id, existencias
-- FROM productos
-- WHERE precio BETWEEN 1.00 AND 18.00
--   AND categoria_id IN (1, 2);
/*
Resultado esperado:
+----+------------------------+--------+--------------+-------------+
| id | nombre                 | precio | categoria_id | existencias |
+----+------------------------+--------+--------------+-------------+
| 1  | Cuaderno               | 4.5    | 2            | 20          |
| 2  | Lapiz                  | 1.25   | 2            | 100         |
| 3  | SQL para principiantes | 18.0   | 1            | 8           |
+----+------------------------+--------+--------------+-------------+
Nota cómo 'SQL para principiantes' (`18.0`) entra en el resultado porque
`BETWEEN` es inclusivo en ambos límites (`>= 1.00` y `<= 18.00`).

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - RENDIMIENTO E ÍNDICES CON `LIKE`:
      * `LIKE 'Ana%'` (comodín al final) PUEDE usar un índice B-Tree para buscar
        rápidamente por prefijo.
      * `LIKE '%Ana%'` (comodín al inicio) NO puede usar un índice normal y fuerza
        un escaneo completo de la tabla (`Full Table Scan`). En tablas con millones
        de textos, usa búsqueda de texto completo (SQLite `FTS5`).
  - GOTCHA MORTAL DE `NOT IN` CON `NULL`:
    `WHERE id NOT IN (1, 2, NULL)` ¡devolverá CERO filas siempre! Porque equivale a
    `id != 1 AND id != 2 AND id != NULL`, y como `id != NULL` es `UNKNOWN`, toda la
    expresión `AND` colapsa a `UNKNOWN`. Asegúrate siempre de que la lista o
    subconsulta dentro de `NOT IN` no contenga valores `NULL`.
  - GOTCHA DEL ORDEN EN `BETWEEN`: Siempre coloca el valor menor primero y el mayor
    después (`BETWEEN 5 AND 20`). Si escribes `BETWEEN 20 AND 5`, SQL buscará
    `precio >= 20 AND precio <= 5`, lo cual es imposible y devolverá 0 filas sin
    dar error.
  - SENSIBILIDAD A MAYÚSCULAS EN SQLITE: Por defecto, `LIKE` en SQLite es
    case-insensitive para caracteres ASCII (`'a' LIKE 'A'` es verdadero), pero
    case-sensitive para caracteres con tilde (`'á' LIKE 'Á'`).

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Filtra los productos cuyo precio esté entre `4.00` y `20.00` usando `BETWEEN`.
2. Consulta los pedidos cuyo `estado` esté dentro de la lista `('pagado', 'cancelado')`
   usando el operador `IN`.
3. Encuentra todos los clientes cuyo `nombre` comience por la letra `'A'` o `'M'`
   (haz una consulta con `LIKE 'A%'` y otra probando `LIKE`).

[Intermedio]
4. Busca los estudiantes cuyo `correo` termine en `'@example.test'` usando `LIKE`.
5. Filtra los clientes cuyo `nombre` tenga exactamente 3 letras y la segunda letra
   sea una `'n'` o una `'i'` utilizando el comodín de carácter único `_`.
6. Muestra los productos que NO pertenezcan a la categoría `3` (Electrónica) usando
   `NOT IN (3)` y verifica que su precio esté entre `1` y `10`.
7. Consulta los pedidos realizados durante el mes de febrero de 2026 utilizando
   `WHERE fecha BETWEEN '2026-02-01' AND '2026-02-28'`, y luego logra el mismo
   resultado usando `WHERE fecha LIKE '2026-02-%'`.

[Senior / Producción]
8. Demuestra el gotcha de `BETWEEN` con timestamps: explica en un comentario qué
   ocurriría con un pedido con fecha `'2026-02-28 14:30:00'` si filtras con
   `WHERE fecha BETWEEN '2026-02-01' AND '2026-02-28'`, y por qué en producción
   para fechas con hora se prefiere `fecha >= '2026-02-01' AND fecha < '2026-03-01'`.
9. Comprueba experimentalmente la trampa de `NOT IN` con `NULL`: ejecuta
   `SELECT id, nombre FROM clientes WHERE id NOT IN (1, 2);` y luego compáralo con
   `SELECT id, nombre FROM clientes WHERE id NOT IN (1, 2, NULL);`. Documenta el
   comportamiento observado.
10. Escribe una consulta de búsqueda de catálogo para producción sobre `productos`
    que encuentre artículos activos (`activo = 1`), con stock disponible (`existencias > 0`),
    cuyo nombre o descripción contenga la palabra `'practica'` o `'datos'` (usando `LIKE`),
    y cuyo precio esté entre `1.00` y `30.00`.
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
