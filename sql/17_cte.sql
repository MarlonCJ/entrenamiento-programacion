/*
================================================================================
TEMA 17: EXPRESIONES DE TABLA COMÚN (CTE CON WITH Y CTE RECURSIVAS)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Una CTE (Common Table Expression), declarada mediante la cláusula `WITH`, es un
conjunto de resultados temporal con nombre que existe únicamente durante la
ejecución de una sola sentencia SQL (`SELECT`, `INSERT`, `UPDATE` o `DELETE`).

Modelo mental: si las subconsultas anidadas son como meter funciones dentro de
funciones (`f(g(h(x)))`) que se leen de adentro hacia afuera, las CTE son como
declarar variables o funciones limpias paso a paso (`paso_1`, luego `paso_2` que
usa `paso_1`, y finalmente la consulta principal) que se leen de arriba hacia
abajo como una tubería de datos (pipeline).

Además, con `WITH RECURSIVE`, una CTE puede referenciarse a sí misma, lo que
convierte a SQL en un lenguaje capaz de generar series (fechas, números) y
recorrer estructuras jerárquicas o grafos (árboles de categorías, organigramas
de jefes y subordinados, listas de materiales BOM).

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
- Reportes analíticos multi-etapa: calcular primero las ventas netas por
  cliente, en un segundo paso clasificar a los clientes en segmentos (VIP,
  Regular, Nuevo) y en la consulta final calcular métricas por segmento.
- Reutilizar una misma subconsulta varias veces en la misma consulta (ej. comparar
  las ventas de cada mes contra el promedio mensual de ventas sin duplicar el
  código de agregación).
- Jerarquías con `WITH RECURSIVE`: categorías y subcategorías infinitas en un
  e-commerce, comentarios anidados o estructura organizacional de empleados.
- Rellenar huecos en series temporales (Date Spine): generar todos los días de
  un mes con una CTE recursiva y hacer `LEFT JOIN` con `pedidos` para que los
  días con 0 ventas aparezcan en el gráfico con `0` en lugar de omitirse.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) CTE Simple y Múltiples CTEs encadenadas (separadas por coma):
WITH ventas_por_cliente AS (
    SELECT
        cliente_id,
        COUNT(*) AS num_pedidos,
        SUM(total) AS gasto_total
    FROM pedidos
    WHERE estado != 'cancelado'
    GROUP BY cliente_id
),
clientes_destacados AS (
    SELECT cliente_id, num_pedidos, gasto_total
    FROM ventas_por_cliente
    WHERE gasto_total >= 15.00
)
SELECT
    c.nombre,
    c.apellido,
    cd.num_pedidos,
    cd.gasto_total
FROM clientes_destacados cd
INNER JOIN clientes c ON c.id = cd.cliente_id;

-- B) CTE Recursiva (Estructura: Caso Base + UNION ALL + Paso Recursivo):
WITH RECURSIVE contador(n) AS (
    -- 1. Miembro Ancla (Caso base)
    SELECT 1
    UNION ALL
    -- 2. Miembro Recursivo (se ejecuta hasta que no devuelva filas)
    SELECT n + 1
    FROM contador
    WHERE n < 5
)
SELECT n FROM contador;

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con resultado esperado)
--------------------------------------------------------------------------------
Escenario: El equipo de BI necesita un reporte de rendimiento académico que:
1. Calcule el promedio de nota de cada curso (`promedios_curso`).
2. Calcule el promedio general de cada estudiante (`promedios_estudiante`).
3. Muestre cada calificación del estudiante comparándola con el promedio del
   curso en que la obtuvo.

Consulta paso a paso:
WITH promedios_curso AS (
    SELECT
        curso_id,
        ROUND(AVG(nota), 2) AS nota_media_curso
    FROM resultados
    GROUP BY curso_id
),
detalle_estudiantes AS (
    SELECT
        e.id AS estudiante_id,
        e.nombre || ' ' || e.apellido AS estudiante,
        r.curso_id,
        r.nota
    FROM resultados r
    INNER JOIN estudiantes e ON e.id = r.estudiante_id
)
SELECT
    de.estudiante,
    c.nombre AS curso,
    de.nota,
    pc.nota_media_curso,
    ROUND(de.nota - pc.nota_media_curso, 2) AS diferencia_vs_curso
FROM detalle_estudiantes de
INNER JOIN cursos c ON c.id = de.curso_id
INNER JOIN promedios_curso pc ON pc.curso_id = de.curso_id
ORDER BY de.curso_id, de.nota DESC;

Resultado esperado (con los datos de `00_base_practica.sql`):
+------------+------------------------+------+------------------+---------------------+
| estudiante | curso                  | nota | nota_media_curso | diferencia_vs_curso |
+------------+------------------------+------+------------------+---------------------+
| Sara Lopez | Fundamentos SQL        | 88.0 | 72.67            | 15.33               |
| Diego Ruiz | Fundamentos SQL        | 72.0 | 72.67            | -0.67               |
| Elena Diaz | Fundamentos SQL        | 58.0 | 72.67            | -14.67              |
| Diego Ruiz | Logica de programacion | 95.0 | 95.0             | 0.0                 |
+------------+------------------------+------+------------------+---------------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
- ERROR DE SINTAXIS COMÚN: Escribir `WITH` varias veces en la misma consulta.
  La palabra clave `WITH` se escribe UNA SOLA VEZ al principio; la segunda y
  siguientes CTEs se separan únicamente con una coma (`, nombre_cte_2 AS (...)`).
- BUCLE INFINITO EN `WITH RECURSIVE`:
  Si olvidas la condición de parada (`WHERE n < 100` o un límite de profundidad
  `WHERE nivel < 20`), la CTE recursiva ciclará infinitamente hasta agotar la
  memoria o el tiempo de ejecución. Como red de seguridad en producción, añade
  siempre un control de profundidad o un `LIMIT` defensivo.
- `UNION ALL` vs `UNION` en recursividad:
  Usa `UNION ALL` en CTEs recursivas salvo que tengas ciclos en un grafo y
  necesites eliminar duplicados. `UNION ALL` es mucho más rápido porque no
  ordena ni deduplica en cada iteración.
- Materialización (`MATERIALIZED` vs `NOT MATERIALIZED` en SQLite 3.35+):
  Por defecto, el optimizador de SQLite puede "aplanar" (inlinear) una CTE
  dentro de la consulta principal para usar índices, o materializarla en una
  tabla temporal si se referencia múltiples veces. Si una CTE es muy costosa y
  se consulta varias veces, puedes forzar `WITH nombre AS MATERIALIZED (...)`.

6. EJERCICIOS PROGRESIVOS (10 Retos: [Básico] 1-3, [Intermedio] 4-7, [Senior / Producción] 8-10)
--------------------------------------------------------------------------------
[Básico]
1. Resumen de ventas en CTE: Crea una CTE llamada `resumen_clientes` que calcule
   el total gastado (`SUM(total)`) y la cantidad de pedidos (`COUNT(*)`) por
   `cliente_id`. En la consulta principal, filtra aquellos con gasto total
   mayor a 15.
2. Inventario crítico: Crea una CTE llamada `productos_bajo_stock` que seleccione
   los productos activos (`activo = 1`) con `existencias < 10`. Consúltala
   uniéndola con `categorias` para mostrar el nombre de la categoría, el
   producto y sus existencias.
3. Aprobados en dos pasos: Declara una CTE `notas_con_estado` que proyecte
   `estudiante_id`, `curso_id`, `nota` y una columna `aprobado` (1 si `nota >= 70`,
   0 en caso contrario). En la consulta principal, cuenta cuántos aprobados y
   reprobados hay por curso.

[Intermedio]
4. Múltiples CTEs encadenadas: Crea dos CTEs en una sola sentencia:
   - `ingresos_producto`: calcula unidades vendidas e ingreso bruto
     (`SUM(cantidad * precio_unitario)`) por `producto_id` desde `detalle_pedido`.
   - `catalogo_completo`: une `productos` con `categorias`.
   En el `SELECT` final, combina ambas con `LEFT JOIN` para mostrar incluso los
   productos con 0 ventas (usa `COALESCE`).
5. Refactorización de subconsulta a CTE: Toma una consulta que busque los
   empleados cuyo salario supera el promedio de su departamento y escríbela
   usando una CTE `promedio_por_departamento` seguida de un `INNER JOIN` con
   `empleados`.
6. CTE Recursiva numérica: Usa `WITH RECURSIVE` para generar una tabla con los
   números del 1 al 10, junto con su cuadrado (`n * n`) y su paridad (`'Par'`
   o `'Impar'`).
7. Generador de calendario (Date Spine): Usa `WITH RECURSIVE` y la función
   `date(fecha, '+1 day')` para generar todas las fechas desde `'2026-01-10'`
   hasta `'2026-01-20'`. Haz un `LEFT JOIN` con `matriculas` (o `pedidos`) para
   contar cuántos registros hubo cada día, mostrando `0` en los días sin actividad.

[Senior / Producción]
8. Jerarquía recursiva (Árbol de categorías / Organigrama): Usando una CTE
   recursiva (puedes simular los datos base dentro de una primera CTE con
   `VALUES` para una jerarquía `(id, nombre, padre_id)`: ej. `(1, 'Tecnologia', NULL)`,
   `(2, 'Computadoras', 1)`, `(3, 'Laptops', 2)`, `(4, 'Gaming', 3)`), construye
   la ruta completa (`'Tecnologia > Computadoras > Laptops > Gaming'`) y el
   `nivel` de profundidad de cada nodo.
9. Análisis Pareto / Contribución porcentual con CTE: Mediante CTEs, calcula
   el ingreso generado por cada producto en `detalle_pedido` y el ingreso total
   global de toda la tienda. Devuelve cada producto con su ingreso y el
   porcentaje exacto que representa sobre el total global de ingresos.
10. Pipeline ejecutivo de auditoría comercial: Construye un reporte con 3 CTEs
    bien nombradas (`metricas_pedidos`, `metricas_detalle`, `auditoria_clientes`)
    que muestre por cada cliente: total de pedidos, pedidos pagados vs cancelados,
    unidades totales de productos compradas y ticket promedio.
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
