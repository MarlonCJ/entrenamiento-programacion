/*
TEMA 16: RECURSION

Una funcion recursiva se llama para resolver una entrada menor. Necesita un
caso base y un paso que progrese hacia el. TypeScript comprueba los tipos de
parametros y retornos, pero no prueba que la recursion termine. Para entradas
grandes, compara con una solucion iterativa o memorizada.

Sintaxis:
function cuentaAtras(n: number): void {
  if (n <= 0) return;
  console.log(n);
  cuentaAtras(n - 1);
}

EJERCICIOS:
1. Cuenta recursivamente de n a cero.
2. Suma de 1 hasta n.
3. Factorial con caso base cero.
4. Potencia entera recursiva.
5. Cuenta digitos de un entero positivo.
6. Suma digitos de entero no negativo.
7. Encuentra maximo de arreglo recursivamente.
8. Invierte cadena recursivamente.
9. Calcula Fibonacci y cuenta llamadas.
10. Comprueba palindromo recursivamente.
*/

// Zona de trabajo: escribe aqui tus soluciones.
