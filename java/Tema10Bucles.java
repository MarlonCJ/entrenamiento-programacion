/*
 * ============================================================================
 * TEMA 10: BUCLES E ITERACIÓN (`for`, `for-each`, `while`, `do-while`)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * Un bucle ejecuta un bloque de código repetidamente mientras se cumpla una
 * condición de continuación.
 *
 * En Java disponemos de cuatro variantes con propósitos claros:
 * - `for` clásico: Cuando conoces el número de iteraciones o necesitas el índice `i`.
 * - `for-each` (Enhanced `for`): Para recorrer arreglos o colecciones de principio
 *   a fin sin manipular índices manualmente (más limpio y libre de errores de borde).
 * - `while`: Cuando no sabes cuántas veces se repetirá y la condición debe
 *   evaluarse ANTES de la primera ejecución (0 o más veces).
 * - `do-while`: Cuando el bloque debe ejecutarse AL MENOS UNA VEZ antes de
 *   evaluar la condición de salida.
 *
 * Modelo Mental en la JVM:
 * El compilador JIT (Just-In-Time) de HotSpot optimiza agresivamente los bucles
 * calientes mediante técnicas como "Loop Unrolling" (desenrollado de bucles) y
 * "Range Check Elimination" (eliminar comprobaciones redundantes de límites de
 * arreglo cuando detecta el patrón estándar `for (int i = 0; i < arr.length; i++)`).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Procesamiento por lotes (batch) de facturas, transacciones o registros.
 * - Algoritmos de reintento (Retry con Backoff) al consumir servicios externos.
 * - Lectura continua de flujos de datos, archivos línea por línea o colas de mensajes.
 * - Búsqueda lineal o binaria, agregaciones (suma, máximo, mínimo, conteo).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // 1. Bucle for clásico con índice
 * for (int i = 0; i < 5; i++) {
 *     System.out.println("Iteración: " + i);
 * }
 *
 * // 2. Bucle for-each (preferido para recorrer elementos sin necesitar índice)
 * int[] precios = {100, 200, 300};
 * int suma = 0;
 * for (int precio : precios) {
 *     suma += precio;
 * }
 *
 * // 3. Bucle while con condición de salida clara
 * int intentos = 0;
 * while (intentos < 3) {
 *     intentos++;
 * }
 *
 * // Control de flujo interno:
 * // 'continue' salta a la siguiente iteración; 'break' sale del bucle inmediatamente.
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Procesamiento de lote de pagos omitiendo montos inválidos (`continue`)
 * y deteniendo el proceso si se supera el límite diario de seguridad (`break`).
 *
 * double[] pagos = {150.0, -20.0, 400.0, 600.0, 100.0};
 * double limiteDiario = 1000.0;
 * double acumulado = 0.0;
 *
 * for (double pago : pagos) {
 *     if (pago <= 0) {
 *         continue; // Ignora transacciones inválidas
 *     }
 *     if (acumulado + pago > limiteDiario) {
 *         System.out.println("Límite diario alcanzado. Deteniendo lote.");
 *         break;
 *     }
 *     acumulado += pago;
 * }
 * System.out.println("Total procesado: $" + acumulado);
 *
 * Salida esperada:
 * Límite diario alcanzado. Deteniendo lote.
 * Total procesado: $550.0
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - Effective Java (Item 58): Prefiere los bucles `for-each` sobre los bucles
 *   `for` tradicionales siempre que no necesites el índice ni modificar la
 *   estructura subyacente; eliminan el ruido visual y el riesgo de
 *   `ArrayIndexOutOfBoundsException`.
 * - Error común 1 (Off-by-one / Error por uno): Usar `i <= arr.length` en vez de
 *   `i < arr.length`. Como los índices van de `0` a `length - 1`, `<=` provoca
 *   excepción en la última vuelta.
 * - Error común 2 (Overflow en el acumulador): Si sumas muchos `int` dentro de
 *   un bucle, declara el acumulador como `long` (`long suma = 0L;`).
 * - Evita bucles infinitos accidentales: asegúrate de que toda rama dentro de un
 *   `while` acerque la variable de control hacia la condición de parada.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Muestra los números enteros del 1 al 20 en una sola línea separados por espacio.
 * 2. Muestra únicamente los números pares entre 2 y 50 y calcula cuántos son.
 * 3. Dado un número entero `n`, imprime su tabla de multiplicar del 1 al 10 con
 *    formato claro (`n x i = resultado`).
 *
 * [Intermedio]
 * 4. Calcula la suma de todos los enteros desde 1 hasta `N` usando un bucle y
 *    compara el resultado con la fórmula de Gauss `(long) N * (N + 1) / 2`.
 * 5. Calcula el factorial de un entero no negativo `n` (`0! = 1`) usando un
 *    acumulador `long` y valida que `n <= 20` para evitar desbordamiento de 64 bits.
 * 6. Cuenta cuántas cifras tiene un número entero (positivo, negativo o cero) y
 *    calcula la suma de sus dígitos usando divisiones sucesivas entre 10 (`while`).
 * 7. Invierte los dígitos de un número entero positivo (ej. `12345` -> `54321`)
 *    usando únicamente operadores aritméticos (`% 10` y `/ 10`) dentro de un `while`.
 *
 * [Senior / Producción]
 * 8. Determina si un número entero `n > 1` es primo de forma eficiente iterando
 *    solo hasta `i * i <= n` (raíz cuadrada) y deteniendo la búsqueda con `break`
 *    al hallar el primer divisor.
 * 9. Simula un algoritmo de reintento exponencial (Exponential Backoff): intenta
 *    hasta un máximo de 5 veces duplicando el tiempo de espera en cada fallo
 *    (`100ms`, `200ms`, `400ms`, `800ms`, `1600ms`) y registra el historial.
 * 10. Recorre un lote de lecturas de telemetría con valores centinela: ignora
 *     lecturas de ruido (`-999` con `continue`), detén la ingesta ante señal de
 *     apagado (`-1` con `break`) y reporta conteo válido, suma y promedio.
 */
public class Tema10Bucles {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
