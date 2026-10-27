/*
 * ============================================================================
 * TEMA 05: OPERADORES ARITMÉTICOS, IEEE 754, BIGINT Y DINERO CON BRANDED TYPES
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: cómo calcula el motor V8)
 * ----------------------------------------------------------------------------
 * TypeScript distingue dos tipos numéricos primitivos en runtime: `number` y
 * `bigint`. Entender su representación binaria evita errores financieros graves:
 *
 * 1) **`number` es coma flotante IEEE 754 de 64 bits (double)**: no existe un
 *    tipo `int` o `float` separado. Tiene 53 bits de mantisa, por lo que los
 *    enteros exactos llegan hasta `Number.MAX_SAFE_INTEGER` ($2^{53} - 1$, es
 *    decir, `9_007_199_254_740_991`). Más allá, `9007199254740992 + 1` da el
 *    mismo número sin lanzar error.
 * 2) **Inexactitud decimal en base 2**: fracciones como `0.1` y `0.2` son
 *    periódicas en binario, por eso `0.1 + 0.2 === 0.30000000000000004`. Nunca
 *    uses `number` con decimales para acumular dinero.
 * 3) **División entre cero y restos con signo**:
 *    - `1 / 0` produce `Infinity`, `-1 / 0` produce `-Infinity` y `0 / 0` da
 *      `NaN` (ninguno lanza excepción en `number`; en cambio `1n / 0n` en
 *      `bigint` sí lanza `RangeError`).
 *    - En JS/TS, `%` es el operador **resto** (conserva el signo del dividendo:
 *      `-7 % 3 === -1`), no el módulo matemático (`2`). Para un índice circular
 *      siempre positivo usa `((a % n) + n) % n`.
 * 4) **`bigint` (`100n`)**: enteros de precisión arbitraria. Su división `/`
 *    trunca hacia cero (`7n / 2n === 3n`). TypeScript prohíbe mezclar `number`
 *    y `bigint` en una misma operación (`10n + 5` es error TS2365).
 * 5) **Branded Types (tipos nominales para unidades y monedas)**: como `number`
 *    sirve para todo, TS permite sumar `dolares + kilometros`. Añadiendo una
 *    marca fantasma (`number & { readonly __brand: 'CentavosUsd' }`), el
 *    compilador impide mezclar divisas o centavos con dólares con **cero costo**
 *    en runtime.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Pasarelas de pago (Stripe, Adyen, Mercado Pago) y contabilidad: trabajar en
 *   centavos enteros (`1999` para `$19.99`) tipados con *branded types*.
 * - IDs de bases de datos de 64 bits (`BIGINT` en PostgreSQL, snowflakes de
 *   Twitter/Discord) que superan `Number.MAX_SAFE_INTEGER` y requieren `bigint`.
 * - Paginación (`Math.ceil(total / tamanoPagina)`), reparto de cuotas con
 *   manejo del centavo sobrante y buffers circulares (`((i % n) + n) % n`).
 * - Telemetría e ingeniería: conversiones de unidades seguras por tipo
 *   (`Segundos` vs `Milisegundos`, `Bytes` vs `Megabytes`).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // Operadores aritméticos con separadores numéricos de legibilidad (_)
 * const subtotal = 125_000 + 35_500;           // 160500
 * const potencia = 2 ** 10;                    // 1024
 * const cocienteEntero = Math.trunc(17 / 5);   // 3 (trunca hacia 0)
 * const resto = 17 % 5;                        // 2
 * const moduloPositivo = ((-1 % 7) + 7) % 7;   // 6 (índice circular seguro)
 *
 * // Redondeos en Math (cuidado: Math.round(-1.5) es -1, redondea hacia +Infinity)
 * Math.floor(4.9);  // 4   | Math.ceil(4.1);   // 5   | Math.trunc(-4.9); // -4
 * Math.hypot(3, 4); // 5   | Math.clamped = Math.min(Math.max(x, 0), 100);
 *
 * // BigInt para enteros mayores a 2^53 - 1
 * const idSnowflake = 9_007_199_254_740_993n;
 * const siguienteId = idSnowflake + 1n;        // 9007199254740994n (exacto)
 *
 * // Branded Types para impedir mezclar monedas o unidades en compilación
 * type CentavosUsd = number & { readonly __brand: 'CentavosUsd' };
 * type CentavosCop = number & { readonly __brand: 'CentavosCop' };
 *
 * function usdEnCentavos(valor: number): CentavosUsd {
 *     if (!Number.isSafeInteger(valor)) throw new RangeError('Debe ser entero en centavos');
 *     return valor as CentavosUsd;
 * }
 * function sumarUsd(a: CentavosUsd, b: CentavosUsd): CentavosUsd {
 *     return (a + b) as CentavosUsd;
 * }
 * // sumarUsd(usdEnCentavos(500), 500 as CentavosCop); // Error TS2345 en compilación
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un motor de facturación calcula el desglose de un pedido en
 * centavos enteros (sin errores IEEE 754) y reparte una factura en 3 cuotas
 * mensuales sin perder ni inventar ni un solo centavo.
 *
 * type Centavos = number & { readonly __marca: 'Centavos' };
 *
 * function centavos(entero: number): Centavos {
 *     if (!Number.isSafeInteger(entero)) {
 *         throw new RangeError(`Centavos inválidos: ${entero}`);
 *     }
 *     return entero as Centavos;
 * }
 *
 * function desdeDolares(monto: number): Centavos {
 *     return centavos(Math.round(monto * 100));
 * }
 *
 * function aplicarPorcentaje(base: Centavos, puntosBasicos: number): Centavos {
 *     // 1 punto básico = 0.01% (1900 bps = 19.00% de IVA)
 *     return centavos(Math.round((base * puntosBasicos) / 10_000));
 * }
 *
 * function dividirEnCuotas(total: Centavos, cuotas: number): Centavos[] {
 *     const cuotaBase = Math.trunc(total / cuotas);
 *     const sobrante = total % cuotas; // centavos que se reparten de a 1
 *     return Array.from({ length: cuotas }, (_, i) =>
 *         centavos(cuotaBase + (i < sobrante ? 1 : 0)),
 *     );
 * }
 *
 * function formatearUsd(c: Centavos): string {
 *     const signo = c < 0 ? '-' : '';
 *     const abs = Math.abs(c);
 *     const dolares = Math.trunc(abs / 100);
 *     const resto = String(abs % 100).padStart(2, '0');
 *     return `${signo}$${dolares}.${resto}`;
 * }
 *
 * const item1 = desdeDolares(0.1);
 * const item2 = desdeDolares(0.2);
 * const sumaExacta = centavos(item1 + item2);
 * console.log(`Float: ${0.1 + 0.2} | Centavos: ${formatearUsd(sumaExacta)}`);
 *
 * const neto = desdeDolares(100);
 * const iva19 = aplicarPorcentaje(neto, 1900);
 * const totalFactura = centavos(neto + iva19);
 * const plan3Cuotas = dividirEnCuotas(centavos(10_000), 3); // $100.00 en 3 cuotas
 * console.log(`Total con IVA: ${formatearUsd(totalFactura)}`);
 * console.log('3 cuotas de $100.00:', plan3Cuotas.map(formatearUsd).join(', '));
 *
 * // Salida esperada:
 * // Float: 0.30000000000000004 | Centavos: $0.30
 * // Total con IVA: $119.00
 * // 3 cuotas de $100.00: $33.34, $33.33, $33.33
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA COMPARES FLOATS CON `===`: `0.1 + 0.2 === 0.3` es `false`. Para
 *   geometría o física usa `Math.abs(a - b) < Number.EPSILON`; para dinero usa
 *   enteros en la unidad mínima (centavos) o una librería decimal.
 * - `1 / 0` NO LANZA ERROR EN JS: devuelve `Infinity` y contamina cálculos
 *   posteriores (`Infinity - Infinity` da `NaN`). Valida el divisor antes de
 *   dividir y verifica el resultado con `Number.isFinite()`.
 * - `%` PUEDE DAR NEGATIVO: en un carrusel de imágenes, `(indice - 1) % total`
 *   da `-1` cuando `indice` es `0`, y `items[-1]` es `undefined`. Usa siempre
 *   `((indice - 1) % total + total) % total`.
 * - `JSON.stringify(10n)` LANZA `TypeError`: JSON no soporta `BigInt` de forma
 *   nativa. Serializa los `bigint` como `string` (`id.toString()`) en las APIs.
 * - `Math.round` NO ES REDONDEO BANCARIO (half-to-even): `Math.round(2.5)` da
 *   `3` y `Math.round(3.5)` también da `4`. Si la normativa contable exige
 *   *round half to even*, impleméntalo explícitamente.
 * - USA SEPARADORES NUMÉRICOS (`1_000_000`, `60_000` ms): no cambian el valor
 *   en runtime y evitan errores de un cero de más o de menos en revisión.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. División segura: implementa `dividir(dividendo: number, divisor: number):
 *    number | null` que devuelva `null` si el divisor es `0` o si alguno de los
 *    operandos no es finito.
 * 2. Desglose de tiempo: escribe `desglosarSegundos(totalSegundos: number)` que
 *    use `Math.trunc` y `%` para devolver `{ dias, horas, minutos, segundos }`.
 * 3. Paginación: crea `calcularPaginas(totalRegistros: number, porPagina:
 *    number)` que devuelva el total de páginas (`Math.ceil`) y el rango `[inicio,
 *    fin]` de la página actual.
 *
 * [Intermedio]
 * 4. Índice circular: implementa `moverCarrusel(actual: number, desplazamiento:
 *    number, longitud: number): number` que funcione con desplazamientos
 *    positivos y negativos grandes (p. ej. `-15` en una lista de `4` elementos).
 * 5. Unidades con Branded Types: define `Segundos` y `Milisegundos` como tipos
 *    con marca, constructores `seg(n)` y `ms(n)`, y un conversor `aMilisegundos(s:
 *    Segundos): Milisegundos`. Comprueba que `setTimeout` envuelto solo acepte
 *    `Milisegundos`.
 * 6. Calculadora de descuento e IVA en centavos: dado precio unitario, cantidad,
 *    porcentaje de descuento y porcentaje de IVA, calcula subtotal, descuento,
 *    base gravable, impuesto y total usando únicamente enteros seguros.
 * 7. Precisión `bigint`: demuestra con código en qué valor exacto falla
 *    `Number.MAX_SAFE_INTEGER + 2` y resuélvelo con `BigInt` calculando el
 *    factorial de `25n`.
 *
 * [Senior / Producción]
 * 8. Reparto proporcional sin pérdida de centavos (prorrateo): implementa
 *    `prorratear(total: Centavos, pesos: readonly number[]): Centavos[]` (por
 *    ejemplo, repartir un cupón de descuento entre varios ítems del carrito
 *    según su precio) garantizando que la suma de las partes sea exactamente
 *    igual a `total`.
 * 9. Redondeo bancario (*half-to-even*): implementa `redondearBancario(valor:
 *    number, decimales: number): number` donde los `.5` exactos redondean al par
 *    más cercano (`2.5 -> 2`, `3.5 -> 4`), y compáralo con `Math.round`.
 * 10. Clase inmutable `Dinero<M extends 'USD' | 'EUR' | 'COP'>`: almacena el
 *     monto en `bigint` de centavos y la moneda `M`, con métodos `sumar`,
 *     `restar`, `multiplicar` y `asignarEnPartes(n)`. El sistema de tipos debe
 *     impedir sumar `Dinero<'USD'>` con `Dinero<'COP'>` en tiempo de compilación.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
