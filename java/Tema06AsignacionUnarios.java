/*
 * ============================================================================
 * TEMA 06: OPERADORES DE ASIGNACIÓN COMPUESTA Y OPERADORES UNARIOS
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * Los operadores de asignación compuesta (`+=`, `-=`, `*=`, `/=`, `%=`) mutan
 * una variable aplicando una operación sobre su valor actual. Los operadores
 * unarios (`++`, `--`, `!`, `-`, `+`) actúan sobre un único operando.
 *
 * Modelo Mental en la JVM:
 * - Instrucción `iinc` de Bytecode: Cuando haces `contador++` o `contador += 5`
 *   sobre una variable local `int`, la JVM ni siquiera necesita cargar valores
 *   a la pila de operandos; utiliza una instrucción dedicada ultraoptimizada
 *   (`iinc`) que modifica el registro local directamente.
 * - Prefijo (`++x`) vs Postfijo (`x++`):
 *   * `++x` (Pre-incremento): Incrementa la variable primero y luego entrega el
 *     NUEVO valor a la expresión.
 *   * `x++` (Post-incremento): Entrega una copia del valor ORIGINAL a la
 *     expresión y luego incrementa la variable.
 * - Cast Implícito en Asignación Compuesta (Especificación JLS §15.26.2):
 *   `E1 op= E2` equivale a `E1 = (TipoDeE1) (E1 op E2)`. Esto explica por qué
 *   `short s = 10; s += 5;` compila sin error mientras que `s = s + 5;` no compila.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Acumuladores financieros o estadísticos en recorridos de colecciones.
 * - Contadores de eventos, métricas de peticiones y reintentos de conexión.
 * - Inversión de estados booleanos (`mostrarPanel = !mostrarPanel`).
 * - Reducción progresiva de saldos, cuotas o stock de almacén.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * int saldo = 1000;
 * saldo += 250;                  // 1250 (equivalente a saldo = saldo + 250)
 * saldo -= 100;                  // 1150
 *
 * int i = 5;
 * int a = ++i;                   // i pasa a 6, y 'a' recibe 6 (prefijo)
 * int b = i++;                   // 'b' recibe 6, y luego i pasa a 7 (postfijo)
 *
 * boolean modoMantenimiento = false;
 * modoMantenimiento = !modoMantenimiento; // true (negación lógica)
 * int deuda = -saldo;            // -1150 (cambio de signo aritmético)
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Simulación de inventario y facturación acumulada en almacén.
 *
 * int stock = 50;
 * double ingresosAcumulados = 0.0;
 * int pedidosProcesados = 0;
 *
 * // Venta de 3 unidades a $19.99
 * stock -= 3;
 * ingresosAcumulados += 3 * 19.99;
 * int idPedidoActual = ++pedidosProcesados;
 *
 * System.out.println("Pedido #" + idPedidoActual + " | Stock restante: " + stock);
 * System.out.println("Ingresos acumulados: $" + ingresosAcumulados);
 *
 * Salida esperada:
 * Pedido #1 | Stock restante: 47
 * Ingresos acumulados: $59.97
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - Trampa clásica: `x = x++;` NO incrementa `x` (guarda el valor antiguo de `x`,
 *   incrementa `x`, y luego sobrescribe `x` con el valor antiguo guardado).
 *   Escribe siempre `x++;` en su propia línea independiente.
 * - Clean Code: Evita anidar `++` o `--` dentro de expresiones matemáticas
 *   complejas como `int r = a++ + --a * b++;`. Es código críptico y propenso a
 *   bugs. Separa el incremento de la expresión.
 * - Gotcha del cast oculto en `+=`: Si haces `int total = 10; total += 3.9;`,
 *   compila sin advertencias y trunca el resultado a `13` porque aplica un
 *   `(int)` implícito. Ten cuidado al mezclar tipos en `+=` o `*=`.
 * - En entornos multihilo, `contador++` NO es atómico (consta de lectura,
 *   suma y escritura). En concurrencia real se usa `AtomicInteger.incrementAndGet()`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Declara un saldo inicial de 500, súmale un depósito de 300 con `+=`, réstale
 *    un retiro de 120 con `-=` y muestra el saldo tras cada paso.
 * 2. Usa `+=` para acumular el costo de tres productos distintos y muestra el
 *    subtotal final.
 * 3. Incrementa un contador de visitas cinco veces mostrando su valor en cada paso.
 *
 * [Intermedio]
 * 4. Simula el control de existencias de un producto: inicia con 20 unidades,
 *    descuenta ventas de 1 unidad con `--` y lotes con `-=`, mostrando alertas.
 * 5. Invierte el signo de una variación financiera con el operador unario `-` y
 *    alterna el estado de una bandera `servicioActivo` tres veces con `!`.
 * 6. Utiliza `/=` y `%=` para reducir progresivamente un número y extraer su
 *    último dígito y el resto de dígitos en base 10.
 * 7. Actualiza la puntuación de un jugador aplicando primero un multiplicador de
 *    combo (`*=`) y luego una penalización fija (`-=`).
 *
 * [Senior / Producción]
 * 8. Demuestra con código y trazas por consola la diferencia exacta entre
 *    `++contador` (prefijo) y `contador++` (postfijo) al asignarlos a variables
 *    y al pasarlos como argumentos a `System.out.println`.
 * 9. Demuestra por qué la expresión `int x = 5; x = x++;` deja `x` valiendo `5`
 *    y reescríbela siguiendo estándares de Clean Code.
 * 10. Demuestra el cast implícito de `byte b = 100; b += 50;` (observa el overflow
 *     a negativo) y explica en comentarios por qué `b = b + 50;` ni siquiera compila.
 */
public class Tema06AsignacionUnarios {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
