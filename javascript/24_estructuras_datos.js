/*
TEMA 24: ESTRUCTURAS DE DATOS: PILAS Y COLAS

Una pila sigue LIFO: el ultimo elemento que entra es el primero que sale.
Una cola sigue FIFO: el primero que entra es el primero que sale. Los arreglos
permiten practicar ambas: push/pop para pila; push y un indice de lectura para
una cola eficiente. `shift` es sencillo pero puede desplazar todos los elementos.
Define que hacer al retirar de una estructura vacia.

Sintaxis:
const pila = [];
pila.push("A");
const ultimo = pila.pop();
const cola = [];
cola.push("A");
let inicio = 0;
const primero = cola[inicio++];

EJERCICIOS:
1. Implementa una pila con agregar, retirar y consultar el elemento superior.
2. Maneja el intento de retirar un elemento de una pila vacia.
3. Implementa una cola de turnos de atencion.
4. Procesa personas en orden de llegada.
5. Usa una pila para invertir una secuencia de caracteres.
6. Usa una pila para comprobar si los parentesis estan balanceados.
7. Simula un historial reciente de acciones con una pila.
8. Implementa una cola de tareas pendientes.
9. Muestra el estado de la pila tras tres inserciones y dos retiros.
10. Explica con ejemplos cuando elegir una pila y cuando una cola.
*/

// Zona de trabajo: escribe aqui tus soluciones.
