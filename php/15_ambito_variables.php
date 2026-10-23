<?php

declare(strict_types=1);

/*
TEMA 15: AMBITO Y VIDA DE LAS VARIABLES

El ambito determina donde puede usarse una variable. Las variables declaradas
dentro de una funcion son locales. Una variable global no se vuelve local por
estar declarada fuera; se puede pasar como parametro (recomendado) o acceder
con `global`. Las constantes tienen un ambito distinto y pueden definirse
para reutilizar configuracion. Evita depender de estado global oculto.

Sintaxis:
$tasa = 0.1;
function calcular(float $precio, float $tasa): float
{
    $descuento = $precio * $tasa; // local
    return $precio - $descuento;
}

EJERCICIOS:
1. Muestra que una variable local solo se usa dentro de su funcion.
2. Pasa una tasa como parametro en vez de leer una variable global.
3. Crea dos funciones con variables locales del mismo nombre.
4. Explica mediante un ejemplo la diferencia entre parametro y variable global.
5. Escribe una funcion que devuelva un resultado sin modificar una variable externa.
6. Compara el alcance de una variable creada dentro de un bloque y dentro de funcion.
7. Pasa una configuracion a dos funciones usando parametros.
8. Detecta y corrige un ejemplo que depende de global.
9. Usa una constante compartida y una variable local en una misma funcion.
10. Diseña funciones que reciban datos explicitamente y no dependan de estado oculto.
*/

// Zona de trabajo: escribe aqui tus soluciones.
