import java.util.List;

/*
 * ============================================================================
 * TEMA 14: MÉTODOS (FUNCIONES, PASO POR VALOR, SOBRECARGA Y DISEÑO LIMPIO)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * En Java toda función vive dentro de una clase y se denomina "método". Los
 * métodos son la unidad fundamental de abstracción, reutilización y pruebas
 * unitarias: encapsulan una tarea con entradas claras (parámetros) y una salida
 * bien definida (tipo de retorno).
 *
 * Modelo Mental en la JVM (Stack Frames y Paso por Valor):
 * - Cada vez que invocas un método, la JVM empuja un nuevo "Stack Frame" en la
 *   pila del hilo actual con sus propios parámetros y variables locales; cuando
 *   el método hace `return`, el frame se destruye instantáneamente.
 * - JAVA ES 100% PASO POR VALOR (Pass-by-Value SIEMPRE):
 *   * Si pasas un primitivo (`int x`), el método recibe una copia de los bits;
 *     reasignar el parámetro dentro del método no afecta a la variable original.
 *   * Si pasas un objeto (`List<String> lista`), el método recibe una COPIA DE LA
 *     REFERENCIA (dirección de memoria). Reasignar `lista = new ArrayList<>()`
 *     dentro del método NO cambia la variable del llamador, pero mutar el objeto
 *     apuntado (`lista.add("X")`) SÍ es visible afuera porque ambos apuntan al
 *     mismo objeto en el Heap.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Principio de Responsabilidad Única (SRP): Extraer cálculos de negocio,
 *   validaciones y formateos en métodos pequeños con nombres autoexplicativos.
 * - Sobrecarga de métodos (Method Overloading): Ofrecer variantes del mismo
 *   método con distintos parámetros (ej. `calcularEnvio(peso)` y
 *   `calcularEnvio(peso, codigoDescuento)`).
 * - Argumentos variables (`varargs` con `...`): Métodos utilitarios que aceptan
 *   0, 1 o N elementos cómodamente (`sumarTodos(int... numeros)`).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // 1. Firma de un método: modificadores + retorno + nombre + (parámetros)
 * public static double calcularPrecioFinal(double base, double porcentajeDescuento) {
 *     if (base < 0 || porcentajeDescuento < 0 || porcentajeDescuento > 100) {
 *         throw new IllegalArgumentException("Parámetros fuera de rango");
 *     }
 *     return base * (1.0 - porcentajeDescuento / 100.0);
 * }
 *
 * // 2. Sobrecarga (Overloading): mismo nombre, distinta lista de parámetros
 * public static double calcularPrecioFinal(double base) {
 *     return calcularPrecioFinal(base, 0.0); // Delega al método principal
 * }
 *
 * // 3. Varargs (debe ser siempre el último parámetro)
 * public static int sumar(int... valores) {
 *     int total = 0;
 *     for (int v : valores) {
 *         total += v;
 *     }
 *     return total;
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Servicio modular de cálculo de factura con validación y sobrecarga.
 *
 * // Llamadas desde main:
 * double sinDescuento = calcularPrecioFinal(200.0);
 * double conDescuento = calcularPrecioFinal(200.0, 15.0);
 * int sumaLote = sumar(10, 20, 30, 40);
 *
 * System.out.println("Normal: $" + sinDescuento + " | Rebajado: $" + conDescuento);
 * System.out.println("Suma varargs: " + sumaLote);
 *
 * Salida esperada:
 * Normal: $200.0 | Rebajado: $170.0
 * Suma varargs: 100
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - Clean Code: Los nombres de métodos deben ser VERBOS o frases verbales que
 *   expresen intención (`calcularImpuesto`, `esCorreoValido`, `enviarNotificacion`).
 * - Métodos Puros vs Efectos Secundarios (Command-Query Separation): Separa los
 *   métodos que calculan y devuelven un dato (sin imprimir nada en consola) de
 *   los métodos que muestran resultados o modifican estado. Esto hace tu código
 *   100% testeable con JUnit.
 * - Effective Java (Item 49): Valida siempre los parámetros al inicio del método
 *   (Fail-Fast) lanzando `IllegalArgumentException` o `Objects.requireNonNull(...)`.
 * - Limita el número de parámetros (idealmente de 0 a 3). Si un método necesita
 *   6 parámetros, agrúpalos en un objeto o `record`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Crea un método `formatearSaludo(String nombre)` que devuelva un saludo
 *    limpio (aplicando `"Invitado"` si el nombre es `null` o está en blanco).
 * 2. Crea un método `maximoDeTres(int a, int b, int c)` que devuelva el mayor de
 *    tres enteros y pruébalo con varios casos desde `main`.
 * 3. Crea un método booleano `esPar(int numero)` y otro `esBisiesto(int anio)` y
 *    verifica su funcionamiento.
 *
 * [Intermedio]
 * 4. Crea dos métodos sobrecargados `calcularArea`: uno para un rectángulo
 *    (`double base, double altura`) y otro para un cuadrado (`double lado` que
 *    delegue en el primero).
 * 5. Crea métodos de conversión de temperatura `celsiusAFahrenheit(double c)` y
 *    `fahrenheitACelsius(double f)` validando que no estén por debajo del cero
 *    absoluto (`-273.15 °C`).
 * 6. Crea un método `contarVocales(String texto)` que sea seguro ante `null`
 *    (devolviendo `0` si recibe `null`).
 * 7. Crea un método `contarOcurrencias(List<String> items, String objetivo)` que
 *    cuente cuántas veces aparece `objetivo` usando `Objects.equals`.
 *
 * [Senior / Producción]
 * 8. Implementa un método con argumentos variables `calcularPromedio(double primero, double... resto)`
 *    que obligue en tiempo de compilación a pasar al menos un número (patrón
 *    Effective Java Item 53).
 * 9. Demuestra mediante dos métodos de prueba cómo funciona el Paso por Valor en
 *    Java: uno que intente cambiar un `int` primitivo y otro que mute una
 *    `List<String>` frente a reasignar su referencia local.
 * 10. Diseña un método puro de negocio `aplicarDescuento(BigDecimal precio, BigDecimal porcentaje)`
 *     con validación estricta de precondiciones (`IllegalArgumentException`) y
 *     redondeo financiero (`RoundingMode.HALF_UP` a 2 decimales).
 */
public class Tema14Funciones {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
