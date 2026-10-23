/*
 * TEMA 04: CONVERSION Y VALIDACION DE DATOS
 *
 * Java es tipado estatico: convierte tipos numericos con cast cuando sea
 * seguro, por ejemplo `(double) entero`; convertir un double a int trunca
 * la parte decimal. Las cadenas se convierten con Integer.parseInt,
 * Double.parseDouble o metodos equivalentes. Entradas mal formadas pueden
 * lanzar NumberFormatException. Despues de convertir, valida rango y reglas.
 *
 * Sintaxis:
 * String texto = "42";
 * int numero = Integer.parseInt(texto);
 * double decimal = Double.parseDouble("3.5");
 * try {
 *     int valor = Integer.parseInt("no es numero");
 * } catch (NumberFormatException error) {
 *     System.out.println("Entrada invalida");
 * }
 *
 * EJERCICIOS:
 * 1. Convierte una cadena con digitos a entero y muestra el tipo.
 * 2. Convierte una cadena decimal y calcula el doble.
 * 3. Pide una edad y valida que sea entero no negativo.
 * 4. Pide un precio y rechaza entradas vacias o no numericas.
 * 5. Convierte segundos a minutos y segundos restantes.
 * 6. Valida una cantidad entera entre 1 y 100.
 * 7. Suma dos entradas solo si ambas se convierten correctamente.
 * 8. Valida que una temperatura sea numerica y finita.
 * 9. Distingue entrada vacia, texto "0" y numero cero.
 * 10. Solicita una nota hasta recibir un valor valido entre 0 y 100.
 *
 * Valida tanto el formato como el rango permitido por cada problema.
 */
public class Tema04ConversionValidacion {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones.
    }
}
