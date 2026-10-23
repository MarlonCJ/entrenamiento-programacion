<?php

declare(strict_types=1);

/*
TEMA 08: OPERADORES BIT A BIT, TERNARIO Y PRECEDENCIA

`&`, `|`, `^`, `~`, `<<` y `>>` operan sobre bits de enteros; se usan, por
ejemplo, para banderas. El ternario `condicion ? valor1 : valor2` elige entre
dos valores. La precedencia determina que operacion ocurre primero; usa
parentesis en expresiones compuestas. El operador `??` entrega un valor
alternativo si una variable no existe o es null.

Sintaxis:
$par = ($numero & 1) === 0;
$etiqueta = $nota >= 60 ? 'Aprobado' : 'Reprobado';
$nombre = $entrada ?? 'Invitado';
$duplicado = $numero << 1;

EJERCICIOS:
1. Usa el ternario para clasificar un numero como positivo o no positivo.
2. Usa ternario para indicar si una persona es mayor de edad.
3. Determina si un entero es par comprobando su bit menos significativo.
4. Multiplica un entero positivo por 2 con desplazamiento de bits.
5. Combina dos conjuntos de banderas con OR bit a bit y muestra el resultado.
6. Calcula un precio con descuento mediante una expresion condicional.
7. Compara el resultado de una expresion con y sin parentesis que aclaren prioridad.
8. Usa ?? para dar un nombre por defecto cuando no se proporciona valor.
9. Comprueba si una bandera concreta esta activa con AND bit a bit.
10. Construye una expresion de varias operaciones y explica el orden con parentesis.

Usa operadores bit a bit solo con enteros; no los confundas con && y ||.
*/

// Zona de trabajo: escribe aqui tus soluciones.
