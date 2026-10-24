/*
================================================================================
TEMA 20: ÍNDICES Y PLANES DE CONSULTA (B-TREES Y EXPLAIN QUERY PLAN)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Un índice es una estructura de datos auxiliar (en SQLite y la mayoría de motores
relacionales, un Árbol Balanceado o **B-Tree**) que almacena los valores de una
o más columnas ordenados junto con el puntero (`rowid` o clave primaria) a la
fila completa en la tabla.

Modelo mental:
- Sin índice (**Full Table Scan** / `SCAN`): encontrar un cliente por su correo
  en una tabla de 1,000,000 de filas es como buscar un tema en un libro de 1,000
  páginas sin índice al final: el motor debe leer página por página de principio
  a fin (complejidad lineal $O(N)$).
- Con índice (**Index Search** / `SEARCH`): el motor navega el árbol B-Tree en
  pocos saltos logarítmicos (complejidad $O(\log N)$, ~20 comparaciones para
  1 millón de filas) y salta directo a la fila exacta.
- El costo (Trade-off): un índice NO es gratis. Ocupa espacio en disco y hace
  que cada `INSERT`, `UPDATE` y `DELETE` en la tabla sea más lento, porque el
  motor debe actualizar tanto la tabla como todos sus árboles de índices.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
- En todas las Claves Foráneas (`FOREIGN KEY`): SQLite crea índices automáticos
  para `PRIMARY KEY` y `UNIQUE`, pero **NO crea índices automáticos para las
  claves foráneas** (`cliente_id`, `categoria_id`, `pedido_id`). Sin ellos, los
  `JOIN` y las verificaciones al borrar filas padre hacen escaneos completos.
- Columnas usadas frecuentemente en filtros `WHERE` de alta selectividad (ej.
  documento, código de rastreo, fecha de pedido, estado + fecha).
- Columnas usadas en `ORDER BY` y `GROUP BY` para evitar costosos ordenamientos
  temporales en memoria/disco (`USE TEMP B-TREE FOR ORDER BY`).

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Crear un índice simple en una clave foránea:
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id
ON pedidos(cliente_id);

-- B) Crear un índice compuesto (múltiples columnas, el orden importa):
CREATE INDEX IF NOT EXISTS idx_pedidos_estado_fecha
ON pedidos(estado, fecha);

-- C) Crear un índice único (garantiza integridad + acelera búsquedas):
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_telefono_unico
ON clientes(telefono);

-- D) Crear un índice parcial (solo indexa un subconjunto de filas en SQLite):
CREATE INDEX IF NOT EXISTS idx_pedidos_pendientes
ON pedidos(fecha)
WHERE estado = 'pendiente';

-- E) Analizar el plan de ejecución de una consulta:
EXPLAIN QUERY PLAN
SELECT * FROM pedidos WHERE cliente_id = 1;

-- F) Eliminar un índice y listar índices de una tabla:
DROP INDEX IF EXISTS idx_pedidos_cliente_id;
PRAGMA index_list('pedidos');
PRAGMA index_info('idx_pedidos_estado_fecha');

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con resultado esperado)
--------------------------------------------------------------------------------
Escenario: La consulta que busca los pedidos de un cliente específico y los
ordena por fecha está haciendo un escaneo completo de la tabla `pedidos` y un
ordenamiento temporal. Vamos a diagnosticarla y optimizarla.

Paso 1: Inspeccionar el plan ANTES de crear el índice:
EXPLAIN QUERY PLAN
SELECT id, fecha, total
FROM pedidos
WHERE cliente_id = 1
ORDER BY fecha DESC;

Resultado esperado ANTES del índice:
`SCAN pedidos`
`USE TEMP B-TREE FOR ORDER BY`
(Recorre toda la tabla `pedidos` fila por fila y luego ordena en memoria).

Paso 2: Crear un índice compuesto en `(cliente_id, fecha)`:
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_fecha
ON pedidos(cliente_id, fecha);

Paso 3: Inspeccionar el plan DESPUÉS de crear el índice:
EXPLAIN QUERY PLAN
SELECT id, fecha, total
FROM pedidos
WHERE cliente_id = 1
ORDER BY fecha DESC;

Resultado esperado DESPUÉS del índice:
`SEARCH pedidos USING INDEX idx_pedidos_cliente_fecha (cliente_id=?)`
(Hace búsqueda directa en el árbol B-Tree y lee las filas ya ordenadas por
`fecha`, eliminando también el `TEMP B-TREE FOR ORDER BY`).

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
- REGLA DEL PREFIJO IZQUIERDO (Leftmost Prefix Rule):
  Un índice compuesto en `(estado, fecha)` sirve para filtrar por `estado` solo,
  o por `estado` Y `fecha` juntos. Pero **NO sirve** si tu consulta filtra
  únicamente por `WHERE fecha = '2026-01-15'` sin mencionar `estado` (igual que
  una guía telefónica ordenada por Apellido y Nombre no te ayuda si solo conoces
  el Nombre).
- BAJA CARDINALIDAD (Selectividad pobre):
  Un índice simple sobre una columna booleana como `activo` (solo valores `0` y
  `1` repartidos 50%/50%) rara vez es útil por sí solo; es más rápido leer la
  tabla secuencialmente que saltar miles de veces del índice a la tabla. En
  cambio, un **índice parcial** (`WHERE activo = 1`) o un índice compuesto sí
  aportan gran valor.
- NO DUPLIQUES ÍNDICES DE `PRIMARY KEY` O `UNIQUE`:
  En `productos`, la columna `nombre` ya tiene la restricción `UNIQUE`. Crear
  un `CREATE INDEX idx_prod_nombre ON productos(nombre)` es redundante y
  desperdicia memoria y velocidad de escritura.
- `LIKE` CON COMODÍN AL INICIO:
  `WHERE nombre LIKE '%libro%'` NO puede usar un índice B-Tree normal porque
  el prefijo es desconocido (provoca `SCAN`).

6. EJERCICIOS PROGRESIVOS (10 Retos: [Básico] 1-3, [Intermedio] 4-7, [Senior / Producción] 8-10)
--------------------------------------------------------------------------------
[Básico]
1. Diagnóstico inicial con `EXPLAIN QUERY PLAN`: Ejecuta `EXPLAIN QUERY PLAN`
   sobre la consulta `SELECT * FROM empleados WHERE departamento_id = 1;`.
   Observa y anota en un comentario si el motor realiza `SCAN` o `SEARCH`.
2. Índice en clave foránea: Crea el índice `idx_empleados_departamento_id` sobre
   `empleados(departamento_id)`. Vuelve a ejecutar el `EXPLAIN QUERY PLAN` del
   ejercicio 1 y comprueba cómo cambia el plan a `SEARCH ... USING INDEX`.
3. Inspección y limpieza: Usa `PRAGMA index_list('productos');` para identificar
   qué índices automáticos creó SQLite por las restricciones `UNIQUE`, y luego
   practica eliminar y recrear un índice sobre `productos(categoria_id)`.

[Intermedio]
4. Optimización de `JOIN`: Ejecuta `EXPLAIN QUERY PLAN` para un `INNER JOIN`
   entre `clientes` y `pedidos` filtrando por `clientes.ciudad = 'Bogota'`. Crea
   los índices apropiados en `clientes(ciudad)` y `pedidos(cliente_id)` y
   compara el plan antes y después.
5. Índice compuesto y orden de columnas: Crea un índice compuesto
   `idx_pedidos_estado_fecha` en `pedidos(estado, fecha)`. Prueba con
   `EXPLAIN QUERY PLAN` tres consultas:
   a) `WHERE estado = 'pagado' AND fecha >= '2026-01-01'`
   b) `WHERE estado = 'pagado'`
   c) `WHERE fecha = '2026-01-15'`
   Explica por qué la consulta (c) no aprovecha la búsqueda en el índice.
6. Auditoría previa a un `UNIQUE INDEX`: Antes de crear un índice `UNIQUE` sobre
   una columna existente en producción (ej. `clientes(ciudad)`), debes verificar
   si hay valores duplicados que harían fallar la creación. Escribe la consulta
   con `GROUP BY` y `HAVING COUNT(*) > 1` que detecta duplicados en `ciudad`.
7. Índice parcial en SQLite: Crea un índice parcial `idx_productos_activos_precio`
   sobre `productos(precio)` que solo indexe las filas donde `activo = 1`.
   Verifica con `EXPLAIN QUERY PLAN` que una consulta con `WHERE activo = 1 AND precio < 10`
   utiliza dicho índice.

[Senior / Producción]
8. Covering Index (Índice Cubriente): Si ejecutas `SELECT cliente_id, total FROM pedidos WHERE cliente_id = 1;`
   y creas un índice en `pedidos(cliente_id, total)`, observa en `EXPLAIN QUERY PLAN`
   el mensaje `USING COVERING INDEX`. Explica por qué un índice cubriente evita
   incluso tener que ir a leer la tabla principal.
9. Análisis de costo de escritura vs lectura: Una tabla de `logs_eventos` recibe
   5,000 `INSERT` por segundo y solo se consulta una vez al día filtrando por
   `fecha`. Un desarrollador propone crear 8 índices en sus 8 columnas "por si
   acaso". Redacta en comentarios y ejemplos SQL qué impacto tendría eso en la
   latencia de inserción y cuál sería la estrategia correcta de indexado.
10. Diseño integral de índices para el esquema de práctica: Revisa todas las
    tablas de `00_base_practica.sql` y escribe el script completo de creación
    de índices (`CREATE INDEX IF NOT EXISTS ...`) que dejaría la base de datos
    lista para producción cubriendo sus claves foráneas y búsquedas críticas.
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
