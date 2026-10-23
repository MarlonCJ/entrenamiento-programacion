/*
TEMA 18: ARCHIVOS CON NODE.JS

Node ofrece `node:fs/promises` con promesas tipadas para archivos. readFile
puede devolver Buffer o texto segun codificacion; writeFile reemplaza y
appendFile agrega. Usa await y maneja errores de acceso. Las declaraciones
de tipos describen la API, pero la ruta sigue siendo un dato de ejecucion.

Sintaxis:
import { readFile, writeFile } from "node:fs/promises";
async function copiar(): Promise<void> {
  const texto: string = await readFile("datos.txt", "utf8");
  await writeFile("salida.txt", texto);
}

EJERCICIOS:
1. Escribe frase en archivo temporal de practica.
2. Lee y muestra archivo UTF-8.
3. Cuenta lineas.
4. Agrega linea sin reemplazar contenido.
5. Guarda y lee lista de nombres.
6. Cuenta caracteres de un texto.
7. Maneja ruta inexistente.
8. Copia texto entre archivos.
9. Cuenta palabras en archivo.
10. Lee gastos y calcula total con conversion validada.
*/

// Zona de trabajo: escribe aqui tus soluciones.
