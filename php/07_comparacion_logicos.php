<?php

declare(strict_types=1);

/*
TEMA 07: OPERADORES DE COMPARACION Y LOGICOS

Las comparaciones `===`, `!==`, `<`, `>`, `<=` y `>=` producen un booleano.
Prefiere `===` y `!==` para que PHP compare tambien el tipo. Los operadores
`&&` y `and` expresan Y; `||` y `or` expresan O; `!` niega una condicion.
Usa parentesis para expresar con claridad el orden cuando combinas condiciones.

Sintaxis:
$edad = 20;
$tienePermiso = true;
$puedeEntrar = ($edad >= 18) && $tienePermiso;
$estaFuera = ($edad < 0) || ($edad > 120);
$noActivo = !$tienePermiso;

EJERCICIOS:
1. Comprueba si una edad es mayor o igual a 18.
2. Comprueba si un numero esta dentro del rango inclusivo de 1 a 10.
3. Determina si una nota aprueba y esta dentro del rango 0 a 100.
4. Comprueba si un entero es multiplo de 3 o de 5.
5. Decide si una persona tiene acceso por edad y autorizacion.
6. Determina si un anio es bisiesto combinando comparaciones y logicos.
7. Comprueba que un usuario no este bloqueado y tenga intentos disponibles.
8. Indica si una temperatura esta fuera del rango entre 18 y 26 grados.
9. Compara dos textos distinguiendo igualdad de valor y de tipo.
10. Evalua condiciones mezcladas y agrega parentesis para hacerlas legibles.
*/

// Zona de trabajo: escribe aqui tus soluciones.
