/*
TEMA 06: FILTRAR CON WHERE, IN, BETWEEN Y LIKE

WHERE selecciona filas segun condiciones. IN compara con un conjunto de
valores; BETWEEN incluye ambos extremos; LIKE busca patrones con % (cero o
mas caracteres) y _ (un caracter). En SQLite, LIKE no distingue mayusculas
ASCII de la misma forma que Unicode; revisa el motor si importan acentos.

Sintaxis:
SELECT nombre FROM productos WHERE precio BETWEEN 5 AND 20;
SELECT nombre FROM productos WHERE categoria IN ('Libros', 'Papeleria');
SELECT nombre FROM clientes WHERE nombre LIKE 'A%';

EJERCICIOS:
1. Filtra productos con precio entre dos limites.
2. Busca pedidos de una lista de estados con IN.
3. Encuentra nombres que comienzan por una letra.
4. Encuentra correos que terminan en un dominio usando LIKE.
5. Filtra apellidos con cierta letra en la segunda posicion.
6. Excluye varias categorias con NOT IN.
7. Encuentra fechas dentro de un rango inclusivo.
8. Filtra valores que contienen una palabra.
9. Combina BETWEEN con una condicion de disponibilidad.
10. Escribe tres patrones LIKE y explica que coincide en cada uno.
*/
