/*
TEMA 20: CLASES, INTERFACES Y ENCAPSULACION

Una clase define objetos. `constructor` inicializa; `private`, `public` y
`readonly` controlan acceso en TypeScript. Las interfaces describen la forma
de un objeto sin existir en ejecucion. `implements` verifica el contrato al
compilar. Usa readonly para estado que no debe reasignarse.

Sintaxis:
interface Pagable { calcularTotal(): number; }
class Producto implements Pagable {
  constructor(private nombre: string, private precio: number) {}
  calcularTotal(): number { return this.precio; }
}

EJERCICIOS:
1. Clase Persona con nombre y presentacion.
2. Rectangulo con area y perimetro.
3. Cuenta bancaria con depositar y retirar.
4. Valida precio no negativo en Producto.
5. Define propiedades obligatorias con constructor.
6. Encapsula saldo y expone operaciones seguras.
7. Clase Libro y metodo de descripcion.
8. Interfaz Figura y calculo de area.
9. Carrito con productos y total.
10. Estudiante y Curso con relaciones tipadas.
*/

// Zona de trabajo: escribe aqui tus soluciones.
