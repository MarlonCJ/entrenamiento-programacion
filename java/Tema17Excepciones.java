/*
 * TEMA 17: EXCEPCIONES Y MANEJO DE ERRORES
 *
 * `try` contiene codigo que puede fallar; `catch` maneja un tipo de excepcion;
 * `finally` se ejecuta al salir de la estructura. `throw` lanza una excepcion.
 * Java distingue excepciones verificadas (hay que capturarlas o declararlas
 * con throws) y no verificadas. Captura tipos especificos y no ocultes errores.
 *
 * Sintaxis:
 * try {
 *     int resultado = 10 / divisor;
 * } catch (ArithmeticException error) {
 *     System.out.println("Division invalida: " + error.getMessage());
 * } finally {
 *     System.out.println("Operacion terminada");
 * }
 *
 * EJERCICIOS:
 * 1. Protege una division y maneja divisor cero.
 * 2. Convierte una cadena a entero y maneja NumberFormatException.
 * 3. Lanza IllegalArgumentException si la edad esta fuera del rango permitido.
 * 4. Abre un archivo inexistente y maneja la excepcion de IO.
 * 5. Usa finally para informar que una operacion termino.
 * 6. Captura dos tipos distintos de excepcion apropiadamente.
 * 7. Valida un precio positivo y lanza una excepcion si no cumple.
 * 8. Propaga una excepcion desde un metodo y manejala en el llamador.
 * 9. Distingue una validacion normal de un fallo inesperado.
 * 10. Comunica errores con un mensaje util sin ocultar su causa.
 */
public class Tema17Excepciones {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones.
    }
}
