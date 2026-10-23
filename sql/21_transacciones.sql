/*
TEMA 21: TRANSACCIONES

Una transaccion agrupa cambios que deben aplicarse juntos. BEGIN inicia;
COMMIT confirma; ROLLBACK revierte. ACID describe atomicidad, consistencia,
aislamiento y durabilidad. Usa transacciones para operaciones relacionadas,
como transferir saldo entre dos cuentas. SQLite permite controlar transacciones
desde la consola o el cliente; el manejo exacto depende de la herramienta.

Sintaxis:
BEGIN TRANSACTION;
UPDATE cuentas SET saldo = saldo - 50 WHERE id = 1;
UPDATE cuentas SET saldo = saldo + 50 WHERE id = 2;
COMMIT;
-- Si algo falla antes de confirmar: ROLLBACK;

EJERCICIOS:
1. Transfiere saldo entre dos cuentas con una transaccion.
2. Revierte transferencia si la cuenta de origen no existe.
3. Inserta pedido y detalles atomicamente.
4. Prueba ROLLBACK y verifica que datos no cambiaron.
5. Confirma una actualizacion valida con COMMIT.
6. Actualiza inventario y registra venta en la misma transaccion.
7. Explica que problema evita una transaccion parcial.
8. Compara estado antes y despues de rollback.
9. Simula fallo intermedio y revierte los cambios previos.
10. Disena pasos transaccionales para registrar pago y pedido.
*/
