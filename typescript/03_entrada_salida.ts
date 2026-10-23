/*
TEMA 03: ENTRADA Y SALIDA

`console.log` muestra salida. En Node.js puedes leer texto desde la terminal
con `node:readline/promises`. `question` devuelve Promise<string>, por lo que
se usa `await` dentro de una funcion async. La entrada es texto: convierte y
valida antes de operar. Cierra la interfaz al terminar.

Sintaxis:
async function ejemplo(): Promise<void> {
  const { createInterface } = await import("node:readline/promises");
  const { stdin, stdout } = await import("node:process");
  const entrada = createInterface({ input: stdin, output: stdout });
  const nombre: string = await entrada.question("Nombre: ");
  console.log(`Hola, ${nombre}`);
  entrada.close();
}

EJERCICIOS (programas interactivos):
1. Pide un nombre y muestra un saludo.
2. Solicita dos numeros y muestra la suma.
3. Pide un ano de nacimiento y muestra el valor ingresado.
4. Pide Celsius y convierte a Fahrenheit.
5. Solicita ancho y largo y calcula el area de rectangulo.
6. Pide precio y cantidad y calcula el total.
7. Solicita nombre y ciudad y presenta ambos.
8. Pide tres notas y muestra su promedio.
9. Convierte minutos ingresados a segundos.
10. Pide producto y precio y presenta una linea de recibo.

Decide que datos necesitan conversion y que ocurre si no son numericos.
*/

// Zona de trabajo: escribe aqui tus soluciones.
