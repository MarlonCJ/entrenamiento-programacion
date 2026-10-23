/*
TEMA 24: PILAS, COLAS Y GENERICOS

Una pila es LIFO (ultimo en entrar, primero en salir); una cola es FIFO
(primero en entrar, primero en salir). Un tipo generico permite reutilizar una
estructura para distintos tipos sin perder seguridad. Define comportamiento
cuando la estructura esta vacia, por ejemplo devolver undefined.

Sintaxis:
class Pila<T> {
  private elementos: T[] = [];
  agregar(valor: T): void { this.elementos.push(valor); }
  retirar(): T | undefined { return this.elementos.pop(); }
}

EJERCICIOS:
1. Implementa Pila<T> con agregar, retirar y cima.
2. Maneja retirar desde pila vacia.
3. Implementa cola generica.
4. Procesa turnos en orden de llegada.
5. Invierte texto usando una pila.
6. Valida parentesis balanceados.
7. Simula historial de acciones.
8. Procesa tareas con cola.
9. Muestra estado despues de insertar y retirar valores.
10. Explica con ejemplos cuando usar pila o cola.
*/

// Zona de trabajo: escribe aqui tus soluciones.
