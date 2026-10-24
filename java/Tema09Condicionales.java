/*
 * ============================================================================
 * TEMA 09: ESTRUCTURAS CONDICIONALES (`if/else`, Guard Clauses y `switch` Moderno)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * Las estructuras condicionales dirigen el flujo de ejecución del programa
 * tomando caminos distintos según el estado de los datos.
 *
 * En Java moderno (Java 14+ / 17 LTS / 21 LTS), contamos con dos grandes
 * herramientas:
 * 1) `if / else if / else`: Ideal para evaluar rangos numéricos, condiciones
 *    booleanas compuestas y cláusulas de guarda (Guard Clauses).
 * 2) `switch` Expressions con sintaxis flecha (`->`): Una evolución mayor del
 *    lenguaje que devuelve un valor directamente, elimina el peligroso "fall-through"
 *    accidental (olvido de `break`) y verifica exhaustividad en compilación.
 *
 * Modelo Mental en la JVM:
 * Un `if` se traduce en saltos condicionales en bytecode (`ifeq`, `if_icmpge`),
 * mientras que un `switch` se compila en tablas de salto (`tableswitch` en $O(1)$
 * para valores contiguos o `lookupswitch` en $O(\log n)$ para valores dispersos),
 * siendo más rápido y limpio que una larga cadena de `else if` sobre un mismo valor.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Guard Clauses (Retorno Temprano): Validar precondiciones al inicio de un
 *   método para rechazar entradas inválidas rápido y mantener el camino feliz
 *   sin indentación profunda.
 * - Escalado de tarifas, tramos de impuestos (IRPF/Renta) y descuentos por volumen.
 * - Máquinas de estados de pedidos (`PENDIENTE`, `PAGADO`, `ENVIADO`, `CANCELADO`)
 *   usando expresiones `switch` modernas.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // 1. if / else if / else (ordenar siempre de la condición más específica a la general)
 * if (puntaje >= 90) {
 *     System.out.println("Excelente");
 * } else if (puntaje >= 60) {
 *     System.out.println("Aprobado");
 * } else {
 *     System.out.println("Reprobado");
 * }
 *
 * // 2. Switch Expression moderno (Java 14+ / 17 LTS): sin break, devuelve un valor
 * String dia = "SABADO";
 * String tipoJornada = switch (dia) {
 *     case "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES" -> "Día laboral";
 *     case "SABADO", "DOMINGO" -> "Fin de semana";
 *     default -> {
 *         System.err.println("Día no reconocido: " + dia);
 *         yield "Desconocido"; // 'yield' devuelve el valor desde un bloque multilínea
 *     }
 * };
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Cálculo de comisión de pasarela de pago según el método elegido y el monto.
 *
 * String metodoPago = "TARJETA_CREDITO";
 * double monto = 200.0;
 *
 * double tasaComision = switch (metodoPago) {
 *     case "TRANSFERENCIA", "PSE" -> 0.0;
 *     case "TARJETA_DEBITO" -> 0.015;
 *     case "TARJETA_CREDITO" -> (monto > 100.0) ? 0.025 : 0.035;
 *     default -> throw new IllegalArgumentException("Método inválido: " + metodoPago);
 * };
 *
 * double comision = monto * tasaComision;
 * System.out.println("Método: " + metodoPago + " | Comisión: $" + comision);
 *
 * Salida esperada:
 * Método: TARJETA_CREDITO | Comisión: $5.0
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - Error común 1 (Orden incorrecto de `else if`): Si pones `if (nota >= 60)`
 *   antes de `else if (nota >= 90)`, el segundo bloque es código muerto inalcanzable
 *   porque cualquier nota de 95 ya entró al primer `if`.
 * - Error común 2 (Omitir llaves `{}`): Nunca escribas `if (cond) hacerAlgo();`
 *   sin llaves. Si alguien añade una segunda línea indentada debajo, se ejecutará
 *   SIEMPRE (causa del famoso bug "goto fail" de Apple SSL).
 * - Clean Code (Evita el "Arrow Anti-Pattern"): En lugar de anidar 4 niveles de
 *   `if` dentro de `if`, invierte las condiciones y sal temprano (Guard Clauses).
 * - Prefiere siempre `switch` con flecha `->` sobre el antiguo `switch` con `:`
 *   y `break` para evitar bugs por caída accidental al siguiente `case`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Dado un número entero, indica si es positivo, negativo o exactamente cero.
 * 2. Dada una edad, verifica primero que sea un valor coherente (`0` a `125`) y
 *    luego indica si la persona puede votar (`>= 18`).
 * 3. Dado un número entero, muestra si es par o impar.
 *
 * [Intermedio]
 * 4. Dados tres números enteros, determina cuál es el mayor contemplando
 *    explícitamente si hay empate entre dos o los tres valores.
 * 5. Convierte una nota numérica (`0` a `100`) a su calificación en letra
 *    (`A`: 90-100, `B`: 80-89, `C`: 70-79, `D`: 60-69, `F`: <60) validando el rango.
 * 6. Calcula el cobro de un estacionamiento por tramos: primera hora gratis,
 *    de 2 a 4 horas a $3 por hora, y más de 4 horas con tarifa plana de $15.
 * 7. Dadas tres longitudes `a`, `b` y `c`, verifica si pueden formar un triángulo
 *    válido (desigualdad triangular) y clasifícalo en Equilátero, Isósceles o Escaleno.
 *
 * [Senior / Producción]
 * 8. Utiliza una expresión `switch` moderna (`->`) para mapear un código de
 *    estado HTTP (`200`, `201`, `400`, `401`, `403`, `404`, `500`, `503`) a su
 *    categoría técnica y acción recomendada de reintento.
 * 9. Refactoriza una validación de pedido anidada (cliente activo -> carrito no
 *    vacío -> saldo suficiente -> dirección válida) aplicando Guard Clauses.
 * 10. Implementa una calculadora de impuestos progresivos por tramos salariales
 *     (0% hasta $1000, 10% sobre el exceso entre $1000 y $3000, y 20% sobre el
 *     exceso de $3000) mostrando el desglose exacto por tramo.
 */
public class Tema09Condicionales {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
