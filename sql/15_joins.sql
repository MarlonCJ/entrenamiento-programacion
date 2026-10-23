/*
TEMA 15: RELACIONAR TABLAS CON JOIN

JOIN combina filas relacionadas por una condicion. INNER JOIN conserva solo
coincidencias; LEFT JOIN conserva todas las filas izquierdas y agrega NULL
cuando no hay coincidencia. Especifica la condicion ON usando claves. Un join
sin condicion puede crear un producto cartesiano no intencional.

Sintaxis:
SELECT pedidos.id, clientes.nombre
FROM pedidos
INNER JOIN clientes ON pedidos.cliente_id = clientes.id;

EJERCICIOS:
1. Muestra pedidos con el nombre de su cliente.
2. Lista productos con el nombre de su categoria.
3. Usa LEFT JOIN para listar todos los clientes, incluso sin pedidos.
4. Busca estudiantes y sus cursos mediante tabla de matriculas.
5. Muestra detalle de cada pedido con nombre de producto.
6. Cuenta pedidos por cliente usando join.
7. Encuentra clientes sin pedidos con LEFT JOIN.
8. Une tres tablas para presentar una factura.
9. Compara INNER JOIN y LEFT JOIN sobre los mismos datos.
10. Corrige una consulta que une tablas con claves equivocadas.
*/
