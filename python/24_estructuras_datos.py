"""
TEMA 24: ESTRUCTURAS DE DATOS: PILAS Y COLAS

Una pila sigue LIFO: el ultimo elemento que entra es el primero que sale.
Una cola sigue FIFO: el primero que entra es el primero que sale. Una lista
puede representar una pila con append/pop. Para colas, collections.deque
permite agregar al final y retirar del inicio eficientemente. Define que hacer
cuando se intenta retirar de una estructura vacia.

Sintaxis:
from collections import deque
pila = []
pila.append("A")
ultimo = pila.pop()
cola = deque(["A"])
primero = cola.popleft()

EJERCICIOS:
1. Implementa una pila con agregar, retirar y consultar el elemento superior.
2. Maneja el intento de retirar de una pila vacia.
3. Implementa una cola de turnos de atencion.
4. Procesa personas en orden de llegada.
5. Usa una pila para invertir una secuencia de caracteres.
6. Usa una pila para comprobar parentesis balanceados.
7. Simula un historial reciente de acciones con una pila.
8. Implementa una cola de tareas pendientes.
9. Muestra la pila despues de tres inserciones y dos retiros.
10. Explica con ejemplos cuando elegir una pila y cuando una cola.
"""

# Zona de trabajo: escribe aqui tus soluciones.
