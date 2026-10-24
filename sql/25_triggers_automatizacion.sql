/*
================================================================================
TEMA 25: TRIGGERS Y AUTOMATIZACIÓN EN EL MOTOR (AUDITORÍA Y VALIDACIÓN)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Un **Trigger** (disparador) es un bloque de código SQL almacenado en la base de
datos que se ejecuta **automáticamente** cuando ocurre un evento de modificación
(`INSERT`, `UPDATE` o `DELETE`) sobre una tabla o vista específica.

Modelo mental:
- Un trigger forma parte de la **misma transacción atómica** que la sentencia
  que lo disparó. Si el trigger falla o lanza un error con `RAISE(ABORT, ...)`,
  el `INSERT`, `UPDATE` o `DELETE` original también se cancela automáticamente.
- Dentro del cuerpo del trigger tienes acceso a dos pseudo-registros especiales:
  - `NEW`: contiene los valores nuevos de la fila (disponible en `INSERT` y `UPDATE`).
  - `OLD`: contiene los valores anteriores de la fila antes del cambio (disponible
    en `UPDATE` y `DELETE`).
- Momentos de ejecución:
  - `BEFORE`: se ejecuta antes de modificar la fila (ideal para validar reglas
    complejas y abortar operaciones ilegales con `RAISE`).
  - `AFTER`: se ejecuta justo después de modificar la fila (ideal para insertar
    rastros en tablas de auditoría o sincronizar totales).
  - `INSTEAD OF`: se usa sobre Vistas (`VIEW`) para interceptar escrituras y
    redirigirlas a las tablas base correspondientes.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
- **Auditoría inmutable (Audit Logs)**: registrar automáticamente en una tabla
  `auditoria_precios` o `auditoria_salarios` quién o cuándo se cambió un valor,
  guardando `OLD.precio` y `NEW.precio`, incluso si alguien hace el cambio desde
  consola saltándose el backend.
- **Actualización de marcas de tiempo (`actualizado_en`)**: actualizar la fecha
  de última modificación de un registro en cada `UPDATE`.
- **Reglas de integridad de negocio en el motor**: impedir con `RAISE(ABORT, ...)`
  que un pedido con `estado = 'pagado'` sea eliminado o que el precio de un
  producto se reduzca en más del 80% por error humano.
- **Mantenimiento de cachés desnormalizados**: recalcular automáticamente
  `pedidos.total` cada vez que se inserta, actualiza o elimina una fila en
  `detalle_pedido`.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Trigger AFTER UPDATE con condición WHEN (Tabla de Auditoría):
CREATE TABLE IF NOT EXISTS log_cambios_precio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    precio_anterior REAL NOT NULL,
    precio_nuevo REAL NOT NULL,
    fecha_cambio TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS trg_auditar_precio_producto
AFTER UPDATE OF precio ON productos
FOR EACH ROW
WHEN OLD.precio != NEW.precio
BEGIN
    INSERT INTO log_cambios_precio (producto_id, precio_anterior, precio_nuevo)
    VALUES (OLD.id, OLD.precio, NEW.precio);
END;

-- B) Trigger BEFORE con validación y bloqueo mediante RAISE(ABORT, 'mensaje'):
CREATE TRIGGER IF NOT EXISTS trg_proteger_pedidos_pagados
BEFORE DELETE ON pedidos
FOR EACH ROW
WHEN OLD.estado = 'pagado'
BEGIN
    SELECT RAISE(ABORT, 'PROHIBIDO: No se puede eliminar un pedido ya pagado.');
END;

-- C) Listar y eliminar triggers:
SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'trigger';
DROP TRIGGER IF EXISTS trg_auditar_precio_producto;

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con resultado esperado)
--------------------------------------------------------------------------------
Escenario: Queremos garantizar que cada vez que cambie el salario de un empleado
en la tabla `empleados`, quede un registro histórico automático en
`auditoria_salarios`, y además prohibir cualquier recorte salarial mediante un
trigger `BEFORE UPDATE`.

Paso 1: Crear la tabla de auditoría y los dos triggers:
CREATE TABLE IF NOT EXISTS auditoria_salarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empleado_id INTEGER NOT NULL,
    nombre_empleado TEXT NOT NULL,
    salario_anterior REAL NOT NULL,
    salario_nuevo REAL NOT NULL,
    diferencia REAL NOT NULL,
    fecha_evento TEXT NOT NULL DEFAULT (datetime('now'))
);

DROP TRIGGER IF EXISTS trg_impedir_reduccion_salarial;
CREATE TRIGGER trg_impedir_reduccion_salarial
BEFORE UPDATE OF salario ON empleados
FOR EACH ROW
WHEN NEW.salario < OLD.salario
BEGIN
    SELECT RAISE(ABORT, 'Error de Negocio: El nuevo salario no puede ser inferior al actual.');
END;

DROP TRIGGER IF EXISTS trg_registrar_aumento_salarial;
CREATE TRIGGER trg_registrar_aumento_salarial
AFTER UPDATE OF salario ON empleados
FOR EACH ROW
WHEN NEW.salario > OLD.salario
BEGIN
    INSERT INTO auditoria_salarios (
        empleado_id, nombre_empleado, salario_anterior, salario_nuevo, diferencia
    )
    VALUES (
        OLD.id, OLD.nombre, OLD.salario, NEW.salario, ROUND(NEW.salario - OLD.salario, 2)
    );
END;

Paso 2: Probar un aumento válido para Rosa (`id = 1`, de `3200` a `3450`) y
consultar la tabla de auditoría:
BEGIN TRANSACTION;
UPDATE empleados SET salario = 3450 WHERE id = 1;
SELECT empleado_id, nombre_empleado, salario_anterior, salario_nuevo, diferencia
FROM auditoria_salarios;
ROLLBACK; -- Revertimos para mantener limpia la base de práctica

Resultado esperado antes del `ROLLBACK`:
+-------------+-----------------+------------------+---------------+------------+
| empleado_id | nombre_empleado | salario_anterior | salario_nuevo | diferencia |
+-------------+-----------------+------------------+---------------+------------+
| 1           | Rosa            | 3200.0           | 3450.0        | 250.0      |
+-------------+-----------------+------------------+---------------+------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
- TRIGGERS RECURSIVOS INFINITOS (Cuando un trigger actualiza su propia tabla):
  Si creas un trigger `AFTER UPDATE ON productos` que ejecuta
  `UPDATE productos SET actualizado_en = datetime('now') WHERE id = NEW.id;`,
  ten mucho cuidado de limitar las columnas que lo disparan (`AFTER UPDATE OF nombre, precio, existencias ON productos`)
  o usar una cláusula `WHEN` estricta, para que la actualización de `actualizado_en`
  no vuelva a disparar el mismo trigger en bucle.
- USA SIEMPRE `UPDATE OF columna1, columna2` Y `WHEN`:
  No dispares un trigger de auditoría de precios si solo cambiaron las
  `existencias` del producto. Especificar `AFTER UPDATE OF precio` y
  `WHEN OLD.precio IS NOT NEW.precio` ahorra I/O innecesario.
- NO PONGAS LÓGICA DE APLICACIÓN PESADA EN TRIGGERS:
  Los triggers deben ser rápidos, deterministas y enfocados en integridad de
  datos o auditoría. Si ocultas reglas de negocio confusas que modifican 10
  tablas silenciosamente, ningún desarrollador entenderá por qué cambian los
  datos al depurar el sistema ("magia oculta").
- Tipos de `RAISE` en SQLite:
  - `RAISE(ABORT, 'msg')`: deshace la sentencia actual y devuelve error (estándar).
  - `RAISE(ROLLBACK, 'msg')`: aborta la sentencia y hace `ROLLBACK` de toda la
    transacción activa.
  - `RAISE(IGNORE)`: cancela silenciosamente la modificación de esa fila sin
    lanzar error.

6. EJERCICIOS PROGRESIVOS (10 Retos: [Básico] 1-3, [Intermedio] 4-7, [Senior / Producción] 8-10)
--------------------------------------------------------------------------------
[Básico]
1. Validación `BEFORE INSERT` con `RAISE`: Crea un trigger `trg_validar_correo_cliente`
   sobre `clientes` (`BEFORE INSERT`) que verifique si `NEW.correo IS NOT NULL` y
   no contiene el carácter `'@'` (`INSTR(NEW.correo, '@') = 0`), lanzando
   `RAISE(ABORT, 'Formato de correo invalido')`.
2. Protección contra borrado: Crea un trigger `trg_proteger_pedidos_pagados`
   (`BEFORE DELETE ON pedidos`) que impida eliminar cualquier fila cuyo
   `OLD.estado = 'pagado'`. Pruébalo dentro de una transacción e intenta borrar
   el pedido `id = 1`.
3. Auditoría simple de precios: Crea la tabla `auditoria_precios` y un trigger
   `AFTER UPDATE OF precio ON productos` que guarde `producto_id`, `OLD.precio`,
   `NEW.precio` y la fecha/hora actual cada vez que cambie el precio de un producto.

[Intermedio]
4. Marca de tiempo automática (`actualizado_en`): Crea una tabla de prueba
   `articulos_blog (id INTEGER PRIMARY KEY, titulo TEXT, contenido TEXT, actualizado_en TEXT DEFAULT (datetime('now')))`
   y un trigger `AFTER UPDATE OF titulo, contenido ON articulos_blog` que
   actualice automáticamente `actualizado_en = datetime('now')` para `id = NEW.id`.
5. Sincronización automática de inventario: Crea un trigger `trg_descontar_stock_venta`
   (`AFTER INSERT ON detalle_pedido`) que reste automáticamente `NEW.cantidad`
   de `productos.existencias` para el `NEW.producto_id`. ¿Qué ocurre si intentas
   insertar un `detalle_pedido` con `cantidad = 500` superando las existencias?
6. Devolución de stock al borrar línea de pedido: Complementa el reto 5 creando
   un trigger `AFTER DELETE ON detalle_pedido` que devuelva (`existencias + OLD.cantidad`)
   al producto correspondiente.
7. Máquina de estados de pedidos (State Machine Validation): Crea un trigger
   `BEFORE UPDATE OF estado ON pedidos` que impida que un pedido que ya está en
   `OLD.estado = 'cancelado'` pase a `'pagado'` o `'pendiente'`, lanzando un
   mensaje claro con `RAISE(ABORT, ...)`.

[Senior / Producción]
8. Sincronización automática de `pedidos.total`: Diseña los triggers necesarios
   sobre `detalle_pedido` (`AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE`) para
   que la columna `pedidos.total` se recalcule siempre de forma exacta como la
   suma de `cantidad * precio_unitario` de sus líneas.
9. Trigger `INSTEAD OF` sobre una Vista: Crea una vista `v_nuevo_producto_libro`
   que muestre los productos de la categoría `'Libros'` (`categoria_id = 1`).
   Dado que las vistas en SQLite no permiten `INSERT` directo, crea un trigger
   `INSTEAD OF INSERT ON v_nuevo_producto_libro` que inserte el registro en la
   tabla base `productos` asignándole automáticamente `categoria_id = 1` y `activo = 1`.
10. Sistema de Auditoría Universal en JSON: Crea una tabla `audit_trail_general`
    con columnas `(id, tabla, operacion, registro_id, datos_anteriores, datos_nuevos, fecha)`
    y diseña triggers para `INSERT`, `UPDATE` y `DELETE` sobre `empleados` que
    guarden instantáneas completas de `OLD` y `NEW`.
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
