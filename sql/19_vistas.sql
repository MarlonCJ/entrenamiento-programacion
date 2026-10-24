/*
================================================================================
TEMA 19: VISTAS (ENCAPSULACIÓN, SEGURIDAD Y CAPA DE REPORTERÍA)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Una Vista (`VIEW`) es una consulta `SELECT` almacenada en el esquema de la base
de datos con un nombre propio, que puede consultarse exactamente igual que si
fuera una tabla (`SELECT * FROM nombre_vista`).

Modelo mental:
- Una vista estándar (no materializada) NO guarda datos en disco ni duplica las
  filas de las tablas originales. Guarda únicamente la definición de la consulta.
- Cada vez que haces `SELECT` sobre una vista, el motor reemplaza el nombre de
  la vista por su `SELECT` interno y ejecuta la consulta contra las tablas base
  en tiempo real. Si cambias un dato en la tabla `productos`, la vista refleja
  el cambio al instante.
- Es el equivalente en bases de datos a crear una interfaz o función pública que
  oculta la complejidad interna (múltiples `JOIN`, cálculos de impuestos, filtros
  de registros eliminados) detrás de un contrato limpio y estable.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
-Principio DRY (Don't Repeat Yourself) en reportería: en lugar de que 15
  consultas del backend repitan el mismo `JOIN` entre `pedidos`, `clientes` y
  `detalle_pedido`, defines una vista `v_resumen_pedidos` como única fuente de
  verdad.
- Ocultamiento de columnas sensibles (Seguridad / Privacidad): exponer a una
  herramienta de BI o a un rol de soporte una vista `v_directorio_empleados`
  que incluye `id`, `nombre` y `departamento`, pero oculta la columna `salario`.
- Compatibilidad hacia atrás durante refactorizaciones: si divides una tabla
  antigua en dos tablas normalizadas, puedes crear una vista con el nombre de la
  tabla antigua para que los reportes heredados sigan funcionando sin romperse.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Crear una vista (con IF NOT EXISTS y prefijo recomendado v_ o vw_):
CREATE VIEW IF NOT EXISTS v_productos_activos AS
SELECT
    p.id,
    p.nombre AS producto,
    c.nombre AS categoria,
    p.precio,
    p.existencias,
    ROUND(p.precio * p.existencias, 2) AS valor_inventario
FROM productos p
LEFT JOIN categorias c ON c.id = p.categoria_id
WHERE p.activo = 1;

-- B) Consultar la vista como si fuera una tabla normal:
SELECT producto, categoria, valor_inventario
FROM v_productos_activos
WHERE existencias > 0
ORDER BY valor_inventario DESC;

-- C) Eliminar una vista (para recrearla o limpiarla):
DROP VIEW IF EXISTS v_productos_activos;

-- D) Inspeccionar la definición de las vistas en SQLite:
SELECT name, sql
FROM sqlite_master
WHERE type = 'view';

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con resultado esperado)
--------------------------------------------------------------------------------
Escenario: El área de Atención al Cliente necesita consultar diariamente el
estado de los pedidos junto con los datos de contacto del cliente, pero no
deben escribir `JOIN` manuales ni ver pedidos cancelados en su bandeja operativa.

Paso 1: Definir la vista operativa:
DROP VIEW IF EXISTS v_bandeja_pedidos_operativos;

CREATE VIEW v_bandeja_pedidos_operativos AS
SELECT
    p.id AS pedido_id,
    p.fecha,
    p.estado,
    p.total,
    c.id AS cliente_id,
    c.nombre || ' ' || c.apellido AS cliente,
    COALESCE(c.correo, 'Sin correo') AS correo,
    COALESCE(c.telefono, 'Sin telefono') AS telefono,
    c.ciudad
FROM pedidos p
INNER JOIN clientes c ON c.id = p.cliente_id
WHERE p.estado IN ('pendiente', 'pagado');

Paso 2: Consultar la vista filtrando por ciudad:
SELECT pedido_id, fecha, estado, total, cliente, telefono
FROM v_bandeja_pedidos_operativos
WHERE ciudad = 'Bogota';

Resultado esperado:
+-----------+------------+-----------+-------+-----------+----------+
| pedido_id | fecha      | estado    | total | cliente   | telefono |
+-----------+------------+-----------+-------+-----------+----------+
| 1         | 2026-01-15 | pagado    | 10.0  | Ana Perez | 5550101  |
| 2         | 2026-02-03 | pendiente | 18.0  | Ana Perez | 5550101  |
+-----------+------------+-----------+-------+-----------+----------+
(El pedido 3 de Luis Gomez está `'cancelado'`, por lo que la vista lo excluye).

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
- NUNCA USES `SELECT *` DENTRO DE LA DEFINICIÓN DE UNA VISTA:
  Si defines `CREATE VIEW v_clientes AS SELECT * FROM clientes` y meses después
  añades una columna sensible (ej. `documento_secreto`) a la tabla `clientes`,
  o cambias el orden de las columnas, la vista puede exponer datos no deseados
  o desalinearse en algunos motores. Lista SIEMPRE las columnas explícitamente.
- ANTIPATRÓN DE "VISTAS SOBRE VISTAS SOBRE VISTAS":
  Anidar una vista que consulta otra vista que a su vez hace `JOIN` con tres
  vistas más oculta el costo real al desarrollador. Terminas haciendo un `SELECT`
  aparentemente inocente que por debajo ejecuta 12 `JOIN` innecesarios. Mantén
  las vistas a 1 nivel sobre las tablas base.
- LAS VISTAS NORMALES NO ACELERAN LAS CONSULTAS POR SÍ SOLAS:
  Una vista en SQLite no guarda resultados precalculados (no es una Materialized
  View). El rendimiento depende de los índices que existan en las tablas base.
- MODIFICAR UNA VISTA EN SQLITE:
  SQLite no soporta `CREATE OR REPLACE VIEW`. Para actualizar la definición de
  una vista, ejecuta siempre `DROP VIEW IF EXISTS nombre_vista;` seguido de
  `CREATE VIEW nombre_vista AS ...;`.
- Las vistas en SQLite son de solo lectura por defecto (no puedes hacer `INSERT`
  o `UPDATE` directamente sobre ellas a menos que definas un Trigger `INSTEAD OF`).

6. EJERCICIOS PROGRESIVOS (10 Retos: [Básico] 1-3, [Intermedio] 4-7, [Senior / Producción] 8-10)
--------------------------------------------------------------------------------
[Básico]
1. Vista de catálogo disponible: Crea una vista llamada `v_catalogo_disponible`
   que muestre `id`, `nombre` y `precio` de los productos con `activo = 1` y
   `existencias > 0`. Luego consúltala ordenando por `precio ASC`.
2. Vista de privacidad de clientes: Crea una vista `v_clientes_publico` que
   exponga únicamente `id`, `nombre`, `apellido` y `ciudad` (ocultando `correo`
   y `telefono`). Haz un `SELECT *` sobre la vista.
3. Limpieza segura: Practica eliminar la vista `v_clientes_publico` usando
   `DROP VIEW IF EXISTS` y vuelve a crearla añadiendo una columna calculada
   `nombre_completo`.

[Intermedio]
4. Vista relacional de pedidos: Crea una vista `v_pedidos_detallados` que una
   `pedidos`, `clientes`, `detalle_pedido` y `productos`, exponiendo:
   `pedido_id`, `fecha`, `estado`, `cliente_nombre`, `producto_nombre`,
   `cantidad`, `precio_unitario` y `subtotal_linea` (`cantidad * precio_unitario`).
5. Filtrado sobre vistas: Usando la vista `v_pedidos_detallados` del reto
   anterior, escribe una consulta que filtre solo los pedidos con `estado = 'pagado'`
   y calcule cuántas unidades totales se vendieron en ellos.
6. Vista ejecutiva de ventas por cliente: Crea una vista `v_resumen_ventas_cliente`
   que muestre todos los clientes (`LEFT JOIN` con `pedidos`), la cantidad total
   de pedidos realizados y el monto acumulado en pedidos con `estado = 'pagado'`
   (usando `COALESCE(SUM(CASE WHEN ...), 0)`).
7. Verificación de tiempo real (Experimento práctico): Consulta `v_catalogo_disponible`,
   luego actualiza el precio del producto con `id = 1` en la tabla base `productos`
   (dentro de una transacción o restaurándolo después), y vuelve a consultar la
   vista. Explica en un comentario por qué el nuevo precio aparece inmediatamente.

[Senior / Producción]
8. Vista académica integral (KPIs de cursos): Diseña una vista `v_kpi_cursos`
   que muestre por cada curso de la tabla `cursos`: `curso_id`, `nombre`,
   `duracion`, `total_matriculados` (desde `matriculas`), `total_evaluados`,
   `promedio_nota`, `nota_maxima` y `nota_minima` (desde `resultados`).
9. Vista de seguridad de Recursos Humanos: Crea una vista `v_rrhh_departamentos`
   pensada para gerentes de área que muestre por departamento: `departamento_id`,
   `nombre` del departamento, `total_empleados` y `rango_salarial` (texto que
   muestre `'Min: X - Max: Y'`), sin revelar qué empleado individual gana cuánto.
10. Auditoría de metadatos del esquema: Escribe una consulta sobre `sqlite_master`
    que liste todas las vistas creadas actualmente en la base de datos y su
    código SQL fuente (`name`, `sql`), y documenta las convenciones de nombres
    que usarías en un proyecto empresarial.
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
