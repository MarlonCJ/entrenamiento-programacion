/*
TEMA 18: FUNCIONES DE TEXTO, NUMERO Y FECHA

SQLite incluye funciones como lower, upper, length, substr, replace, round,
abs, date, datetime y strftime. Funciones de fecha aceptan representaciones
de tiempo reconocidas por SQLite. Cada motor tiene funciones y formatos
distintos, por lo que esta sintaxis es propia de SQLite.

Sintaxis:
SELECT upper(nombre), length(nombre), round(precio, 2)
FROM productos;
SELECT date('now'), strftime('%Y-%m', fecha_pedido)
FROM pedidos;

EJERCICIOS:
1. Muestra nombres de clientes en mayusculas.
2. Cuenta longitud de cada nombre.
3. Extrae primeros caracteres de un codigo con substr.
4. Reemplaza un caracter en una descripcion.
5. Redondea precios a dos decimales.
6. Calcula diferencia entre dos cantidades con abs.
7. Agrupa pedidos por ano con strftime.
8. Filtra registros de un mes determinado.
9. Crea etiqueta concatenando nombre y ciudad.
10. Presenta fecha en formato año-mes y explica la funcion usada.
*/
