<?php

declare(strict_types=1);

/*
TEMA 09: CONDICIONALES

`if` ejecuta un bloque cuando una expresion booleana es verdadera.
`elseif` permite probar otra condicion y `else` cubre los demas casos.
PHP compara con operadores como ===, <, >= y combina condiciones con && y ||.
Las llaves delimitan cada bloque. Ordena las condiciones desde el caso mas
especifico al general para que ningun caso quede oculto.

Sintaxis:
if ($edad >= 18) {
    echo "Mayor de edad";
} elseif ($edad >= 13) {
    echo "Adolescente";
} else {
    echo "Menor";
}

EJERCICIOS:
1. Pide un entero e indica si es positivo, negativo o cero.
2. Pide una edad e indica si puede votar (usa 18 como minimo).
3. Pide un entero e indica si es par o impar.
4. Pide dos numeros e indica cual es mayor o si son iguales.
5. Pide tres numeros e muestra cual es el mayor; contempla empates.
6. Pide una nota de 0 a 100 e indica si aprueba con minimo 60.
7. Pide un ano e indica si es bisiesto (divisible por 400, o por 4 pero no 100).
8. Pide el monto de una compra y aplica 10% de descuento si supera 100.
9. Pide tres longitudes e indica si pueden formar un triangulo.
10. Pide un caracter y determina si es vocal o consonante.

Para cada problema identifica primero las condiciones y que ocurre en cada caso.
*/

// Zona de trabajo: escribe aqui tus soluciones.
