/*
TEMA 03: ENTRADA Y SALIDA POR CONSOLA

`console.log` presenta informacion. Para leer texto con Node.js puedes usar
el modulo integrado `node:readline/promises`. La respuesta de `question` es
una cadena, incluso si el usuario escribe numeros; conviertela con `Number`
antes de calcular. Cierra la interfaz al terminar para que Node pueda salir.

Sintaxis (dentro de una funcion async):
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const input = readline.createInterface({ input: stdin, output: stdout });
const nombre = await input.question("Nombre: ");
const edad = Number(await input.question("Edad: "));
input.close();
console.log(`Hola, ${nombre}. El proximo ano tendras ${edad + 1}.`);

EJERCICIOS (cada programa solicita los datos y muestra el resultado):
1. Pide el nombre y saluda a la persona.
2. Pide dos numeros y muestra su suma.
3. Pide el ano de nacimiento y muestra el valor ingresado.
4. Pide una temperatura en Celsius y muestra la conversion a Fahrenheit.
5. Pide el ancho y largo de un rectangulo; muestra su area.
6. Pide un precio y una cantidad; muestra el total de la compra.
7. Pide nombre y ciudad; presenta una frase que incluya ambos datos.
8. Pide tres notas y muestra el promedio.
9. Pide una cantidad de minutos y muestra su equivalente en segundos.
10. Pide el nombre de un producto y su precio; presenta una linea de recibo.

Convierte a Number cada dato que uses como numero y prueba con cero.
*/

// Zona de trabajo: escribe aqui tus soluciones.
