/*
TEMA 18: LECTURA Y ESCRITURA DE ARCHIVOS

Node.js incluye `node:fs/promises` para operaciones asincronas de archivos.
`readFile` devuelve una promesa y puede recibir la codificacion "utf8";
`writeFile` crea o reemplaza un archivo, mientras `appendFile` agrega datos.
Usa try/catch para errores de acceso y rutas de prueba controladas. No escribas
encima de archivos del sistema o datos que quieras conservar.

Sintaxis:
const fs = require("node:fs/promises");
async function ejemplo() {
  const texto = await fs.readFile("datos.txt", "utf8");
  await fs.writeFile("salida.txt", texto);
}

EJERCICIOS:
1. Escribe una frase en un archivo de practica.
2. Lee y muestra el contenido de un archivo de notas.
3. Cuenta cuantas lineas tiene un archivo.
4. Agrega una linea sin borrar el contenido existente.
5. Guarda nombres, uno por linea, y luego vuelve a leerlos.
6. Cuenta los caracteres de un archivo de texto.
7. Maneja el caso de que el archivo solicitado no exista.
8. Copia un archivo de entrada a otro archivo de salida.
9. Cuenta las palabras guardadas en un archivo.
10. Lee un registro de gastos y calcula el total.

Las operaciones indicadas son asincronas: espera sus promesas con await.
*/

// Zona de trabajo: escribe aqui tus soluciones.
