/*
TEMA 22: PRUEBAS Y DEPURACION

Una prueba comprueba un resultado esperado. Node incluye `node:assert/strict`
para aserciones; tambien puedes usar el ejecutor integrado `node:test`.
Prueba casos normales, limites y entradas invalidas. Para depurar, VS Code
permite poner breakpoints, ejecutar paso a paso e inspeccionar variables.
Un mensaje de error debe ayudarte a localizar el problema, no ocultarlo.

Sintaxis:
const assert = require("node:assert/strict");
function sumar(a, b) { return a + b; }
assert.equal(sumar(2, 3), 5);

EJERCICIOS:
1. Escribe tres pruebas para sumar, incluyendo un negativo.
2. Prueba la paridad con positivo, negativo y cero.
3. Identifica los limites para una funcion de promedio.
4. Escribe una asercion para una funcion de saludo.
5. Prueba que el factorial de cero es uno.
6. Provoca un error de indice y usa el depurador para encontrar la causa.
7. Prueba cadenas vacias, mayusculas y espacios.
8. Compara el resultado real y esperado con un mensaje claro.
9. Divide una funcion compleja en casos de prueba pequenos.
10. Documenta casos normales, limite e invalidos para una funcion propia.
*/

// Zona de trabajo: escribe aqui tus soluciones.
