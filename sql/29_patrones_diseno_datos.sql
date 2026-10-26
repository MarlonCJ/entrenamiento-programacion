/*
================================================================================
TEMA 29: PATRONES DE DISEÑO DE DATOS (SOFT DELETE, AUDITORÍA, HISTÓRICOS Y LEDGER)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
En proyectos reales de nivel Senior, el esquema de base de datos no solo guarda
el "estado actual", sino que debe responder preguntas críticas del negocio, de
contabilidad y de auditoría legal:
- *"¿Por qué esta factura de hace 6 meses cobró $18.00 si hoy el producto cuesta $25.00?"*
- *"¿Quién desactivó este cliente y cuándo?"*
- *"¿Cuál era el salario de este empleado en el primer trimestre del año pasado?"*

Los **5 Patrones de Diseño de Datos** más importantes en la industria son:
1. **Inmutabilidad de Hechos Transaccionales (Snapshot Pattern)**:
   En `detalle_pedido`, guardar `precio_unitario` en el momento exacto de la
   compra. Si mañana `productos.precio` sube, las facturas históricas jamás deben
   alterarse.
2. **Soft Delete (Borrado Lógico con Marca de Tiempo)**:
   En lugar de `DELETE`, usar `activo = 0` o mejor aún `eliminado_en TEXT NULL`
   (guardando la fecha ISO-8601 de baja). Permite restaurar cuentas, mantener la
   integridad referencial de facturas antiguas y saber cuándo se dio de baja.
3. **Audit Trail / Change Data Capture en Tabla Espejo**:
   Registrar cada cambio de estado o precio en una tabla de historial inmutable
   (`insert-only`) con `valor_anterior`, `valor_nuevo` y `fecha_cambio`.
4. ** Libro Mayor Inmutable (Ledger / Double-Entry Accounting Pattern)**:
   En billeteras digitales, bancos e inventarios críticos, el saldo no es solo un
   número que se sobrescribe: es la suma de movimientos inmutables (`CREDITO` /
   `DEBITO` o `ENTRADA` / `SALIDA`). Un error no se borra: se corrige con un
   asiento inverso (contraasiento).
5. **Idempotencia mediante `idempotency_key`**:
   Garantizar con una restricción `UNIQUE` que si un cliente o pasarela envía dos
   veces el mismo pago por reintento de red, solo se procese una vez.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - E-Commerce y Facturación Legal: Congelar precios, descuentos e impuestos en
    las líneas del pedido (`detalle_pedido`).
  - Fintech y Billeteras: Movimientos contables inmutables (`movimientos_cuenta`)
    y claves de idempotencia (`transaccion_externa_id UNIQUE`).
  - SaaS Multi-usuario y Cumplimiento Normativo (GDPR/SOC2): Borrado lógico
    (`eliminado_en`) y tablas de historial de cambios (`SCD Tipo 2`).

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Patrón Soft Delete con índice parcial de unicidad (Permite reutilizar el correo si el anterior fue eliminado)
CREATE TEMP TABLE usuarios_saas (
    id INTEGER PRIMARY KEY,
    correo TEXT NOT NULL,
    eliminado_en TEXT DEFAULT NULL
);
CREATE UNIQUE INDEX idx_usuarios_correo_activo
ON usuarios_saas(correo) WHERE eliminado_en IS NULL;

-- B) Patrón Ledger (Movimientos de Inventario o Billetera Inmutables)
CREATE TEMP TABLE movimientos_inventario (
    id INTEGER PRIMARY KEY,
    producto_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad INTEGER NOT NULL CHECK (cantidad != 0),
    referencia TEXT NOT NULL UNIQUE, -- Clave de idempotencia
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- C) Patrón SCD Tipo 2 (Slowly Changing Dimension - Historial con vigencia de fechas)
CREATE TEMP TABLE historial_precios (
    id INTEGER PRIMARY KEY,
    producto_id INTEGER NOT NULL,
    precio REAL NOT NULL CHECK (precio >= 0),
    vigente_desde TEXT NOT NULL,
    vigente_hasta TEXT DEFAULT NULL -- NULL significa que es el precio vigente actual
);

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: Diseñamos un libro mayor de inventario (*Inventory Ledger*)
donde cada entrada y salida queda registrada con una clave de referencia única
(idempotente), y calculamos el stock auditable junto con el saldo corrido paso a
paso usando funciones de ventana.
*/
-- BEGIN TRANSACTION;
--
-- CREATE TEMP TABLE kardex_inventario (
--     id INTEGER PRIMARY KEY,
--     producto_id INTEGER NOT NULL REFERENCES productos(id),
--     fecha TEXT NOT NULL,
--     tipo TEXT NOT NULL CHECK (tipo IN ('COMPRA', 'VENTA', 'MERMA')),
--     delta_unidades INTEGER NOT NULL CHECK (
--         (tipo = 'COMPRA' AND delta_unidades > 0) OR
--         (tipo IN ('VENTA', 'MERMA') AND delta_unidades < 0)
--     ),
--     idempotency_key TEXT NOT NULL UNIQUE
-- );
--
-- INSERT INTO kardex_inventario (producto_id, fecha, tipo, delta_unidades, idempotency_key)
-- VALUES
--     (1, '2026-01-01', 'COMPRA',  25, 'OC-2026-001'),
--     (1, '2026-01-15', 'VENTA',   -4, 'PED-1001-ITEM-1'),
--     (1, '2026-02-01', 'MERMA',   -1, 'AJUSTE-BODEGA-01');
--
-- SELECT
--     id,
--     fecha,
--     tipo,
--     delta_unidades,
--     SUM(delta_unidades) OVER (
--         PARTITION BY producto_id
--         ORDER BY fecha ASC, id ASC
--     ) AS saldo_acumulado,
--     idempotency_key
-- FROM kardex_inventario
-- WHERE producto_id = 1;
--
-- ROLLBACK;
/*
Resultado esperado:
+----+------------+--------+----------------+-----------------+------------------+
| id | fecha      | tipo   | delta_unidades | saldo_acumulado | idempotency_key  |
+----+------------+--------+----------------+-----------------+------------------+
| 1  | 2026-01-01 | COMPRA | 25             | 25              | OC-2026-001      |
| 2  | 2026-01-15 | VENTA  | -4             | 21              | PED-1001-ITEM-1  |
| 3  | 2026-02-01 | MERMA  | -1             | 20              | AJUSTE-BODEGA-01 |
+----+------------+--------+----------------+-----------------+------------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - EL PROBLEMA DE `UNIQUE` CON SOFT DELETE: Si una tabla tiene `correo TEXT UNIQUE`
    y haces un *Soft Delete* (`activo = 0`) del usuario `ana@test.com`, cuando Ana
    intente registrarse de nuevo en el futuro la base de datos rechazará el
    `INSERT` por correo duplicado. La solución profesional es un **Índice Único
    Parcial**: `CREATE UNIQUE INDEX ... ON clientes(correo) WHERE eliminado_en IS NULL`.
  - NUNCA CALCULES FACTURAS HISTÓRICAS HACIENDO JOIN CON `productos.precio`:
    En el esquema de práctica, observa que `detalle_pedido` tiene su propia
    columna `precio_unitario` (en el pedido 1, el Lápiz se vendió a `1.375` aunque
    en `productos` hoy cuesta `1.25`). Usa siempre `detalle_pedido.precio_unitario`
    para reportes financieros históricos.
  - MÁQUINAS DE ESTADO EN LA BASE DE DATOS: Un pedido `'cancelado'` no debería
    poder pasar a `'pagado'`. Puedes blindar las transiciones válidas de estado
    mediante un trigger `BEFORE UPDATE` o desde la cláusula `WHERE estado = 'pendiente'`.

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Comprueba el patrón **Snapshot de Precios** en la base de práctica: escribe un
   `SELECT` que una `detalle_pedido` y `productos` mostrando `productos.precio`
   (precio actual) frente a `detalle_pedido.precio_unitario` (precio histórico
   al que se vendió realmente) y la diferencia entre ambos.
2. Crea una vista temporal `v_productos_disponibles` que oculte automáticamente
   los registros con *Soft Delete* (`activo = 0`) para que las consultas de la
   tienda nunca muestren productos dados de baja.
3. Crea una tabla temporal `pagos_recibidos` con una columna `idempotency_key TEXT NOT NULL UNIQUE`
   y demuestra cómo `INSERT OR IGNORE` evita cobrar dos veces el mismo pago si se
   reintenta el mensaje.

[Intermedio]
4. Implementa el patrón **Soft Delete con Índice Único Parcial**: crea una tabla
   temporal `cuentas_clientes (id INT PRIMARY KEY, email TEXT NOT NULL, eliminado_en TEXT)`
   con un índice único parcial cuando `eliminado_en IS NULL`. Demuestra que
   puedes tener dos filas con el mismo `email` si la primera está marcada como
   eliminada, pero que rechaza una segunda fila activa con el mismo `email`.
5. Implementa una **Máquina de Estados** en `pedidos`: crea un trigger temporal
   `BEFORE UPDATE OF estado ON pedidos` que impida cambiar el estado si el pedido
   ya estaba en `'pagado'` o `'cancelado'`, lanzando `RAISE(ABORT, 'Transicion de estado invalida')`.
6. Implementa el patrón **SCD Tipo 2 (Historial de Salarios con Vigencia)**:
   crea una tabla temporal `historial_salarios (empleado_id INT, salario REAL, desde TEXT, hasta TEXT)`,
   inserta la evolución salarial de un empleado con 3 etapas y escribe una
   consulta que obtenga qué salario tenía exactamente en una fecha dada (`'2024-06-15'`).
7. Crea una restricción `CHECK` avanzada en una tabla temporal `promociones` que
   garantice que `fecha_fin > fecha_inicio` y que `descuento_porcentaje BETWEEN 1 AND 90`.

[Senior / Producción]
8. Diseño **Ledger Financiero de Doble Entrada**: Crea dos tablas temporales
   `billeteras (id INT PRIMARY KEY, saldo_cache REAL NOT NULL)` y
   `movimientos_billetera (id INT PRIMARY KEY, billetera_id INT, monto REAL NOT NULL, referencia TEXT UNIQUE)`
   junto con un trigger `AFTER INSERT ON movimientos_billetera` que actualice
   automáticamente `billeteras.saldo_cache` e impida que quede negativo.
9. Reconciliación de Caché Desnormalizado: Escribe una consulta de auditoría que
   compare `pedidos.total` contra la suma real de sus líneas en `detalle_pedido`,
   devolviendo una columna `estado_auditoria` (`'CUADRADO'` o `'DESCUADRADO'`) y
   el monto de diferencia.
10. Tabla de Auditoría Universal en JSON: Crea una tabla temporal `audit_log` y
    un trigger `AFTER UPDATE ON productos` que guarde una fila solo si cambió el
    `precio` o el estado `activo`, almacenando en una columna JSON `estado_anterior`
    (`json_object('precio', OLD.precio, 'activo', OLD.activo)`) y en otra
    `estado_nuevo`.
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
