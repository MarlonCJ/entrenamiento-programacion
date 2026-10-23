/*
TEMA 14: UPDATE Y DELETE

UPDATE modifica filas; DELETE las elimina. En ambos casos WHERE es crucial:
sin filtro se modifican o borran todas las filas. Antes de actualizar, prueba
el mismo WHERE con SELECT para comprobar que selecciona exactamente los
registros deseados. SQLite soporta transacciones para poder agrupar cambios.

Sintaxis:
UPDATE productos SET precio = precio * 1.05
WHERE categoria_id = 2;
DELETE FROM productos WHERE existencias = 0;

EJERCICIOS:
1. Actualiza el precio de un producto por su id.
2. Incrementa stock de una categoria.
3. Cambia el correo de un cliente.
4. Desactiva productos sin existencias.
5. Elimina un registro de prueba por identificador.
6. Actualiza varias filas con un WHERE preciso.
7. Predice que pasaria si ejecutas UPDATE sin WHERE.
8. Escribe SELECT equivalente para revisar un DELETE antes de ejecutarlo.
9. Reduce existencias despues de una venta y evita stock negativo.
10. Practica actualizar y borrar dentro de una transaccion de prueba.
*/
