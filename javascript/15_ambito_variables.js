/*
TEMA 15: AMBITO Y VIDA DE LAS VARIABLES

El ambito determina donde se puede usar un nombre. `let` y `const` tienen
ambito de bloque; `var` tiene ambito de funcion y puede causar confusiones.
Los parametros y variables creadas dentro de una funcion son locales. Una
funcion puede conservar variables externas mediante una clausura (closure).
Prefiere pasar dependencias como parametros en vez de modificar estado global.

Sintaxis:
const tasa = 0.1;
function calcular(precio, porcentaje) {
  const descuento = precio * porcentaje;
  return precio - descuento;
}
console.log(calcular(100, tasa));

EJERCICIOS:
1. Muestra que una variable declarada dentro de una funcion es local.
2. Pasa una tasa como argumento en vez de leer una variable global.
3. Crea dos funciones con variables locales del mismo nombre.
4. Explica con codigo la diferencia entre parametro y variable global.
5. Devuelve un resultado sin modificar una variable externa.
6. Compara el ambito de let y var dentro de un bloque.
7. Pasa una configuracion a dos funciones de forma explicita.
8. Corrige un ejemplo que depende de estado global mutable.
9. Crea una funcion que use una clausura como contador privado.
10. Diseña funciones que reciban dependencias y eviten estado oculto.
*/

// Zona de trabajo: escribe aqui tus soluciones.
