/*
 * ============================================================================
 * TEMA 05: OPERADORES ARITMÉTICOS Y MATEMÁTICA SEGURA EN LA JVM
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * Los operadores aritméticos (`+`, `-`, `*`, `/`, `%`) permiten transformar
 * valores numéricos. Sin embargo, en la JVM las operaciones aritméticas tienen
 * reglas estrictas de promoción de tipos y límites de representación en bits
 * que todo desarrollador profesional debe dominar para evitar bugs financieros
 * o de seguridad.
 *
 * Modelo Mental en la JVM:
 * - División Entera vs Punto Flotante: Si ambos operandos de `/` son enteros
 *   (`int` o `long`), la JVM ejecuta la instrucción `idiv`/`ldiv`, que trunca
 *   hacia cero (`7 / 2` produce `3`, jamás `3.5`).
 * - Operador Resto (`%`), NO módulo matemático: En Java el signo del resultado
 *   de `a % b` sigue siempre el signo del dividendo `a` (`-7 % 3` es `-1`). Si
 *   necesitas un módulo siempre positivo (ej. índices circulares), usa `Math.floorMod(a, b)`.
 * - Desbordamiento Silencioso (Silent Overflow): `Integer.MAX_VALUE + 1` no lanza
 *   error; da la vuelta al bit de signo y produce `-2147483648`. Para aritmética
 *   crítica, Java ofrece `Math.addExact`, `Math.multiplyExact`, que lanzan
 *   `ArithmeticException` si ocurre overflow.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Cálculo de paginación en bases de datos (`totalPaginas = (totalItems + tamanoPagina - 1) / tamanoPagina`).
 * - Conversión de unidades de tiempo, almacenamiento y divisas.
 * - Algoritmos de distribución circular (Round-Robin, Hashing, relojes) con `%`
 *   y `Math.floorMod`.
 * - Cálculos de descuentos, comisiones, impuestos y amortizaciones.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * int a = 17;
 * int b = 5;
 * int cocienteEntero = a / b;                // 3 (trunca decimales)
 * int resto = a % b;                         // 2
 * double divisionReal = (double) a / b;      // 3.4 (fuerza promoción a double)
 *
 * // Prevención de overflow en operaciones críticas (Java 8+)
 * int seguro = Math.multiplyExact(100_000, 10_000);
 *
 * // Módulo positivo garantizado para arreglos circulares
 * int indiceCircular = Math.floorMod(-1, 5); // Devuelve 4 (mientras -1 % 5 da -1)
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Cálculo de páginas necesarias para mostrar resultados de búsqueda y
 * desglose de tiempo de ejecución en un job de servidor.
 *
 * int totalRegistros = 95;
 * int registrosPorPagina = 20;
 * int totalPaginas = (totalRegistros + registrosPorPagina - 1) / registrosPorPagina;
 *
 * int duracionTotalSegundos = 3665;
 * int horas = duracionTotalSegundos / 3600;
 * int minutos = (duracionTotalSegundos % 3600) / 60;
 * int segundos = duracionTotalSegundos % 60;
 *
 * System.out.println("Páginas totales: " + totalPaginas);
 * System.out.println("Tiempo: " + horas + "h " + minutos + "m " + segundos + "s");
 *
 * Salida esperada:
 * Páginas totales: 5
 * Tiempo: 1h 1m 5s
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - Error común 1: `double promedio = (nota1 + nota2) / 2;` cuando `nota1` y
 *   `nota2` son `int`. La división ocurre como `int` ANTES de asignarse al
 *   `double` (ej. `9 / 2` asigna `4.0`). Divide entre `2.0` o haz cast `(double)`.
 * - Error común 2: Multiplicar dos `int` grandes esperando que quepan en un `long`:
 *   `long microsegundos = 86400 * 1000 * 1000;` desborda como `int` antes de
 *   convertirse a `long`. Solución: `86400L * 1000 * 1000`.
 * - Error común 3: Dividir entre `0` en enteros lanza `ArithmeticException: / by zero`,
 *   pero en `double` (`1.0 / 0.0`) NO lanza excepción, sino que devuelve
 *   `Double.POSITIVE_INFINITY` o `Double.NaN` (`0.0 / 0.0`).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Dados dos enteros `a = 25` y `b = 4`, muestra su suma, resta, producto,
 *    división entera, división decimal exacta y resto.
 * 2. Dados la base y la altura de un rectángulo (`double`), calcula y muestra
 *    su área, su perímetro y la longitud de su diagonal (`Math.hypot`).
 * 3. Convierte una cantidad de 3 días, 4 horas y 15 minutos al total de segundos.
 *
 * [Intermedio]
 * 4. Desglosa un monto de retiro en cajero automático (ej. $185) en la mínima
 *    cantidad de billetes de 50, 20, 10 y 5 usando `/` y `%`.
 * 5. Calcula el precio final de un producto aplicando primero un descuento del
 *    15% y luego un impuesto IVA del 19% sobre el valor descontado.
 * 6. Convierte 10,000 segundos a su representación desglosada en horas, minutos
 *    y segundos restantes.
 * 7. Dados tres enteros, calcula su promedio decimal exacto sin perder los
 *    decimales en la división.
 *
 * [Senior / Producción]
 * 8. Implementa la fórmula de paginación con aritmética entera (sin usar
 *    `Math.ceil`) para calcular cuántas páginas de tamaño `K` se requieren para
 *    `N` elementos; pruébalo con `N = 0`, `N = 20`, `N = 21` para `K = 20`.
 * 9. Demuestra el bug de overflow silencioso al calcular `int bytes = 3 * 1024 * 1024 * 1024;`
 *    y corrígelo de dos formas: usando literales `long` (`3L`) y detectándolo
 *    con `Math.multiplyExact`.
 * 10. Compara el comportamiento de `-13 % 5` frente a `Math.floorMod(-13, 5)` al
 *     rotar hacia atrás en un carrusel de 5 elementos (índices 0 a 4).
 */
public class Tema05OperadoresAritmeticos {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
