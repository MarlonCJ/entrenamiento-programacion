/*
TEMA 07: OPERADORES ARITMETICOS EN CONSULTAS

Las expresiones SELECT pueden calcular con +, -, *, / y %. El resultado
puede recibir un alias con AS. SQLite realiza division entera cuando ambos
operandos son enteros; multiplica por 1.0 o usa REAL si necesitas decimales.
Una division entre cero devuelve NULL en SQLite, comportamiento que puede
diferir de otros motores.

Sintaxis:
SELECT precio, cantidad, precio * cantidad AS subtotal
FROM detalle_pedido;
SELECT 7 / 2 AS division_entera, 7.0 / 2 AS division_decimal;

EJERCICIOS:
1. Calcula subtotal de precio por cantidad.
2. Calcula precio con impuesto a partir de una columna precio.
3. Calcula descuento como porcentaje del precio.
4. Convierte una duracion en minutos a segundos.
5. Calcula saldo restante restando un retiro.
6. Calcula promedio de dos columnas numericas.
7. Calcula precio unitario descontando un porcentaje.
8. Divide ventas entre cantidad y evita interpretar mal division entera.
9. Calcula metros cuadrados a partir de ancho y largo.
10. Crea consulta de factura con subtotal, impuesto y total como alias.
*/
