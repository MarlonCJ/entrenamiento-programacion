"""
TEMA 20: PROGRAMACION ORIENTADA A OBJETOS

Una clase define datos y comportamientos; un objeto es una instancia. `__init__`
inicializa propiedades y `self` representa la instancia actual. Los metodos
describen comportamientos. Una convencion de nombre con guion bajo indica
atributos internos; Python no impone privacidad estricta. Usa clases cuando
los datos y sus operaciones relacionadas tengan sentido juntos.

Sintaxis:
class Producto:
    def __init__(self, nombre, precio):
        self.nombre = nombre
        self._precio = precio

    def obtener_precio(self):
        return self._precio

libro = Producto("Libro", 12.5)

EJERCICIOS:
1. Crea una clase Persona con nombre y metodo para presentarse.
2. Crea una clase Rectangulo que calcule area y perimetro.
3. Crea una clase CuentaBancaria con depositar y retirar.
4. Valida que el precio de un Producto no sea negativo.
5. Inicializa las propiedades requeridas mediante __init__.
6. Usa una propiedad interna y metodos para consultar el estado.
7. Crea una clase Libro con titulo, autor y descripcion.
8. Modela un Termometro con conversion de temperatura.
9. Crea una clase Carrito que guarde productos y calcule el total.
10. Disena clases Estudiante y Curso con responsabilidades claras.
"""

# Zona de trabajo: escribe aqui tus soluciones.
