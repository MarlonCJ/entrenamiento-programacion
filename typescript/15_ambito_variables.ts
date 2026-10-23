/*
TEMA 15: AMBITO Y CIERRES

`let` y `const` tienen alcance de bloque; parametros y variables locales viven
dentro de su funcion. Una clausura (closure) conserva acceso al ambito donde
se creo. Los modulos tambien tienen su propio ambito. Prefiere pasar valores
por parametros en vez de modificar estado global compartido.

Sintaxis:
function crearContador(): () => number {
  let valor = 0;
  return () => ++valor;
}

EJERCICIOS:
1. Demuestra que una variable local no es accesible fuera de su funcion.
2. Pasa tasa como parametro, no como global.
3. Usa el mismo nombre local en funciones distintas.
4. Compara parametro y variable de modulo.
5. Devuelve un calculo sin modificar datos externos.
6. Compara let en bloque con var en bloque.
7. Pasa configuracion a varias funciones.
8. Refactoriza estado global mutable en parametros.
9. Crea un contador privado mediante closure.
10. Disena funciones sin dependencias ocultas.
*/

// Zona de trabajo: escribe aqui tus soluciones.
