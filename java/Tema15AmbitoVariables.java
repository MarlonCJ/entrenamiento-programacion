/*
 * TEMA 15: AMBITO Y VIDA DE LAS VARIABLES
 *
 * El ambito indica donde puede usarse una variable. Las variables locales y
 * parametros solo existen dentro del metodo o bloque donde se declaran.
 * Una variable de instancia pertenece a un objeto; una variable static
 * pertenece a la clase. Los parametros permiten pasar dependencias de forma
 * explicita y suelen ser preferibles a estado static mutable compartido.
 *
 * Sintaxis:
 * static double calcular(double precio, double tasa) {
 *     double descuento = precio * tasa; // local
 *     return precio - descuento;
 * }
 *
 * EJERCICIOS:
 * 1. Muestra que una variable local solo se usa dentro de su metodo.
 * 2. Pasa una tasa como parametro en vez de leer una variable static.
 * 3. Crea dos metodos con variables locales del mismo nombre.
 * 4. Explica con codigo la diferencia entre parametro y variable de instancia.
 * 5. Devuelve un resultado sin modificar una variable externa.
 * 6. Compara el ambito de una variable de bloque y una de metodo.
 * 7. Pasa una configuracion explicitamente a dos metodos.
 * 8. Corrige un ejemplo que depende de estado static mutable.
 * 9. Crea una clase contador con estado privado por instancia.
 * 10. Diseña metodos que reciban dependencias sin estado oculto.
 */
public class Tema15AmbitoVariables {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones.
    }
}
