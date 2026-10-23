<?php

declare(strict_types=1);

/*
TEMA 22: PRUEBAS Y DEPURACION

Una prueba verifica un comportamiento esperado con entradas conocidas.
Empieza por casos normales, limites y errores. Las aserciones expresan
expectativas; `assert` puede depender de la configuracion de PHP, por lo que
en proyectos profesionales se usan herramientas como PHPUnit. Para depurar,
lee el error completo, identifica archivo y linea, y reduce el problema.

Sintaxis:
function sumar(int $a, int $b): int { return $a + $b; }
assert(sumar(2, 3) === 5);
var_dump(sumar(-1, 1));

EJERCICIOS:
1. Escribe tres pruebas para sumar, incluyendo un numero negativo.
2. Prueba una funcion de paridad con positivo, negativo y cero.
3. Identifica entradas limite para una funcion que calcula promedio.
4. Escribe una expectativa para una funcion que devuelve un saludo.
5. Crea una prueba que detecte si el factorial de cero se maneja bien.
6. Provoca un error de indice y encuentra la linea que lo causa.
7. Agrega casos de texto vacio y mayusculas a una funcion de cadena.
8. Compara el resultado real con el esperado y muestra un mensaje de fallo claro.
9. Divide un problema en pruebas pequenas para localizar un error.
10. Crea una lista de casos normales, limites e invalidos para una funcion propia.
*/

// Zona de trabajo: escribe aqui tus soluciones.
