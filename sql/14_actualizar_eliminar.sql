/*
================================================================================
TEMA 14: ACTUALIZACIÓN Y ELIMINACIÓN SEGURA DE DATOS (UPDATE Y DELETE)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
`UPDATE` modifica los valores de columnas en filas existentes, y `DELETE`
elimina filas de una tabla. En ingeniería de software, estas son las dos
operaciones más delicadas en producción porque mutan o destruyen estado.

Un `UPDATE` o `DELETE` ejecutado sin cláusula `WHERE` (o con un `WHERE` mal
construido por precedencia de `OR`) afectará a TODAS las filas de la tabla en
milisegundos. Por ello, todo desarrollador Senior aplica el protocolo de
**Modificación Defensiva**:
1. Escribir primero un `SELECT` con el mismo `WHERE` para inspeccionar qué filas
   serán afectadas.
2. Envolver la operación en una transacción (`BEGIN` ... `COMMIT` / `ROLLBACK`).
3. Usar la clave primaria (`WHERE id = ...`) siempre que se apunte a un registro
   específico, o usar `RETURNING` para auditar exactamente qué cambió.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Gestión de Inventario y Pedidos: Descontar existencias al confirmar un pago
    (`SET existencias = existencias - :cantidad WHERE id = :id AND existencias >= :cantidad`)
    y cambiar el estado del pedido de `'pendiente'` a `'pagado'`.
  - Ajustes Masivos Controlados: Incrementar salarios de un departamento o
    aplicar un ajuste de precios por inflación a una categoría.
  - Desactivación Lógica (*Soft Delete*) vs Borrado Físico (*Hard Delete*):
    Marcar un producto como inactivo (`UPDATE productos SET activo = 0`) para no
    romper el historial de `detalle_pedido`, reservando `DELETE` para datos
    temporales, sesiones expiradas o registros huérfanos de prueba.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) UPDATE puntual y atómico basado en el valor actual de la columna
UPDATE productos
SET
    precio = ROUND(precio * 1.10, 2),
    existencias = existencias + 5
WHERE id = 1;

-- B) UPDATE condicional con guarda de negocio (Evita stock negativo en concurrencia)
UPDATE productos
SET existencias = existencias - 3
WHERE id = 3 AND existencias >= 3;

-- C) DELETE seguro acotado por clave primaria o condición estricta
DELETE FROM detalle_pedido
WHERE pedido_id = 3 AND producto_id = 4;

-- D) UPDATE / DELETE con RETURNING (SQLite 3.35+ / PostgreSQL)
UPDATE pedidos
SET estado = 'pagado'
WHERE id = 2 AND estado = 'pendiente'
RETURNING id, estado, total;

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: El pedido #2 acaba de ser pagado. Debemos actualizar su estado
a `'pagado'` únicamente si sigue `'pendiente'`, y descontar 1 unidad del
producto #3 verificando que haya existencias suficientes.
*/
-- BEGIN TRANSACTION;
--
-- -- Paso 1: Pre-verificación con SELECT
-- SELECT id, estado, total FROM pedidos WHERE id = 2;
-- SELECT id, nombre, existencias FROM productos WHERE id = 3;
--
-- -- Paso 2: Actualización defensiva
-- UPDATE pedidos
-- SET estado = 'pagado'
-- WHERE id = 2 AND estado = 'pendiente';
--
-- UPDATE productos
-- SET existencias = existencias - 1
-- WHERE id = 3 AND existencias >= 1;
--
-- -- Paso 3: Verificación posterior
-- SELECT id, estado, total FROM pedidos WHERE id = 2;
-- SELECT id, nombre, existencias FROM productos WHERE id = 3;
--
-- ROLLBACK; -- Revertimos para no alterar los datos semilla de práctica
/*
Resultado esperado tras los UPDATE (antes del ROLLBACK):
Pedido #2   -> estado: 'pagado'
Producto #3 -> existencias: 7 (antes 8)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - REGLA DE ORO: NUNCA ejecutes un `UPDATE` o `DELETE` sin haber ejecutado antes
    `SELECT * FROM tabla WHERE <misma_condicion>` para confirmar el alcance.
  - CUIDADO CON LA INTEGRIDAD REFERENCIAL AL BORRAR: Si `PRAGMA foreign_keys = ON`,
    no podrás hacer `DELETE FROM clientes WHERE id = 1` mientras ese cliente
    tenga filas hijas en `pedidos`. En sistemas reales, los clientes y productos
    con historial transaccional NO se borran con `DELETE`; se desactivan
    (*Soft Delete*: `activo = 0`).
  - ACTUALIZACIONES ATÓMICAS EN LUGAR DE "LEER Y LUEGO ESCRIBIR": En vez de leer
    `existencias` en tu código y luego hacer `SET existencias = 19`, haz siempre
    `SET existencias = existencias - 1 WHERE id = 1 AND existencias >= 1`. Así
    el motor aplica bloqueo de escritura y evita condiciones de carrera.

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Actualiza el `telefono` del cliente con `id = 2` (Luis Gómez), que actualmente
   es `NULL`, asignándole `'5550199'`. Verifica el cambio con un `SELECT`.
2. Modifica el `precio` del producto con `id = 1` (`'Cuaderno'`) a `5.00` y
   verifica el resultado.
3. Incrementa en `10` unidades las `existencias` del producto con `id = 3` usando
   una expresión relativa (`SET existencias = existencias + 10`).

[Intermedio]
4. Actualiza simultáneamente dos columnas: para el producto con `id = 4`
   (`'Teclado'`), asigna `existencias = 12` y cámbialo a `activo = 1`.
5. Aplica un aumento salarial del 5% (`ROUND(salario * 1.05, 2)`) únicamente a
   los empleados que pertenecen al departamento de Tecnología (`departamento_id = 1`).
6. Inserta un producto de prueba (`id = 500`, `'Producto Temporal'`) y luego
   elimínalo de forma segura usando `DELETE FROM productos WHERE id = 500`.
7. Practica el *Soft Delete*: en lugar de eliminar físicamente un producto que ya
   tiene ventas asociadas en `detalle_pedido`, desactívalo con `SET activo = 0`.

[Senior / Producción]
8. Actualización masiva condicional con `CASE`: En una sola sentencia `UPDATE`
   sobre `productos` (envuelta en `BEGIN ... ROLLBACK`), incrementa el precio un
   10% si `categoria_id = 1`, un 5% si `categoria_id = 2`, y déjalo igual para
   las demás categorías.
9. `UPDATE` con subconsulta correlacionada: Recalcula y sincroniza la columna
   `total` de la tabla `pedidos` para el `id = 1` asignándole exactamente la suma
   de `cantidad * precio_unitario` de sus filas en `detalle_pedido`.
10. Borrado seguro con subconsulta e integridad: Elimina (dentro de `BEGIN ... ROLLBACK`)
    únicamente los productos inactivos (`activo = 0`) que NO tengan ninguna línea
    registrada en `detalle_pedido` (`WHERE id NOT IN (SELECT producto_id FROM detalle_pedido)`).
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
