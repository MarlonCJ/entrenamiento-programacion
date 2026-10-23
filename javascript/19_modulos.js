/*
TEMA 19: MODULOS

Los modulos separan el codigo en archivos reutilizables. Node.js soporta
CommonJS (`require`, `module.exports`) y ECMAScript Modules (`import`, `export`).
Este proyecto usa CommonJS por simplicidad en la terminal; para usar import/
export en Node, configura el proyecto para ESM. Exporta solo lo que otro
archivo necesita y evita crear dependencias circulares.

Sintaxis CommonJS:
// matematicas.js: module.exports = { sumar };
const { sumar } = require("./matematicas.js");
console.log(sumar(2, 3));

EJERCICIOS:
1. Exporta una funcion de saludo y usala desde un segundo archivo.
2. Separa operaciones matematicas en un modulo reutilizable.
3. Crea un modulo de conversion de temperaturas.
4. Exporta constantes de configuracion desde un archivo aparte.
5. Importa una funcion y renombrala al extraerla del modulo.
6. Crea un modulo con dos funciones y exporta solo las necesarias.
7. Organiza un modulo de utilidades para texto.
8. Crea un archivo principal que use dos modulos propios.
9. Explica el error que ocurre si una ruta de require es incorrecta.
10. Divide un programa pequeno en modulos por responsabilidad.
*/

// Zona de trabajo: escribe aqui tus soluciones.
