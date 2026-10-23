<?php

declare(strict_types=1);

/*
TEMA 12: ARREGLOS

Un arreglo guarda varios valores bajo una misma variable. Los arreglos
indexados empiezan en indice 0. `count` obtiene la cantidad de elementos;
`foreach` recorre cada valor y `[]` agrega un elemento. Un arreglo vacio se
escribe `[]`. Al acceder por indice, verifica que exista para evitar errores.

Sintaxis:
$notas = [8, 9, 7];
$primera = $notas[0];
$notas[] = 10;
foreach ($notas as $nota) {
    echo $nota . PHP_EOL;
}

EJERCICIOS:
1. Crea una lista de cinco numeros y muestralos uno por linea.
2. Suma todos los numeros de una lista.
3. Calcula el promedio de una lista numerica no vacia.
4. Encuentra el mayor de una lista sin usar max.
5. Cuenta cuantas veces aparece un valor objetivo.
6. Cuenta cuantos valores son pares.
7. Crea una nueva lista con los elementos en orden inverso sin usar array_reverse.
8. Combina dos listas de nombres en una tercera lista.
9. Encuentra el menor y el mayor de una lista no vacia.
10. Separa una lista de enteros en una lista de pares y otra de impares.

Prueba listas vacias cuando corresponda, un elemento y valores repetidos.
*/

// Zona de trabajo: escribe aqui tus soluciones.
