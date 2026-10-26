'use strict';

/*
 * ============================================================================
 * TEMA 05: OPERADORES ARITMÉTICOS, OBJETO MATH Y PRECISIÓN DECIMAL (IEEE 754)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental Numérico en JavaScript)
 * ----------------------------------------------------------------------------
 * En JavaScript, todos los números del tipo `number` son números de punto
 * flotante de doble precisión de 64 bits según el estándar **IEEE 754** (no
 * existe un tipo `int` separado de 32 bits como en Java o C, salvo `BigInt`).
 *
 * Consecuencias directas que todo desarrollador Senior debe dominar:
 * 1) **La división `/` SIEMPRE es división real (con decimales)**:
 *    `7 / 2` devuelve `3.5`. Para obtener el cociente entero existen dos
 *    herramientas con comportamiento distinto en números negativos:
 *    - `Math.trunc(x)`: Elimina la parte decimal truncando hacia **cero**
 *      (`Math.trunc(-3.7)` -> `-3`). Equivalente a `intdiv`.
 *    - `Math.floor(x)`: Redondea hacia **menos infinito** (`Math.floor(-3.7)` -> `-4`).
 * 2) **Imprecisión Decimal Binaria (`0.1 + 0.2 === 0.30000000000000004`)**:
 *    En binario, fracciones como `1/10` (`0.1`) son periódicas infinitas. En
 *    sistemas de comercio electrónico, banca o contabilidad **NUNCA sumes precios
 *    directamente en dólares con decimales**: trabaja siempre en **centavos
 *    enteros** (`$19.99` -> `1999` centavos) y divide entre `100` solo al mostrar.
 * 3) **División por Cero (`Infinity` y `NaN`)**:
 *    A diferencia de Python, PHP o Java, en JS `10 / 0` **NO lanza excepción**:
 *    devuelve `Infinity`, `-10 / 0` devuelve `-Infinity` y `0 / 0` devuelve `NaN`!
 *    Por eso debes verificar `Number.isFinite(resultado)` tras cálculos críticos.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Motores de Carrito de Compras y Pasarelas de Pago (Stripe/PayPal): Operar
 *   todos los montos, impuestos y descuentos en centavos enteros (`Math.round(precio * 100)`).
 * - Acotamiento de Valores (*Clamping*): Limitar un porcentaje entre `0` y `100`
 *   con `Math.min(100, Math.max(0, valor))`.
 * - Cálculos de Paginación y Tiempos: `Math.ceil(totalItems / porPagina)` y
 *   desglose de milisegundos con `Math.trunc()` y `%`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Operaciones aritméticas y división entera:
 * const cociente = Math.trunc(17 / 5); // 3
 * const residuo  = 17 % 5;             // 2
 * const potencia = 2 ** 10;            // 1024
 *
 * // 2. Redondeo seguro a 2 decimales (evitando el sesgo de punto flotante con Number.EPSILON):
 * function redondearMoneda(valor) {
 *     return Math.round((valor + Number.EPSILON) * 100) / 100;
 * }
 *
 * // 3. Acotar un número dentro de un rango [min, max] (Clamp):
 * const acotar = (num, min, max) => Math.min(max, Math.max(min, num));
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un motor de facturación calcula el subtotal, el IVA (19%) y el
 * total de una orden trabajando íntegramente en centavos enteros para evitar
 * cualquier error de punto flotante IEEE 754.
 *
 * function liquidarOrdenEnCentavos(lineas, tasaIva = 0.19) {
 *     let subtotalCentavos = 0;
 *     for (const { precioCentavos, cantidad } of lineas) {
 *         subtotalCentavos += precioCentavos * cantidad;
 *     }
 *     const ivaCentavos = Math.round(subtotalCentavos * tasaIva);
 *     const totalCentavos = subtotalCentavos + ivaCentavos;
 *
 *     return {
 *         subtotal: (subtotalCentavos / 100).toFixed(2),
 *         iva: (ivaCentavos / 100).toFixed(2),
 *         total: (totalCentavos / 100).toFixed(2),
 *     };
 * }
 *
 * const resumen = liquidarOrdenEnCentavos([
 *     { precioCentavos: 10, cantidad: 1 }, // $0.10
 *     { precioCentavos: 20, cantidad: 1 }, // $0.20 -> Subtotal exacto $0.30!
 * ]);
 * console.log(JSON.stringify(resumen));
 * // Salida esperada:
 * // {"subtotal":"0.30","iva":"0.06","total":"0.36"}
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - CUIDADO CON `Math.round(-1.5)` EN JAVASCRIPT: En JS, `Math.round` redondea
 *   los `.5` hacia **`+Infinity`** (hacia arriba en la recta numérica):
 *   `Math.round(1.5)` es `2`, pero `Math.round(-1.5)` es **`-1`** (no `-2`!).
 * - EL OPERADOR `%` EN JS ES RESTO (REMAINDER), NO MÓDULO MATEMÁTICO:
 *   `-7 % 3` devuelve `-1` (conserva el signo del dividendo). Para obtener un
 *   módulo siempre positivo en arreglos circulares, usa `((n % m) + m) % m`.
 * - EXISTENCIA DE `-0` (Cero Negativo) EN JS: `-0 === 0` es `true`, pero
 *   `1 / -0` es `-Infinity` y `Object.is(-0, 0)` es `false`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Desglose de milisegundos: Dado un tiempo de `3_725_400` ms, calcula cuántas
 *    horas, minutos, segundos y milisegundos representa usando `Math.trunc()` y `%`.
 * 2. Cálculo de páginas totales con `Math.ceil()`: Implementa
 *    `calcularPaginas(totalRegistros, tamanoPagina)` validando que si
 *    `totalRegistros === 0` devuelva `0` y no falle si `tamanoPagina <= 0`.
 * 3. Función `clamp` (Acotador de rango): Implementa `acotar(valor, min, max)`
 *    con `Math.min` y `Math.max` para garantizar que un descuento porcentual
 *    nunca sea menor a `0` ni mayor a `50`.
 *
 * [Intermedio]
 * 4. Demostración de IEEE 754 y comparación con `Number.EPSILON`: Muestra el
 *    resultado exacto de `0.1 + 0.2` e implementa `sonCasiIguales(a, b, tolerancia = Number.EPSILON)`
 *    usando `Math.abs(a - b) <= tolerancia`.
 * 5. Diferencia entre `Math.floor`, `Math.ceil`, `Math.round` y `Math.trunc`:
 *    Imprime una tabla comparativa evaluando los 4 métodos sobre los números
 *    `3.2`, `3.7`, `-3.2`, `-3.5` y `-3.7`.
 * 6. Distancia euclidiana con `Math.hypot()`: Calcula si un repartidor en la
 *    coordenada `(x1, y1)` está dentro del radio de cobertura `R` de una tienda
 *    en `(x2, y2)` usando `Math.hypot(x2 - x1, y2 - y1)`.
 * 7. Interés compuesto y amortización de cuota fija (Fórmula Francesa):
 *    Implementa el cálculo de la cuota mensual fija de un préstamo usando `**`:
 *    $C = P \cdot \frac{i(1+i)^n}{(1+i)^n - 1}$.
 *
 * [Senior / Producción]
 * 8. Reparto Financiero en Cuotas sin Perder Centavos (*Penny Allocation*):
 *    Implementa `dividirMontoEnCuotas(totalCentavos, numeroCuotas)` que divida
 *    por ejemplo `10000` centavos ($100.00) en `3` cuotas devolviendo
 *    `[3334, 3333, 3333]` para que la suma de las cuotas sea exactamente igual
 *    al total sin perder ni crear 1 centavo.
 * 9. Redondeo Bancario (*Round Half to Even* / Gaussiano): En contabilidad, para
 *    no inflar las sumas al redondear siempre `.5` hacia arriba, los `.5` exactos
 *    se redondean al número par más cercano (`2.5 -> 2`, `3.5 -> 4`). Implementa
 *    `redondeoBancario(valor, decimales = 2)`.
 * 10. Estadística Descriptiva Segura contra Overflow: Dado un arreglo de tiempos
 *     de latencia en milisegundos, calcula en funciones limpias el mínimo,
 *     máximo, media aritmética, varianza poblacional y desviación estándar
 *     (`Math.sqrt`), validando que nunca devuelva `NaN` ni `Infinity`.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
