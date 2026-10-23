<?php

declare(strict_types=1);

/*
TEMA 16: RECURSION

Una funcion recursiva se llama a si misma para resolver una version menor
del problema. Debe tener un caso base que termine la cadena de llamadas y
un paso recursivo que acerque la entrada al caso base. Sin ambos, puede
producirse recursion infinita. Para problemas sencillos tambien compara
la solucion recursiva con una iterativa.

Sintaxis:
function cuentaAtras(int $n): void
{
    if ($n <= 0) {
        return; // caso base
    }
    echo $n . PHP_EOL;
    cuentaAtras($n - 1);
}

EJERCICIOS:
1. Crea una funcion recursiva que cuente desde n hasta 0.
2. Calcula recursivamente la suma de 1 hasta n.
3. Calcula el factorial recursivamente, con factorial(0) igual a 1.
4. Calcula la potencia entera de una base usando recursion.
5. Cuenta los digitos de un entero positivo de forma recursiva.
6. Suma los digitos de un entero no negativo.
7. Encuentra el maximo de una lista usando recursion.
8. Invierte una cadena mediante llamadas recursivas.
9. Calcula el termino n de Fibonacci y observa el costo del metodo simple.
10. Define caso base y avance para comprobar recursivamente si una cadena es palindromo.
*/

// Zona de trabajo: escribe aqui tus soluciones.
