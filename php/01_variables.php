<?php

declare(strict_types=1);

/*
TEMA 01: VARIABLES Y TIPOS DE DATOS

Una variable es un nombre asociado a un valor que el programa puede consultar
y cambiar. En PHP, los nombres de variable empiezan con `$`; el signo forma
parte de la sintaxis cada vez que declaras, lees o reasignas la variable.
PHP determina el tipo a partir del valor, aunque tambien puedes declarar
tipos en parametros y funciones. Los tipos basicos incluyen int, float,
string y bool. Usa `const` para constantes que no deben cambiar.

Sintaxis:
$nombre = "Ana";             // string
$edad = 20;                  // int
$altura = 1.65;              // float
$estudia = true;             // bool
$edad = $edad + 1;           // reasignar un valor
const PAIS = "Colombia";     // constante
echo $nombre . PHP_EOL;      // mostrar un valor

EJERCICIOS (resuelve los diez):
1. Crea variables para tu nombre, edad y ciudad, y muestra una frase con ellas.
2. Guarda el precio de un producto y la cantidad comprada; muestra ambos.
3. Guarda una temperatura en Celsius y muestra el dato junto a la unidad.
4. Crea dos variables enteras, intercambia sus valores y muestra el resultado.
5. Guarda nombre y apellido por separado y muestra el nombre completo.
6. Crea una variable booleana que indique si completaste este tema y muestrala.
7. Guarda el ancho y alto de una habitacion y muestra ambos valores etiquetados.
8. Crea una constante para el nombre de tu pais y muestra su valor.
9. Actualiza el saldo de una cuenta despues de asignarle un nuevo valor.
10. Guarda nombre de un curso, numero de lecciones y duracion, y presenta los datos.
*/

// Zona de trabajo: escribe aqui tus soluciones.
