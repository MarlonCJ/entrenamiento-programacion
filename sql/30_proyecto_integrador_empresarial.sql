/*
================================================================================
TEMA 30: PROYECTO INTEGRADOR EMPRESARIAL (ARQUITECTURA Y ANALÍTICA DE DATOS)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Visión Integral de Ingeniería de Datos y Backend)
--------------------------------------------------------------------------------
¡Felicidades por llegar al tema final de la ruta especializada de SQL! En el
mundo profesional, un ingeniero Senior no utiliza `JOIN`, `CTE`, `Window Functions`,
`Triggers`, `JSON`, `Transacciones` o `Índices` de forma aislada: los combina en
una arquitectura cohesiva que garantiza **integridad absoluta**, **observabilidad
financiera** y **rendimiento en milisegundos**.

En este Proyecto Integrador Empresarial pondrás a prueba todos los bloques de
los temas 01 al 29 resolviendo un caso de estudio de extremo a extremo sobre la
base de datos de práctica (`E-Commerce`, `Académico` y `RRHH`).

2. ARQUITECTURA DEL SISTEMA EMPRESARIAL A CONSTRUIR / ANALIZAR
--------------------------------------------------------------------------------
El reto integrador se divide en 4 capas profesionales:
1. **Capa de Gobernanza e Integridad (DDL, Índices y Triggers)**:
   Asegurar que los cambios de precios e inventario queden auditados, que los
   estados de los pedidos sigan reglas de negocio estrictas y que las consultas
   críticas cuenten con índices cubrientes.
2. **Capa Transaccional (DML, ACID, UPSERT y Savepoints)**:
   Ejecutar flujos completos de compra (Checkout), reabastecimiento idempotente y
   ajustes de nómina sin condiciones de carrera ni datos huérfanos.
3. **Capa de Inteligencia de Negocio (CTEs, Window Functions y Agregación Condicional)**:
   Construir reportes ejecutivos de ventas, retención, clasificación ABC de
   inventario, brechas salariales y ranking académico.
4. **Capa de Exposición para APIs (Vistas y Payloads JSON)**:
   Entregar contratos de datos limpios y documentos JSON anidados listos para ser
   consumidos por un backend o frontend moderno.

3. MAPA DE HERRAMIENTAS QUE INTEGRARÁS EN ESTE PROYECTO
--------------------------------------------------------------------------------
-- 1. CTEs Encadenadas (WITH paso_1 AS (...), paso_2 AS (...))
-- 2. Funciones de Ventana (SUM() OVER, DENSE_RANK() OVER, LAG() OVER, NTILE())
-- 3. Agregación Condicional (SUM(CASE WHEN ... THEN ... ELSE 0 END))
-- 4. Integridad y Automatización (CREATE TRIGGER ... BEFORE/AFTER ... RAISE)
-- 5. Serialización para APIs (json_object, json_group_array)
-- 6. Verificación de Rendimiento (CREATE INDEX ... EXPLAIN QUERY PLAN)

4. EJEMPLO INTEGRADOR DE REFERENCIA (Pipeline Analítico Completo)
--------------------------------------------------------------------------------
Caso Ejecutivo: La Junta Directiva solicita un cuadro de mando por Categoría que
combine métricas de catálogo, rotación histórica de ventas (unidades vendidas e
ingresos reales en `detalle_pedido`), valor del stock actual en bodega, peso
porcentual sobre el inventario de toda la empresa y clasificación de prioridad.
*/
-- WITH ventas_por_producto AS (
--     SELECT
--         dp.producto_id,
--         SUM(dp.cantidad) AS unidades_vendidas,
--         ROUND(SUM(dp.cantidad * dp.precio_unitario), 2) AS ingresos_historicos
--     FROM detalle_pedido AS dp
--     INNER JOIN pedidos AS p ON p.id = dp.pedido_id
--     WHERE p.estado != 'cancelado'
--     GROUP BY dp.producto_id
-- ),
-- metricas_categoria AS (
--     SELECT
--         c.id AS categoria_id,
--         c.nombre AS categoria,
--         COUNT(pr.id) AS total_productos,
--         COALESCE(SUM(pr.existencias), 0) AS stock_actual,
--         ROUND(COALESCE(SUM(pr.precio * pr.existencias), 0), 2) AS valor_bodega,
--         COALESCE(SUM(vp.unidades_vendidas), 0) AS unidades_vendidas,
--         ROUND(COALESCE(SUM(vp.ingresos_historicos), 0), 2) AS ingresos_efectivos
--     FROM categorias AS c
--     LEFT JOIN productos AS pr ON pr.categoria_id = c.id
--     LEFT JOIN ventas_por_producto AS vp ON vp.producto_id = pr.id
--     GROUP BY c.id, c.nombre
-- )
-- SELECT
--     categoria,
--     total_productos,
--     stock_actual,
--     valor_bodega,
--     unidades_vendidas,
--     ingresos_efectivos,
--     ROUND(
--         100.0 * valor_bodega / NULLIF(SUM(valor_bodega) OVER (), 0),
--         2
--     ) AS pct_valor_bodega,
--     DENSE_RANK() OVER (ORDER BY ingresos_efectivos DESC) AS ranking_ingresos
-- FROM metricas_categoria
-- ORDER BY ranking_ingresos ASC, categoria ASC;
/*
Resultado esperado:
+-------------+-----------------+--------------+--------------+-------------------+--------------------+------------------+------------------+
| categoria   | total_productos | stock_actual | valor_bodega | unidades_vendidas | ingresos_efectivos | pct_valor_bodega | ranking_ingresos |
+-------------+-----------------+--------------+--------------+-------------------+--------------------+------------------+------------------+
| Libros      | 1               | 8            | 144.0        | 1                 | 18.0               | 40.11            | 1                |
| Papeleria   | 2               | 120          | 215.0        | 5                 | 10.0               | 59.89            | 2                |
| Electronica | 1               | 0            | 0.0          | 0                 | 0.0                | 0.0              | 3                |
+-------------+-----------------+--------------+--------------+-------------------+--------------------+------------------+------------------+

5. LISTA DE VERIFICACIÓN DE CALIDAD SENIOR (Checklist antes de Producción)
--------------------------------------------------------------------------------
  - [ ] ¿Todas las divisiones usan `NULLIF(divisor, 0)` para jamás fallar por cero?
  - [ ] ¿Todas las sumas y conteos en `LEFT JOIN` usan `COALESCE(..., 0)` y
        cuentan la clave primaria de la tabla derecha (`COUNT(derecha.id)`)?
  - [ ] ¿Las consultas complejas están divididas en CTEs (`WITH`) con nombres
        autodocumentados en lugar de subconsultas anidadas ilegibles?
  - [ ] ¿Las transacciones de escritura descuentan stock de forma atómica con
        guardas (`WHERE existencias >= :cantidad`)?
  - [ ] ¿Los reportes históricos de ventas calculan montos sobre órdenes no
        canceladas y respetan `detalle_pedido.precio_unitario`?

6. PROYECTO FINAL: 10 RETOS INTEGRADORES DE NIVEL PRODUCCIÓN
--------------------------------------------------------------------------------
[Fase 1: Arquitectura, Esquema e Integridad]
1. **Sistema de Cupones y Descuentos (DDL + Restricciones)**:
   Crea una tabla temporal `cupones` con `id`, `codigo TEXT NOT NULL UNIQUE`,
   `porcentaje_descuento REAL CHECK (BETWEEN 1 AND 50)`, `usos_maximos INT`,
   `usos_actuales INT DEFAULT 0`, `activo INT DEFAULT 1` y una restricción de
   tabla `CHECK (usos_actuales <= usos_maximos)`. Inserta 3 cupones de prueba.
2. **Trigger de Sincronización Automática de Totales**:
   Crea un trigger temporal `AFTER INSERT ON detalle_pedido` que recalcule y
   actualice automáticamente `pedidos.total` sumando `cantidad * precio_unitario`
   de todas las líneas de ese pedido.
3. **Auditoría de Seguridad Salarial (Trigger + JSON)**:
   Crea una tabla temporal `auditoria_rrhh` y un trigger `BEFORE UPDATE OF salario ON empleados`
   que: (a) aborte con `RAISE(ABORT, ...)` si el nuevo salario es menor al actual,
   y (b) en un trigger `AFTER UPDATE`, registre un objeto JSON con el cambio.

[Fase 2: Transacciones e Idempotencia]
4. **Flujo Completo de Checkout Transaccional**:
   En una transacción (`BEGIN ... ROLLBACK`), registra un nuevo pedido para el
   cliente `id = 3` con 2 unidades del producto `id = 1` y 5 del producto `id = 2`:
   descuenta las existencias de forma segura (`WHERE existencias >= ...`),
   inserta las líneas en `detalle_pedido` y verifica que el total del pedido sea
   exactamente `15.25`.
5. **Importación Masiva Idempotente (UPSERT + CTE)**:
   Escribe una sentencia `INSERT INTO productos ... ON CONFLICT(nombre) DO UPDATE`
   que procese un lote de 3 productos (2 existentes y 1 nuevo), sumando las
   existencias entrantes a las actuales y actualizando el precio solo si el
   nuevo precio es mayor al actual (`MAX(productos.precio, excluded.precio)`).

[Fase 3: Inteligencia de Negocio y Analítica Avanzada]
6. **Dashboard 360° de Clientes (RFM Simplificado con CTEs y Ventanas)**:
   Construye una consulta con CTEs que muestre para TODOS los clientes (`clientes`):
   total de pedidos realizados, pedidos pagados, pedidos cancelados, gasto total
   efectivo (excluyendo cancelados), fecha de su última compra, porcentaje que
   representa su gasto sobre los ingresos totales de la tienda y su posición en
   el ranking (`DENSE_RANK`).
7. **Clasificación ABC de Inventario (Pareto con Window Functions)**:
   Calcula el valor en bodega (`precio * existencias`) de cada producto activo,
   el valor acumulado corrido (`SUM(...) OVER (ORDER BY valor DESC)`), el
   porcentaje acumulado sobre el total de la bodega, y clasifícalo con `CASE` en:
   `'Clase A'` (hasta el 70% del valor), `'Clase B'` (70% a 90%) y `'Clase C'` (>90%).
8. **Cuadro de Honor y Analítica Académica**:
   Usando `estudiantes`, `cursos`, `matriculas` y `resultados`, genera un reporte
   que muestre por cada estudiante: cursos matriculados, cursos evaluados,
   promedio general de notas, diferencia entre su promedio y el promedio global de
   la institución (`AVG() OVER ()`), y su estado (`'Beca Honor'` si promedio >= 85,
   `'Regular'` si >= 70, `'En Riesgo'` si < 70 o sin evaluaciones).
9. **Análisis de Equidad Salarial por Departamento**:
   Une `empleados` y `departamentos` y usa funciones de ventana para mostrar por
   cada empleado: su nombre, departamento, salario, el salario promedio de su
   departamento, la diferencia porcentual respecto al promedio de su área y quién
   es el siguiente empleado mejor pagado de toda la empresa (`LEAD(nombre) OVER (...)`).

[Fase 4: Contratos de Datos, JSON y Rendimiento]
10. **Endpoint Ejecutivo en JSON + Verificación de Plan de Ejecución**:
    Crea una vista temporal `v_resumen_ejecutivo_json` que devuelva en una sola
    fila un documento `json_object` con tres grandes bloques:
    - `'ecommerce'`: total de clientes, ingresos pagados y valor de inventario.
    - `'academico'`: total de estudiantes y promedio global de notas.
    - `'rrhh'`: total de empleados y masa salarial mensual.
    Ejecuta `SELECT * FROM v_resumen_ejecutivo_json` y analiza su plan con
    `EXPLAIN QUERY PLAN`.
================================================================================
*/

-- Zona de trabajo: escribe aqui tus soluciones del Proyecto Integrador SQL.
