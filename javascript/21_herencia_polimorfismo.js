/*
TEMA 21: HERENCIA, ABSTRACCION Y POLIMORFISMO

Las clases pueden extender otras con `extends`; `super` llama al constructor
o metodo de la clase base. El polimorfismo permite que objetos distintos
respondan al mismo metodo. JavaScript no tiene interfaces nativas obligatorias:
puedes definir contratos por convencion y comprobar comportamientos. La
composicion combina objetos colaboradores y suele ser mas flexible que una
jerarquia profunda.

Sintaxis:
class Animal {
  hablar() { return "sonido"; }
}
class Perro extends Animal {
  hablar() { return "guau"; }
}

EJERCICIOS:
1. Crea Animal y dos clases hijas con sonidos diferentes.
2. Sobrescribe un metodo y observa que implementacion se invoca.
3. Crea una clase base abstracta simulada que rechace instanciacion directa.
4. Implementa figuras con un metodo area comun y calcula varias areas.
5. Define un contrato por convencion para distintos notificadores.
6. Recorre una lista de objetos y llama al mismo metodo en todos.
7. Crea una jerarquia de empleados con salarios especializados.
8. Modela un carrito que recibe un objeto de pago por composicion.
9. Extrae comportamiento comun para evitar duplicacion en clases.
10. Agrega un nuevo metodo de pago sin reescribir la logica del carrito.
*/

// Zona de trabajo: escribe aqui tus soluciones.
