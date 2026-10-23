<?php

declare(strict_types=1);

/*
TEMA 24: ESTRUCTURAS DE DATOS: PILAS Y COLAS

Una pila sigue LIFO: el ultimo elemento agregado es el primero que sale.
Una cola sigue FIFO: el primero que entra es el primero que sale. En PHP
puedes practicar una pila con arreglos y una cola eficiente con SplQueue.
Define que debe ocurrir al intentar retirar un elemento de una estructura vacia.

Sintaxis:
$pila = [];
$pila[] = 'A';
$ultimo = array_pop($pila);
$cola = new SplQueue();
$cola->enqueue('A');
$primero = $cola->dequeue();

EJERCICIOS:
1. Implementa una pila con agregar, retirar y consultar el elemento superior.
2. Maneja el intento de retirar de una pila vacia.
3. Implementa una cola de turnos de atencion.
4. Simula una fila y procesa personas en orden de llegada.
5. Usa una pila para invertir una secuencia de caracteres.
6. Usa una pila para comprobar parentesis balanceados.
7. Simula el historial de acciones recientes con una pila.
8. Implementa una cola de tareas pendientes.
9. Muestra el estado de la pila despues de tres inserciones y dos retiros.
10. Compara con ejemplos cuando conviene una pila y cuando una cola.
*/

// Zona de trabajo: escribe aqui tus soluciones.
