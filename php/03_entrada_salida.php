<?php

declare(strict_types=1);

/*
TEMA 03: ENTRADA Y SALIDA POR CONSOLA

La salida presenta informacion con `echo` o `print`. La entrada de una
terminal se puede leer con `fgets(STDIN)`; incluye el salto de linea, que
puedes retirar con `trim`. La entrada leida es texto: conviertela cuando
necesites un numero, por ejemplo con `(int)` o `(float)`. En ejercicios
simples usa una lectura por cada dato solicitado y comunica que se espera.

Sintaxis:
echo "Escribe tu nombre: ";
$nombre = trim(fgets(STDIN));
echo "Hola, " . $nombre . PHP_EOL;
echo "Edad: ";
$edad = (int) trim(fgets(STDIN));
echo "El proximo ano tendras " . ($edad + 1) . PHP_EOL;

EJERCICIOS (cada programa solicita el dato indicado y muestra el resultado):
1. Pide el nombre y saluda a la persona.
2. Pide dos numeros y muestra su suma.
3. Pide el ano de nacimiento y muestra el valor ingresado.
4. Pide una temperatura en Celsius y muestra la conversion a Fahrenheit.
5. Pide el ancho y largo de un rectangulo; muestra su area.
6. Pide un precio y una cantidad; muestra el total de la compra.
7. Pide nombre y ciudad; presenta una frase que incluya ambos datos.
8. Pide tres notas y muestra el promedio.
9. Pide una cantidad de minutos y muestra su equivalente en segundos.
10. Pide el nombre de un producto y su precio; presenta una linea de recibo.

Prueba con entradas normales y con cero cuando aplique. Convierte el texto
de entrada al tipo numerico apropiado antes de hacer operaciones.
*/

// Zona de trabajo: escribe aqui tus soluciones.
