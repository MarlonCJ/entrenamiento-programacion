/*
================================================================================
TEMA 27: CONCURRENCIA, AISLAMIENTO, SAVEPOINTS Y PROPIEDADES ACID A FONDO
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
En un sistema real de comercio electrónico o banca, cientos de usuarios leen y
escriben en la base de datos al mismo tiempo. Sin garantías estrictas del motor,
dos usuarios podrían comprar la última unidad del mismo producto al mismo tiempo
(*Race Condition*) o un corte de energía a mitad de una transferencia dejaría el
dinero descontado de una cuenta sin haber llegado a la otra.

Las **Propiedades ACID** son el contrato de confiabilidad del motor relacional:
1. **Atomicidad (Atomicity)**: "Todo o nada". Una transacción compuesta por 5
   sentencias se aplica completa (`COMMIT`) o se revierte por completo (`ROLLBACK`).
2. **Consistencia (Consistency)**: Toda transacción lleva la base de datos de un
   estado válido a otro estado válido, respetando todas las restricciones
   (`PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK`, triggers).
3. **Aislamiento (Isolation)**: Las transacciones concurrentes no deben interferir
   entre sí ni ver estados intermedios corruptos de otras transacciones en vuelo.
4. **Durabilidad (Durability)**: Una vez confirmado el `COMMIT`, los datos quedan
   persistidos en almacenamiento no volátil (mediante el *Write-Ahead Log* / WAL
   o el *Rollback Journal*), incluso si el servidor se apaga un milisegundo después.

Anomalías clásicas de concurrencia y Niveles de Aislamiento (Estándar SQL):
- *Dirty Read* (Lectura sucia): Leer cambios de otra transacción que aún no ha
  hecho `COMMIT` (y que luego hace `ROLLBACK`).
- *Non-Repeatable Read*: Leer la misma fila dos veces en la misma transacción y
  obtener valores distintos porque otro hilo modificó y confirmó la fila.
- *Phantom Read* (Lectura fantasma): Ejecutar la misma consulta de rango dos
  veces y que aparezcan nuevas filas insertadas por otra transacción.
- *Lost Update* (Actualización perdida): Dos transacciones leen el mismo saldo
  (`100`), calculan en memoria (`100 - 20` y `100 - 30`) y la segunda sobrescribe
  el cambio de la primera.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Prevención de Sobreventa (*Overselling* en Checkout): Usar `BEGIN IMMEDIATE`
    (en SQLite) o `SELECT ... FOR UPDATE` / actualizaciones atómicas con guarda
    (`WHERE existencias >= :cantidad`) en motores cliente-servidor.
  - Procesamiento por Lotes con Recuperación Parcial (`SAVEPOINT`): Al procesar
    un pedido con 10 ítems o importar 50 facturas, crear un punto de guardado
    antes de un paso riesgoso y hacer `ROLLBACK TO SAVEPOINT` si ese sub-paso
    falla, sin perder el trabajo previo de la transacción principal.
  - Configuración de Alto Rendimiento en SQLite (`PRAGMA journal_mode = WAL`):
    Activar *Write-Ahead Logging* para que los lectores no bloqueen a los
    escritores ni los escritores bloqueen a los lectores.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Tipos de inicio de transacción en SQLite y control de bloqueo
BEGIN DEFERRED TRANSACTION;  -- (Por defecto) No adquiere bloqueo hasta la 1ra lectura/escritura
BEGIN IMMEDIATE TRANSACTION; -- Adquiere bloqueo reservado de escritura desde el primer instante
BEGIN EXCLUSIVE TRANSACTION; -- Impide cualquier otra conexión de lectura/escritura (en modo no-WAL)

-- B) Uso de SAVEPOINT para transacciones anidadas / recuperación parcial
BEGIN TRANSACTION;
    INSERT INTO pedidos (id, cliente_id, fecha, estado, total)
    VALUES (900, 1, '2026-03-01', 'pendiente', 18.00);

    SAVEPOINT sp_item_opcional;
    INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario)
    VALUES (900, 4, 1, 25.50);
    -- Si decidimos cancelar solo este ítem sin abortar el pedido 900:
    ROLLBACK TO SAVEPOINT sp_item_opcional;
    RELEASE SAVEPOINT sp_item_opcional;
COMMIT;

-- C) Patrón Optimistic Locking (Bloqueo Optimista mediante columna version)
-- UPDATE productos
-- SET existencias = existencias - 1, version = version + 1
-- WHERE id = 1 AND version = :version_leida_previamente AND existencias >= 1;

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: Procesamos una compra donde registramos el pedido y descontamos
stock. Además, intentamos aplicar un regalo promocional en un `SAVEPOINT`: si el
regalo no tiene stock suficiente, revertimos únicamente el regalo mediante
`ROLLBACK TO SAVEPOINT` y confirmamos el resto de la compra con éxito.
*/
-- BEGIN IMMEDIATE TRANSACTION;
--
-- -- 1. Insertamos pedido principal y su línea válida
-- INSERT INTO pedidos (id, cliente_id, fecha, estado, total)
-- VALUES (501, 1, '2026-03-10', 'pagado', 4.50);
--
-- INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario)
-- VALUES (501, 1, 1, 4.50);
--
-- UPDATE productos SET existencias = existencias - 1
-- WHERE id = 1 AND existencias >= 1;
--
-- -- 2. Intentamos agregar un ítem promocional en un SAVEPOINT
-- SAVEPOINT sp_regalo;
-- INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario)
-- VALUES (501, 4, 1, 0.00);
-- -- Como el producto 4 ('Teclado') tiene 0 existencias, deshacemos solo el regalo:
-- ROLLBACK TO SAVEPOINT sp_regalo;
-- RELEASE SAVEPOINT sp_regalo;
--
-- -- 3. Verificamos que el pedido 501 y su ítem 1 siguen intactos
-- SELECT p.id, p.estado, COUNT(dp.producto_id) AS items_confirmados
-- FROM pedidos p
-- INNER JOIN detalle_pedido dp ON dp.pedido_id = p.id
-- WHERE p.id = 501
-- GROUP BY p.id, p.estado;
--
-- ROLLBACK; -- Revertimos todo al final para no alterar la base de práctica
/*
Resultado esperado antes del ROLLBACK final:
+-----+--------+-------------------+
| id  | estado | items_confirmados |
+-----+--------+-------------------+
| 501 | pagado | 1                 |
+-----+--------+-------------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - MANTÉN LAS TRANSACCIONES CORTAS Y RÁPIDAS: Nunca hagas llamadas HTTP a
    pasarelas de pago ni esperes entrada del usuario mientras tienes una
    transacción abierta (`BEGIN`). Eso retiene bloqueos en la base de datos y
    congela a los demás usuarios.
  - EVITA EL ANTIPATRÓN "READ-MODIFY-WRITE" EN APLICACIÓN:
    Mal: `stock = SELECT existencias...` -> en código `nuevo = stock - 1` -> `UPDATE ... SET existencias = nuevo`.
    Bien: `UPDATE productos SET existencias = existencias - :cant WHERE id = :id AND existencias >= :cant`.
    Verifica cuántas filas fueron afectadas (`changes()` en SQLite); si es `0`,
    significa que no había stock suficiente y debes hacer `ROLLBACK`.
  - EN SQLITE CONCURRENTE, USA `BEGIN IMMEDIATE` PARA TRANSACCIONES DE ESCRITURA:
    Si inicias con `BEGIN DEFERRED`, haces un `SELECT` y luego intentas un
    `UPDATE` mientras otra conexión ya tomó el bloqueo de escritura, recibirás
    `SQLITE_BUSY` a mitad de transacción. `BEGIN IMMEDIATE` reserva el derecho de
    escritura desde el inicio y respeta `PRAGMA busy_timeout`.

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Ejecuta una transacción con `BEGIN`, actualiza el salario de todos los
   empleados sumando `500`, verifica el cambio con un `SELECT`, y luego ejecuta
   `ROLLBACK` para comprobar que la Atomicidad dejó los salarios intactos.
2. Consulta el modo de diario actual de SQLite con `PRAGMA journal_mode;` y el
   estado de claves foráneas con `PRAGMA foreign_keys;`.
3. Inicia una transacción, crea un `SAVEPOINT paso_1`, inserta una categoría de
   prueba, haz `ROLLBACK TO SAVEPOINT paso_1` y verifica que la categoría fue
   descartada sin cerrar la transacción principal (luego haz `COMMIT` o `ROLLBACK`).

[Intermedio]
4. Simula una transferencia de presupuesto salarial entre dos empleados en una
   transacción atómica: descuenta `200` del empleado con `id = 3` (solo si su
   salario es `>= 200`) y súmalos al empleado con `id = 2`. Verifica que la suma
   total de `empleados.salario` antes y después sea idéntica.
5. Usa la función `changes()` de SQLite inmediatamente después de un
   `UPDATE productos SET existencias = existencias - 50 WHERE id = 3 AND existencias >= 50`
   para demostrar que devuelve `0` filas afectadas cuando la guarda de stock
   impide la sobreventa.
6. Encadena dos `SAVEPOINT` (`sp_a` y `sp_b`) dentro de una misma transacción:
   inserta un registro antes de `sp_a`, otro después de `sp_a` y otro después de
   `sp_b`. Revierte solo `sp_b`, libera `sp_a` y comprueba qué filas sobreviven.
7. Demuestra la propiedad de Consistencia (C de ACID): dentro de una transacción,
   inserta un pedido válido y en la segunda sentencia intenta insertar un
   `detalle_pedido` con `cantidad = -5` (violando `CHECK`). Comprueba cómo el
   fallo impide confirmar un estado inválido.

[Senior / Producción]
8. Implementa el patrón **Optimistic Locking** (Bloqueo Optimista): crea una
   tabla temporal `cuentas_bancarias (id INT PRIMARY KEY, titular TEXT, saldo REAL, version INT DEFAULT 1)`.
   Simula dos hilos que leyeron `version = 1`: el primero ejecuta su `UPDATE ... WHERE id = 1 AND version = 1`
   incrementando `version = version + 1` (afecta 1 fila); el segundo intenta
   su `UPDATE ... WHERE id = 1 AND version = 1` y detecta colisión (afecta 0 filas).
9. Procesamiento de lote resiliente con `SAVEPOINT`: imagina la matriculación de
   un estudiante en 3 cursos dentro de una transacción, donde cada inscripción se
   protege con un `SAVEPOINT`. Si una inscripción ya existe (duplicado en
   `matriculas`), captura/revierte ese `SAVEPOINT` y continúa con el resto.
10. Auditoría de consistencia financiera: escribe una consulta diagnóstica que
    compare `pedidos.total` contra `SUM(detalle_pedido.cantidad * detalle_pedido.precio_unitario)`
    para detectar cualquier discrepancia contable entre cabeceras y líneas.
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
