/*
TEMA 10: ORDENAR Y LIMITAR RESULTADOS

ORDER BY ordena por una o varias expresiones; ASC es ascendente y DESC
descendente. LIMIT restringe filas devueltas. Un orden no es estable si no
incluyes una clave que desempate. OFFSET omite filas, aunque para paginacion
grande suele convenir una clave de continuacion.

Sintaxis:
SELECT nombre, precio FROM productos
ORDER BY precio DESC, nombre ASC
LIMIT 10;

EJERCICIOS:
1. Ordena productos del menor al mayor precio.
2. Ordena estudiantes alfabeticamente por apellido y nombre.
3. Muestra los cinco pedidos mas recientes.
4. Encuentra los tres productos mas costosos.
5. Ordena por categoria y luego por stock descendente.
6. Pagina resultados con LIMIT y OFFSET.
7. Agrega una columna de desempate para que el orden sea determinista.
8. Muestra los diez clientes primeros alfabeticamente.
9. Ordena valores NULL y observa el comportamiento de SQLite.
10. Presenta ranking de ventas con orden y limite.
*/
