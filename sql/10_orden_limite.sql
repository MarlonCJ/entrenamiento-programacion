/*
================================================================================
TEMA 10: ORDENAMIENTO (ORDER BY) Y PAGINACIÓN (LIMIT, OFFSET)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
En el modelo relacional, una tabla es un conjunto matemático de tuplas: NO tiene
un orden intrínseco garantizado. Si ejecutas `SELECT * FROM productos` sin
especificar un criterio de ordenamiento, el motor devuelve las filas en el orden
en que las encuentra en las páginas del disco o del índice.

- `ORDER BY`: Instruye al motor para ordenar el conjunto de resultados final
  según una o varias columnas o expresiones (`ASC` ascendente por defecto, o
  `DESC` descendente). También permite controlar dónde ubicar los valores nulos
  mediante `NULLS FIRST` o `NULLS LAST`.
- `LIMIT` y `OFFSET`: Permiten restringir cuántas filas se retornan (`LIMIT n`)
  y cuántas filas iniciales se omiten (`OFFSET m`), siendo la base de los
  rankings ("Top N") y de la paginación en APIs y aplicaciones web.
- Orden lógico de ejecución en SQL:
  `FROM` -> `WHERE` -> `GROUP BY` -> `HAVING` -> `SELECT` -> `ORDER BY` -> `LIMIT/OFFSET`.
  Como `ORDER BY` se ejecuta DESPUÉS de `SELECT`, puedes ordenar usando los
  alias definidos en el `SELECT`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Rankings y Dashboards Ejecutivos: Mostrar los 5 productos más caros, los 10
    clientes con compras más recientes o los 3 empleados con mayor salario.
  - Paginación en APIs REST / GraphQL: Entregar catálogos de productos en
    páginas de 20 en 20 (`LIMIT 20 OFFSET 0`, `LIMIT 20 OFFSET 20`, etc.).
  - Desempate Determinista (Tie-Breaking): Cuando dos productos tienen el mismo
    precio o dos pedidos la misma fecha, agregar `id ASC` como segundo criterio
    en `ORDER BY` garantiza que las páginas nunca dupliquen ni omitan registros.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Ordenamiento simple y múltiple (con criterio de desempate determinista)
SELECT id, nombre, precio, existencias
FROM productos
ORDER BY precio DESC, id ASC;

-- B) Control explícito de valores NULL al ordenar (SQLite 3.30+ / PostgreSQL)
SELECT id, nombre, telefono
FROM clientes
ORDER BY telefono ASC NULLS LAST;

-- C) Top N registros y paginación con LIMIT y OFFSET
-- Página 1 (primeros 2 registros):
SELECT id, nombre, precio FROM productos ORDER BY id ASC LIMIT 2 OFFSET 0;
-- Página 2 (siguientes 2 registros):
SELECT id, nombre, precio FROM productos ORDER BY id ASC LIMIT 2 OFFSET 2;

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: El equipo de E-Commerce necesita mostrar la "Página 1" del
catálogo de productos disponibles (`activo = 1`), ordenados desde el más
económico al más costoso, usando el `id` como desempate determinista y mostrando
máximo 3 productos por página.
*/
-- SELECT
--     id,
--     nombre,
--     precio,
--     existencias,
--     ROUND(precio * 1.19, 2) AS precio_con_iva
-- FROM productos
-- WHERE activo = 1
-- ORDER BY precio ASC, id ASC
-- LIMIT 3 OFFSET 0;
/*
Resultado esperado:
+----+------------------------+--------+-------------+----------------+
| id | nombre                 | precio | existencias | precio_con_iva |
+----+------------------------+--------+-------------+----------------+
| 2  | Lapiz                  | 1.25   | 100         | 1.49           |
| 1  | Cuaderno               | 4.5    | 20          | 5.36           |
| 3  | SQL para principiantes | 18.0   | 8           | 21.42          |
+----+------------------------+--------+-------------+----------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - NUNCA USES `LIMIT` SIN `ORDER BY`: `LIMIT 5` sin `ORDER BY` devuelve 5 filas
    arbitrarias que pueden cambiar tras un `VACUUM` o actualización.
  - SIEMPRE INCLUYE UNA COLUMNA ÚNICA DE DESEMPATE EN PAGINACIÓN: Si ordenas
    solo por `ORDER BY fecha DESC` o `ORDER BY categoria_id ASC` y hay empates,
    el motor puede mezclar filas entre la página 1 y la página 2. Añade siempre
    la clave primaria al final: `ORDER BY fecha DESC, id DESC`.
  - EVITA `ORDER BY 1, 2` (Posicional) EN PRODUCCIÓN: Ordenar por número de
    columna es frágil; si alguien añade una columna al `SELECT`, el ordenamiento
    cambia silenciosamente. Usa nombres de columna o alias explícitos.
  - COSTO DE `OFFSET` GRANDE: `LIMIT 20 OFFSET 100000` obliga al motor a leer y
    descartar 100,000 filas antes de entregar 20. En tablas millonarias se
    prefiere *Keyset Pagination* (`WHERE id > :ultimo_id ORDER BY id ASC LIMIT 20`).

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Lista todos los productos (`id`, `nombre`, `precio`) ordenados por `precio`
   de menor a mayor (`ASC`).
2. Lista todos los productos ordenados por `precio` de mayor a menor (`DESC`) y,
   en caso de empate, por `nombre` alfabéticamente (`ASC`).
3. Muestra todos los empleados (`id`, `nombre`, `salario`, `fecha_contratacion`)
   ordenados desde la contratación más reciente hasta la más antigua.

[Intermedio]
4. Obtén el "Top 2" de los productos con mayor cantidad de `existencias` en el
   inventario usando `ORDER BY` y `LIMIT`.
5. Simula la paginación de la tabla `productos` ordenada por `id ASC` con un
   tamaño de página de 2 elementos: escribe la consulta para la Página 1 y otra
   para la Página 2 usando `LIMIT` y `OFFSET`.
6. Lista las calificaciones de la tabla `resultados` ordenadas por `nota DESC`,
   mostrando únicamente los 3 mejores resultados.
7. Proyecta en `productos` el `nombre`, `precio`, `existencias` y el alias
   `valor_inventario` (`precio * existencias`), ordenando el resultado de mayor
   a menor según `valor_inventario`.

[Senior / Producción]
8. Ordenamiento con control de `NULL`: Lista los clientes ordenados por `correo`
   alfabéticamente, asegurándote de que los clientes sin correo (`NULL`)
   aparezcan siempre al final (`NULLS LAST`).
9. Ordenamiento personalizado por prioridad de negocio (`ORDER BY CASE`): Lista
   los registros de la tabla `pedidos` de modo que aparezcan primero los de
   estado `'pendiente'`, luego `'pagado'` y al final `'cancelado'`, desempatando
   por `fecha DESC`.
10. Paginación por cursor (*Keyset / Seek Pagination*): En lugar de usar
    `OFFSET 2`, escribe una consulta que obtenga los siguientes 2 productos
    después del producto con `id = 2` usando `WHERE id > 2 ORDER BY id ASC LIMIT 2`
    y explica en un comentario por qué escala mejor en tablas grandes.
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
