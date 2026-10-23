<?php

declare(strict_types=1);

/*
TEMA 18: LECTURA Y ESCRITURA DE ARCHIVOS

PHP ofrece funciones como file_get_contents para leer y file_put_contents
para escribir. Comprueba errores: ambas pueden devolver false. Usa rutas
explicitas y escribe solo en archivos de practica. Los modos de fopen controlan
lectura/escritura; si abres manualmente un archivo, cierralo con fclose.

Sintaxis:
$contenido = file_get_contents(__DIR__ . '/datos.txt');
if ($contenido === false) {
    throw new RuntimeException('No se pudo leer el archivo');
}
file_put_contents(__DIR__ . '/salida.txt', "Primera linea\n");

EJERCICIOS:
1. Escribe una frase en un archivo de texto y confirma el resultado.
2. Lee y muestra el contenido de un archivo de notas.
3. Cuenta cuantas lineas tiene un archivo.
4. Agrega una nueva linea sin borrar el contenido existente.
5. Guarda una lista de nombres, uno por linea, y luego leela.
6. Calcula el numero de caracteres de un archivo de texto.
7. Maneja el caso en que el archivo solicitado no existe.
8. Copia el contenido de un archivo de entrada a otro de salida.
9. Lee un archivo y cuenta las palabras que contiene.
10. Crea un pequeno registro de gastos y calcula el total leido desde archivo.

Usa archivos de prueba del proyecto; verifica siempre si la lectura o escritura fallo.
*/

// Zona de trabajo: escribe aqui tus soluciones.
