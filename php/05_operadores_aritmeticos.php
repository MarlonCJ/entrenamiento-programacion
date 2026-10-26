<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 05: OPERADORES ARITMÉTICOS, DIVISIÓN ENTERA (INTDIV) Y PRECISIÓN DECIMAL
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental Numérico en el Zend Engine)
 * ----------------------------------------------------------------------------
 * PHP ofrece los operadores aritméticos clásicos (`+`, `-`, `*`, `/`, `%`, `**`),
 * pero tiene dos particularidades críticas que todo ingeniero Senior debe
 * dominar en el Zend Engine:
 *
 * 1) **La división `/` en PHP NO es división entera**:
 *    A diferencia de Java o C, en PHP `7 / 2` devuelve `float(3.5)` (y `4 / 2`
 *    devuelve `int(2)` porque es exacta). Si necesitas el cociente entero (por
 *    ejemplo, para convertir centavos a dólares o segundos a minutos), debes
 *    usar la función nativa **`intdiv($a, $b)`** (PHP 7+), que es rápida, exacta
 *    y lanza `DivisionByZeroError` si el divisor es `0`.
 * 2) **Imprecisión binaria de `float` (IEEE 754) en Finanzas**:
 *    En punto flotante binario, `0.1 + 0.2` es `0.30000000000000004`. Por eso,
 *    `0.1 + 0.2 === 0.3` evalúa a **`false`**!
 *    - En producción financiera en PHP se opera siempre en **centavos enteros**
 *      (`int`) o con la extensión de precisión arbitraria **BCMath** (`bcadd`,
 *      `bcsub`, `bcmul`, `bcdiv`).
 *    - Cuando uses `round($val, 2, $modo)`, puedes especificar el modo de
 *      redondeo contable (`PHP_ROUND_HALF_UP`, `PHP_ROUND_HALF_EVEN` / redondeo
 *      bancario).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Motores de Facturación y Desglose de Impuestos: Calcular subtotales, IVA,
 *   retenciones y propinas operando en centavos (`int`) o redondeando en el
 *   último paso con `round(..., 2, PHP_ROUND_HALF_EVEN)`.
 * - Desglose de Unidades Físicas y Tiempo (`intdiv` y `%`): Calcular cuántas
 *   cajas completas de 12 unidades y cuántas unidades sueltas se necesitan para
 *   despachar un pedido (`$cajas = intdiv($total, 12); $sueltas = $total % 12;`).
 * - Cálculo de Paginación: `$totalPaginas = intdiv($totalRegistros + $porPagina - 1, $porPagina);`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Operadores básicos y división entera explícita:
 * $suma = 15 + 4;              // 19 (int)
 * $divisionReal = 7 / 2;       // 3.5 (float)
 * $cocienteEntero = intdiv(7, 2); // 3 (int)
 * $residuo = 7 % 2;            // 1 (int)
 * $potencia = 2 ** 10;         // 1024 (int)
 *
 * // 2. Redondeo con modos explícitos:
 * $estandar = round(2.555, 2, PHP_ROUND_HALF_UP);   // 2.56
 * $bancario = round(2.5, 0, PHP_ROUND_HALF_EVEN);   // 2.0 (redondea al par más cercano)
 *
 * // 3. Resto en punto flotante:
 * $restoFloat = fmod(5.7, 1.3); // 0.5
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un dispensador automático de efectivo (ATM) y calculador logístico
 * desglosa una cantidad de segundos en horas, minutos y segundos usando
 * exclusivamente aritmética entera (`intdiv` y `%`).
 *
 * function formatearDuracion(int $totalSegundos): string {
 *     if ($totalSegundos < 0) {
 *         throw new InvalidArgumentException("Los segundos no pueden ser negativos");
 *     }
 *     $horas = intdiv($totalSegundos, 3600);
 *     $resto = $totalSegundos % 3600;
 *     $minutos = intdiv($resto, 60);
 *     $segundos = $resto % 60;
 *
 *     return sprintf("%02dh:%02dm:%02ds", $horas, $minutos, $segundos);
 * }
 *
 * // echo formatearDuracion(3665) . PHP_EOL;
 * // Salida esperada:
 * // 01h:01m:05s
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - PREFIERE `intdiv($a, $b)` FRENTE A `(int) ($a / $b)` O `floor($a / $b)`:
 *   Para enteros grandes (cercanos a `PHP_INT_MAX`), convertir a `float` con `/`
 *   pierde precisión en los bits menos significativos (porque un `float` solo
 *   tiene 53 bits de mantisa mientras que `int` tiene 64 bits). `intdiv` opera
 *   100% en enteros de 64 bits sin pérdida.
 * - COMPORTAMIENTO DE `%` CON NÚMEROS NEGATIVOS: En PHP, el signo del resultado
 *   de `$a % $b` toma el signo del **dividendo** (`$a`): `-7 % 3` devuelve `-1`.
 *   Si necesitas un módulo matemático siempre positivo (ej. para índices
 *   circulares), usa `(($a % $b) + $b) % $b`.
 * - EXCEPCIÓN `DivisionByZeroError` EN PHP 8: Tanto `$a / 0`, `$a % 0` como
 *   `intdiv($a, 0)` lanzan `DivisionByZeroError` (salvo `fdiv($a, 0.0)` que
 *   devuelve `INF`, `-INF` o `NAN` según el estándar IEEE 754).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Calculadora logística de empaque: Dado un pedido de `$unidades = 149` y
 *    cajas de capacidad `12`, usa `intdiv()` y `%` para mostrar cuántas cajas
 *    llenas se despachan y cuántas unidades quedan sueltas.
 * 2. Conversor exacto de centavos a dólares y centavos: Dado `$saldoCentavos = 15489`,
 *    obtén la parte entera en dólares y los centavos restantes sin usar `float`.
 * 3. Interés compuesto con `**`: Calcula el monto final de una inversión con la
 *    fórmula $M = C \times (1 + r)^n$ usando el operador de exponenciación `**` y
 *    redondeando a 2 decimales.
 *
 * [Intermedio]
 * 4. Cálculo exacto de páginas totales sin `float`: Implementa
 *    `calcularTotalPaginas(int $totalItems, int $itemsPorPagina): int` usando
 *    `intdiv()` para que `0` ítems den `0` páginas, `1..10` ítems (con tamaño 10)
 *    den `1` página y `11` ítems den `2` páginas.
 * 5. Demostración de imprecisión IEEE 754 y comparación con Épsilon: Muestra por
 *    qué `0.1 + 0.2 === 0.3` da `false` y crea una función
 *    `floatsIguales(float $a, float $b, float $epsilon = 1e-9): bool` usando `abs()`.
 * 6. Desglose óptimo de billetes (Cajero Automático): Dado un monto entero como
 *    `$187`, calcula cuántos billetes de `50`, `20`, `10`, `5` y `1` se deben
 *    entregar usando `intdiv` y `%`.
 * 7. Comparativa de redondeo comercial vs redondeo bancario: Demuestra sobre un
 *    lote de precios terminados en `.005` o `.5` la diferencia acumulada entre
 *    `PHP_ROUND_HALF_UP` y `PHP_ROUND_HALF_EVEN`.
 *
 * [Senior / Producción]
 * 8. Distribución de dinero sin perder el "centavo huérfano" (Algoritmo de
 *    reparto en cuotas): Si divides `$100.00` (`10000` centavos) en `3` cuotas
 *    iguales, `3333 * 3 = 9999` (se pierde 1 centavo!). Implementa
 *    `dividirEnCuotasExactas(int $totalCentavos, int $numCuotas): array` que
 *    reparta el residuo `1` centavo a las primeras cuotas (`[3334, 3333, 3333]`)
 *    para que la suma sea siempre idéntica al total.
 * 9. Índice circular seguro (Aritmética Modular Positiva): Implementa una función
 *    `obtenerElementoCircular(array $elementos, int $desplazamiento): mixed` que
 *    funcione tanto con desplazamientos positivos como negativos (`-1` devuelve
 *    el último elemento, `-2` el penúltimo) usando `(($i % $n) + $n) % $n`.
 * 10. Motor de liquidación de factura en centavos: Dado un arreglo de líneas
 *     (`cantidad`, `precioUnitarioCentavos`, `descuentoPorcentaje`, `ivaPorcentaje`),
 *     calcula el subtotal bruto, el descuento, la base gravable, el IVA y el
 *     total neto operando íntegramente en centavos con redondeo explícito.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
