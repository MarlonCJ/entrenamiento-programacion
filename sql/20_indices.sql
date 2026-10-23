/*
TEMA 20: INDICES Y RENDIMIENTO

Un indice ayuda al motor a localizar filas sin recorrer toda la tabla, a costa
de espacio y trabajo adicional en INSERT/UPDATE/DELETE. CREATE INDEX puede
cubrir una o varias columnas. No indexes todo: elige columnas frecuentes en
filtros y joins. EXPLAIN QUERY PLAN muestra como SQLite planea una consulta.

Sintaxis:
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
EXPLAIN QUERY PLAN SELECT * FROM pedidos WHERE cliente_id = 3;
DROP INDEX IF EXISTS idx_pedidos_cliente;

EJERCICIOS:
1. Crea indice sobre clave foranea usada en join.
2. Consulta EXPLAIN QUERY PLAN antes y despues del indice.
3. Crea indice para busqueda frecuente por correo.
4. Crea indice compuesto para dos columnas filtradas juntas.
5. Elimina un indice de practica.
6. Explica el costo de mantener indices al actualizar.
7. Decide si conviene indexar una columna con dos valores posibles.
8. Busca duplicados antes de crear indice UNIQUE.
9. Interpreta si el plan usa SEARCH o SCAN en SQLite.
10. Justifica indices para un conjunto de consultas realistas.
*/
