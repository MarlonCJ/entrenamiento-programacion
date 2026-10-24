/*
================================================================================
TEMA 21: TRANSACCIONES (BEGIN, COMMIT, ROLLBACK Y ATOMICIDAD)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Una transacción es una unidad lógica de trabajo que agrupa una o más operaciones
SQL (`INSERT`, `UPDATE`, `DELETE`) bajo la regla de **"Todo o Nada"** (Atomicidad).

Modelo mental:
- Por defecto, SQLite funciona en modo **autocommit**: cada sentencia individual
  que ejecutas se confirma y guarda en disco inmediatamente por separado.
- Cuando abres una transacción explícita con `BEGIN TRANSACTION;`, el motor
  entra en un estado provisional: todos los cambios subsiguientes quedan en un
  borrador aislado.
  - Si todo sale bien y ejecutas `COMMIT;`, todos los cambios se vuelven
    permanentes de golpe como un único hecho indivisible.
  - Si ocurre un error en el paso 3 de 4 y ejecutas `ROLLBACK;` (o se corta la
    energía antes del `COMMIT`), el motor deshace los pasos 1 y 2 dejando la
    base de datos exactamente como estaba antes del `BEGIN`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
- Transferencias de dinero o puntos: restar $100 de la Cuenta A y sumar $100 a
  la Cuenta B. Jamás puede quedar confirmada la resta sin la suma.
- Proceso de Checkout (E-commerce):
  1) Insertar la cabecera en `pedidos`.
  2) Insertar las líneas en `detalle_pedido`.
  3) Descontar las unidades compradas en `productos.existencias`.
  Si el producto no tiene existencias suficientes en el paso 3 (y falla el
  `CHECK (existencias >= 0)`), toda la compra debe revertirse con `ROLLBACK`.
- Migraciones e importaciones masivas: insertar 10,000 filas dentro de un único
  bloque `BEGIN ... COMMIT` es hasta 100 veces más rápido en SQLite que hacer
  10,000 `INSERT` sueltos, porque sincroniza el disco una sola vez al final.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Transacción exitosa (COMMIT):
BEGIN TRANSACTION;

INSERT INTO pedidos (id, cliente_id, fecha, estado, total)
VALUES (100, 1, '2026-03-10', 'pagado', 9.00);

INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario)
VALUES (100, 1, 2, 4.50);

UPDATE productos
SET existencias = existencias - 2
WHERE id = 1;

COMMIT;

-- B) Transacción cancelada / revertida (ROLLBACK):
BEGIN TRANSACTION;

UPDATE empleados SET salario = salario * 2;
-- ¡Ups! Olvidamos el WHERE y duplicamos el sueldo de toda la empresa.
-- Antes de confirmar, revertimos todo al estado original:
ROLLBACK;

-- C) Puntos de guardado parciales dentro de una transacción (SAVEPOINT):
BEGIN TRANSACTION;
INSERT INTO categorias (id, nombre) VALUES (10, 'Hogar');
SAVEPOINT sp_antes_producto;
INSERT INTO productos (id, nombre, precio, existencias, categoria_id)
VALUES (50, 'Lampara', 15.0, 5, 10);
-- Revertimos solo el producto pero conservamos la categoría 'Hogar':
ROLLBACK TO SAVEPOINT sp_antes_producto;
COMMIT;

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con resultado esperado)
--------------------------------------------------------------------------------
Escenario: El cliente `id = 2` (Luis Gomez) compra 3 unidades del producto
`id = 3` (`'SQL para principiantes'`, precio `18.00`, existencias actuales `8`).
Debemos registrar el pedido `id = 4`, su detalle y descontar el inventario de
forma atómica.

Paso 1: Ejecutar la transacción completa:
BEGIN TRANSACTION;

INSERT INTO pedidos (id, cliente_id, fecha, estado, total)
VALUES (4, 2, '2026-03-15', 'pagado', 54.00);

INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario)
VALUES (4, 3, 3, 18.00);

UPDATE productos
SET existencias = existencias - 3
WHERE id = 3;

-- Verificamos dentro de la transacción antes de confirmar:
SELECT id, nombre, existencias FROM productos WHERE id = 3;

COMMIT;

Resultado esperado tras el `COMMIT`:
+----+------------------------+-------------+
| id | nombre                 | existencias |
+----+------------------------+-------------+
| 3  | SQL para principiantes | 5           |
+----+------------------------+-------------+
(Si luego quieres dejar la base de práctica como al inicio, puedes revertir esos
datos o haber probado con `ROLLBACK` en lugar de `COMMIT`).

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
- NO DEJES TRANSACCIONES ABIERTAS ESPERANDO AL USUARIO:
  En SQLite, una transacción que escribe datos bloquea la escritura para otras
  conexiones. Nunca abras `BEGIN TRANSACTION` y te quedes esperando una llamada
  HTTP externa o un clic del usuario antes de hacer `COMMIT` o `ROLLBACK`. Las
  transacciones deben durar milisegundos.
- UN ERROR EN UNA SENTENCIA NO HACE `ROLLBACK` AUTOMÁTICO DE TODA LA TRANSACCIÓN:
  Si dentro de un `BEGIN ...` una sentencia falla (por ejemplo, por violar un
  `CHECK (existencias >= 0)`), SQLite deshace *esa sentencia individual*, pero
  la transacción sigue abierta a menos que uses resolución `OR ROLLBACK` o tu
  código capture el error y ejecute explícitamente `ROLLBACK;`.
  Tip pro en SQLite: `UPDATE OR ROLLBACK productos SET existencias = existencias - 50 WHERE id = 1;`
  fuerza el `ROLLBACK` inmediato de toda la transacción activa si falla la restricción.
- `DELETE` o `UPDATE` EN PRODUCCIÓN:
  Acostúmbrate a escribir siempre `BEGIN TRANSACTION;` antes de ejecutar un
  `UPDATE` o `DELETE` manual en consola, revisa con un `SELECT` cuántas filas
  cambiaron, y solo entonces ejecuta `COMMIT;` (o `ROLLBACK;` si te equivocaste).

6. EJERCICIOS PROGRESIVOS (10 Retos: [Básico] 1-3, [Intermedio] 4-7, [Senior / Producción] 8-10)
--------------------------------------------------------------------------------
[Básico]
1. Red de seguridad con `ROLLBACK`: Inicia una transacción (`BEGIN TRANSACTION;`),
   actualiza el salario de todos los empleados a `9999`, haz un `SELECT` para
   ver el cambio temporal, luego ejecuta `ROLLBACK;` y vuelve a hacer `SELECT`
   para comprobar que los salarios originales siguen intactos.
2. Confirmación con `COMMIT`: Crea una tabla de prueba `cuentas_bancarias (id INTEGER PRIMARY KEY, titular TEXT, saldo REAL CHECK (saldo >= 0))`
   e inserta dos cuentas (`Ana` con `500.0` y `Luis` con `300.0`) dentro de una
   transacción confirmada con `COMMIT;`.
3. Transferencia bancaria atómica: Usando la tabla `cuentas_bancarias` del reto 2,
   transfiere `150.0` de la cuenta de `Ana` a la de `Luis` dentro de una
   transacción y verifica que la suma total de dinero del sistema (`SUM(saldo)`)
   sigue siendo exactamente `800.0`.

[Intermedio]
4. Fallo de restricción y reversión: Intenta transferir `1000.0` desde la cuenta
   de `Ana` (que tiene menos saldo) a la de `Luis`. Usa `UPDATE OR ROLLBACK` (o
   reviértelo manualmente al fallar el `CHECK (saldo >= 0)`) para asegurarte de
   que `Luis` no reciba dinero que `Ana` no tenía.
5. Registro atómico de pedido y detalle: En una transacción (que al final puedes
   revertir con `ROLLBACK` para no alterar los datos base), inserta un nuevo
   pedido para el cliente `id = 3` con dos productos distintos en `detalle_pedido`
   y descuenta las existencias de ambos en `productos`.
6. Cancelación transaccional de pedido y devolución de stock: Escribe los pasos
   transaccionales para cambiar el pedido `id = 2` a `estado = 'cancelado'` y,
   en la misma transacción, devolver al inventario (`productos.existencias`) las
   unidades que figuraban en `detalle_pedido` para ese pedido.
7. Uso de `SAVEPOINT`: Inicia una transacción, inserta un nuevo estudiante en
   `estudiantes`, crea un `SAVEPOINT antes_matricula;`, inserta una matrícula en
   `matriculas`, haz `ROLLBACK TO SAVEPOINT antes_matricula;` y finalmente `COMMIT;`.
   Verifica que el estudiante exista pero la matrícula no.

[Senior / Producción]
8. Verificación de filas afectadas (Transferencia a cuenta inexistente): Si
   ejecutas `UPDATE cuentas_bancarias SET saldo = saldo - 100 WHERE id = 1;` y
   luego `UPDATE cuentas_bancarias SET saldo = saldo + 100 WHERE id = 999;`
   (donde `999` no existe), ¡SQLite no lanza error porque actualizar 0 filas es
   válido en SQL! Diseña una estrategia SQL (puedes apoyarte en `changes()` o en
   una validación previa/trigger) y explica cómo detectar y hacer `ROLLBACK`
   cuando la cuenta destino no existe.
9. Rendimiento de carga por lotes (Batching): Explica por qué envolver 5,000
   sentencias `INSERT` en un único `BEGIN TRANSACTION; ... COMMIT;` reduce el
   tiempo de ejecución de minutos a milisegundos en SQLite (menciona las
   operaciones de I/O de disco y fsync).
10. Flujo transaccional completo de matrícula y beca: Diseña un script
    transaccional con puntos de control (`SAVEPOINT`) que matricule a una
    estudiante en un curso, registre su resultado inicial y actualice un cupo
    de beca departamental, garantizando que cualquier violación de integridad
    deje la base de datos 100% consistente.
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
