/*
 * TEMA 21: HERENCIA, ABSTRACCION Y POLIMORFISMO
 *
 * `extends` expresa herencia de una clase. Una clase abstracta puede compartir
 * estado e implementacion y declarar metodos abstractos. Una interfaz define
 * un contrato que una clase implementa. El polimorfismo permite guardar
 * objetos de distintas clases bajo un tipo comun y llamar al comportamiento
 * sobrescrito. Prefiere composicion cuando una clase "tiene un" colaborador.
 *
 * Sintaxis:
 * interface Pagable { double calcularTotal(); }
 * abstract class Producto implements Pagable {
 *     public abstract double calcularTotal();
 * }
 * class Libro extends Producto {
 *     public double calcularTotal() { return 10.0; }
 * }
 *
 * EJERCICIOS:
 * 1. Crea Animal y dos clases hijas con sonidos diferentes.
 * 2. Sobrescribe un metodo y observa que implementacion se invoca.
 * 3. Crea una clase abstracta Figura con metodo area.
 * 4. Implementa circulo y rectangulo y calcula sus areas.
 * 5. Define una interfaz Notificable e implementala de dos maneras.
 * 6. Recorre figuras y calcula areas sin preguntar el tipo concreto.
 * 7. Crea una jerarquia de empleados con salarios especializados.
 * 8. Compara herencia con composicion en un carrito y su metodo de pago.
 * 9. Extrae comportamiento comun para evitar duplicacion.
 * 10. Agrega un metodo de pago sin cambiar la logica que procesa compras.
 */
public class Tema21HerenciaPolimorfismo {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones.
    }
}
