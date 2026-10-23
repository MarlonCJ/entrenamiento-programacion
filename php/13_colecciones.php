<?php

declare(strict_types=1);

/*
TEMA 13: COLECCIONES, MAPAS Y CONJUNTOS

PHP usa arreglos tanto como listas indexadas como mapas clave-valor. Las claves
pueden ser enteros o cadenas. Un conjunto de valores unicos se puede representar
con claves de un mapa o con funciones como array_unique. Recorre mapas con
`foreach ($mapa as $clave => $valor)` y comprueba claves con array_key_exists.

Sintaxis:
$edades = ['Ana' => 20, 'Luis' => 25];
foreach ($edades as $nombre => $edad) {
    echo "$nombre: $edad" . PHP_EOL;
}
$unicos = array_unique([2, 2, 3]);

EJERCICIOS:
1. Crea un mapa de tres productos y sus precios; muestra cada par.
2. Calcula el total de cantidades guardadas por nombre de producto.
3. Cuenta cuantas veces aparece cada palabra de una frase.
4. Crea una lista sin duplicados sin alterar el orden original.
5. Guarda nombres y notas en un mapa y encuentra la nota de un nombre.
6. Actualiza el precio asociado a una clave existente.
7. Combina dos mapas de configuracion y explica como resuelves claves repetidas.
8. Agrupa una lista de numeros por pares e impares en un mapa.
9. Comprueba si una clave existe antes de leer su valor.
10. Crea un inventario por producto y muestra los productos con cantidad cero.
*/

// Zona de trabajo: escribe aqui tus soluciones.
