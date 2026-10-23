/*
TEMA 04: CONVERSION Y VALIDACION DE DATOS

JavaScript permite conversion explicita con Number, String y Boolean.
`Number(texto)` produce NaN cuando el texto no representa un numero;
comprueba con Number.isNaN o Number.isFinite antes de operar. `parseInt` y
`parseFloat` leen un prefijo, por lo que pueden aceptar parcialmente texto
invalido. Valida el formato y el rango esperado antes de usar una entrada.

Sintaxis:
const numero = Number("42");
const esValido = Number.isFinite(numero);
const texto = String(numero);
const vacio = Number.isNaN(Number("hola"));

EJERCICIOS:
1. Convierte una cadena con digitos a numero y muestra su tipo.
2. Convierte una cadena decimal y calcula el doble.
3. Pide una edad y verifica que sea un entero mayor o igual a cero.
4. Pide un precio y rechaza entradas vacias o no numericas.
5. Convierte segundos ingresados como texto a minutos y segundos restantes.
6. Valida una cantidad entera entre 1 y 100.
7. Suma dos entradas solo si ambas se convierten en numeros finitos.
8. Valida que la temperatura ingresada sea un valor numerico finito.
9. Distingue una entrada vacia, el texto "0" y un numero cero.
10. Solicita una nota y vuelve a pedirla hasta recibir un valor entre 0 y 100.

No confundas NaN con cero ni una cadena vacia con una entrada valida.
*/

// Zona de trabajo: escribe aqui tus soluciones.
