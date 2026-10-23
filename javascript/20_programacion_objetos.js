/*
TEMA 20: PROGRAMACION ORIENTADA A OBJETOS

Una clase describe propiedades y comportamientos; un objeto es una instancia.
El constructor inicializa el estado. `this` se refiere al objeto actual.
Propiedades privadas con # protegen el estado. Los metodos permiten operar
con el objeto y pueden validar cambios. Usa clases cuando los datos y el
comportamiento relacionado se beneficien de vivir juntos.

Sintaxis:
class Producto {
  #precio;
  constructor(nombre, precio) {
    this.nombre = nombre;
    this.#precio = precio;
  }
  obtenerPrecio() { return this.#precio; }
}
const libro = new Producto("Libro", 12.5);

EJERCICIOS:
1. Crea una clase Persona con nombre y un metodo para presentarse.
2. Crea una clase Rectangulo que calcule area y perimetro.
3. Crea una clase CuentaBancaria con depositar y retirar.
4. Valida que el precio de un Producto no sea negativo.
5. Inicializa las propiedades requeridas con el constructor.
6. Usa una propiedad privada y metodos publicos para consultar el estado.
7. Crea una clase Libro con titulo, autor y metodo de descripcion.
8. Modela un Termometro con una conversion de temperatura.
9. Crea una clase Carrito que almacene productos y calcule su total.
10. Disena clases Estudiante y Curso con responsabilidades claras.
*/

// Zona de trabajo: escribe aqui tus soluciones.
