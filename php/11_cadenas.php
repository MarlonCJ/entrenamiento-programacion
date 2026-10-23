<?php

declare(strict_types=1);

/*
TEMA 11: CADENAS DE TEXTO

Una cadena es texto entre comillas. En PHP, `.` concatena cadenas; `+` no
sirve para unir texto. Las cadenas se pueden interpolar con comillas dobles.
Funciones utiles: strlen cuenta bytes (no siempre caracteres Unicode),
strtolower cambia a minusculas, strtoupper a mayusculas y trim quita espacios
en los extremos. Accede a caracteres con corchetes empezando en indice 0.

Sintaxis:
$nombre = "Ana";
$mensaje = "Hola, " . $nombre;
$tambien = "Hola, $nombre";
$minusculas = strtolower($mensaje);
$primero = $nombre[0];

EJERCICIOS:
1. Pide un nombre y muestra cuantos caracteres tiene.
2. Recibe una frase y muestrala en mayusculas y en minusculas.
3. Cuenta cuantas vocales sin tilde tiene un texto.
4. Cuenta cuantas veces aparece una letra indicada en una frase.
5. Invierte una palabra sin usar una funcion de inversion ya hecha.
6. Determina si una palabra es palindromo ignorando mayusculas.
7. Cuenta las palabras de una frase separada por espacios.
8. Reemplaza cada espacio de una frase por un guion.
9. Pide nombre y apellido y crea un correo ficticio en minusculas separado por punto.
10. Elimina espacios al principio y al final y muestra el texto resultante.

Prueba cadenas vacias, mayusculas, espacios y caracteres repetidos.
*/

// Zona de trabajo: escribe aqui tus soluciones.
