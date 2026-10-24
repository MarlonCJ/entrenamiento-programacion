import java.util.Locale;
import java.util.Scanner;

/*
 * ============================================================================
 * TEMA 03: ENTRADA Y SALIDA POR CONSOLA (Standard I/O y Formateo)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * Todo proceso en un sistema operativo nace con tres flujos estándar conectados
 * a la consola o tuberías (pipes):
 * - `System.in` (Standard Input): Flujo de bytes entrantes (teclado o archivo redirigido).
 * - `System.out` (Standard Output): Flujo de salida normal con buffer.
 * - `System.err` (Standard Error): Flujo para errores y diagnósticos urgentes.
 *
 * Modelo Mental en la JVM:
 * `System.in` entrega bytes crudos. La clase `java.util.Scanner` actúa como un
 * analizador léxico (tokenizer) que decodifica esos bytes en caracteres y los
 * separa por delimitadores (espacios, tabulaciones o saltos de línea `\n`).
 * Para la salida profesional, `System.out.printf` y `String.format` permiten
 * interpolar valores y controlar decimales y alineación sin concatenaciones
 * difíciles de leer.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Herramientas CLI (Command Line Interfaces), scripts administrativos y utilidades
 *   de migración de datos.
 * - Lectura de entradas en pruebas técnicas, jueces online y procesamiento por
 *   lotes (batch) mediante redirección Unix (`java App < datos.txt`).
 * - Generación de tablas alineadas, reportes financieros en texto plano y logs
 *   estructurados con `printf`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // Configurar Locale.US evita problemas entre coma (3,14) y punto (3.14) decimal
 * Scanner sc = new Scanner(System.in).useLocale(Locale.US);
 *
 * System.out.print("Ingrese su nombre completo: ");
 * String nombre = sc.nextLine();                 // Lee toda la línea hasta Enter
 *
 * System.out.print("Ingrese su edad: ");
 * int edad = Integer.parseInt(sc.nextLine());    // Patrón seguro (evita bug de nextInt)
 *
 * // Salida formateada con printf (%s = String, %d = entero, %.2f = decimal 2 cifras)
 * System.out.printf(Locale.US, "Cliente: %s | Edad: %d | Saldo: $%.2f%n", nombre, edad, 125.5);
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Generador interactivo de cotización con formato de recibo alineado.
 *
 * Scanner sc = new Scanner("Monitor 4K\n2\n349.99\n").useLocale(Locale.US);
 * String producto = sc.nextLine();
 * int cantidad = Integer.parseInt(sc.nextLine());
 * double precio = Double.parseDouble(sc.nextLine());
 * double total = cantidad * precio;
 *
 * System.out.printf(Locale.US, "%-15s %5d x $%8.2f = $%9.2f%n",
 *         producto, cantidad, precio, total);
 *
 * Salida esperada:
 * Monitor 4K          2 x $  349.99 = $   699.98
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - EL GRAN GOTCHA DE SCANNER: Llamar a `nextInt()` o `nextDouble()` y luego a
 *   `nextLine()`. `nextInt()` lee solo los dígitos pero deja el salto de línea `\n`
 *   en el buffer, haciendo que el siguiente `nextLine()` devuelva una cadena vacía `""`.
 *   Solución Senior: Leer siempre líneas completas con `sc.nextLine().trim()` y
 *   convertirlas explícitamente con `Integer.parseInt(...)`, o consumir la línea
 *   sobrante.
 * - Gotcha de configuración regional (`Locale`): En sistemas en español,
 *   `sc.nextDouble()` espera `3,14` con coma y falla con `3.14` (`InputMismatchException`).
 *   Usa `.useLocale(Locale.US)` para estandarizar a punto decimal.
 * - Usa `%n` en lugar de `\n` dentro de `printf` para emitir el salto de línea
 *   nativo del sistema operativo (`\r\n` en Windows, `\n` en Linux/macOS).
 * - Nunca cierres `Scanner(System.in)` si otra parte de tu aplicación volverá a
 *   leer de `System.in` más adelante, ya que cierra el flujo subyacente del SO.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Pide el nombre del usuario por consola y muestra un saludo personalizado.
 * 2. Pide dos números enteros y muestra la operación completa y su suma.
 * 3. Pide el año de nacimiento y el año actual, y muestra la edad aproximada.
 *
 * [Intermedio]
 * 4. Pide una temperatura en grados Celsius y muéstrala convertida a Fahrenheit
 *    con exactamente 2 decimales usando `printf`.
 * 5. Pide el ancho y largo de un terreno en metros (`double`) y muestra su área
 *    y perímetro formateados.
 * 6. Pide primero la edad (`int`) y luego el nombre completo (`String`) con
 *    espacios, resolviendo correctamente el salto de línea en el buffer.
 * 7. Pide tres calificaciones decimales y muestra cada nota y el promedio final
 *    redondeado a 2 decimales.
 *
 * [Senior / Producción]
 * 8. Pide una cantidad total de segundos y muéstrala en formato de reloj digital
 *    `HH:MM:SS` con ceros a la izquierda (ej. `02:05:09` usando `%02d`).
 * 9. Pide los datos de dos productos (nombre, cantidad y precio unitario) e
 *    imprime una factura con columnas perfectamente alineadas usando `printf`.
 * 10. Implementa un lector de configuración CLI que lea host, puerto y modo debug,
 *     limpie espacios accidentales (`.trim()`) y envíe advertencias a `System.err`
 *     si el puerto es menor a 1024.
 */
public class Tema03EntradaSalida {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
