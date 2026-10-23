/*
TEMA 16: RECURSION

Una funcion recursiva se llama a si misma para resolver una entrada menor.
Necesita un caso base que termine las llamadas y un paso que se acerque a ese
caso. Sin ellos, ocurrira recursion sin fin y se agotara la pila de llamadas.
La recursion es natural en estructuras anidadas; para grandes entradas,
compara tambien una solucion iterativa.

Sintaxis:
function cuentaAtras(n) {
  if (n <= 0) return; // caso base
  console.log(n);
  cuentaAtras(n - 1);
}

EJERCICIOS:
1. Crea una funcion recursiva que cuente desde n hasta 0.
2. Calcula recursivamente la suma de 1 hasta n.
3. Calcula factorial con factorial(0) igual a 1.
4. Calcula una potencia entera de forma recursiva.
5. Cuenta los digitos de un entero positivo.
6. Suma los digitos de un entero no negativo.
7. Encuentra el maximo de un arreglo recursivamente.
8. Invierte una cadena mediante llamadas recursivas.
9. Calcula Fibonacci y observa cuantas llamadas hace el metodo simple.
10. Comprueba recursivamente si una cadena es palindromo.
*/

// Zona de trabajo: escribe aqui tus soluciones.
