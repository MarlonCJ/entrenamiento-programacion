<?php

declare(strict_types=1);

/*
TEMA 04: CONVERSION Y VALIDACION DE DATOS

La entrada externa suele llegar como texto. Convierte explicitamente con
`(int)`, `(float)` o `(string)` cuando corresponda. La conversion puede perder
informacion, por eso valida antes de usar el dato. `filter_var` con filtros
como FILTER_VALIDATE_INT ayuda a comprobar formatos; `is_numeric` comprueba
si un valor es numerico. No confundas una cadena vacia con el numero cero.

Sintaxis:
$texto = "42";
$numero = (int) $texto;
$esEnteroValido = filter_var($texto, FILTER_VALIDATE_INT) !== false;
$esNumero = is_numeric("3.5");

EJERCICIOS:
1. Convierte una cadena con digitos a entero y muestra el tipo del resultado.
2. Convierte una cadena decimal a float y calcula el doble.
3. Pide una edad y verifica que sea un entero mayor o igual a cero.
4. Pide un precio y rechaza entradas vacias o no numericas.
5. Convierte segundos ingresados como texto a minutos y segundos restantes.
6. Valida que una cantidad ingresada sea un entero entre 1 y 100.
7. Recibe dos valores de texto y muestra su suma solo si ambos son numericos.
8. Convierte una temperatura ingresada y comprueba que sea un valor numerico.
9. Distingue entre entrada vacia, cero y una entrada entera valida.
10. Solicita una nota y repite la validacion hasta recibir un valor de 0 a 100.

Piensa que tipo necesitas, que entradas no son validas y como comunicarlas.
*/

// Zona de trabajo: escribe aqui tus soluciones.
