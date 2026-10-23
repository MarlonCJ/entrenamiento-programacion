"""
TEMA 21: HERENCIA, ABSTRACCION Y POLIMORFISMO

Una clase puede heredar de otra para reutilizar o especializar comportamiento.
`super()` permite llamar a la implementacion base. El polimorfismo permite
usar objetos distintos mediante metodos con el mismo nombre. Para contratos
formales puedes usar Protocol o clases abstractas del modulo abc; la
composicion combina objetos colaboradores y evita jerarquias innecesarias.

Sintaxis:
from abc import ABC, abstractmethod

class Figura(ABC):
    @abstractmethod
    def area(self):
        pass

class Rectangulo(Figura):
    def area(self):
        return 4 * 3

EJERCICIOS:
1. Crea Animal y dos clases hijas con sonidos distintos.
2. Sobrescribe un metodo y observa que implementacion se ejecuta.
3. Crea una clase abstracta Figura con metodo area.
4. Implementa circulo y rectangulo y calcula sus areas.
5. Define un protocolo comun para diferentes notificadores.
6. Recorre una lista de figuras y llama a area en todas.
7. Crea una jerarquia de empleados con calculos de salario.
8. Modela un carrito con un metodo de pago inyectado por composicion.
9. Extrae comportamiento compartido para evitar duplicacion.
10. Agrega un nuevo metodo de pago sin cambiar el codigo cliente.
"""

# Zona de trabajo: escribe aqui tus soluciones.
