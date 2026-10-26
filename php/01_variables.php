<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 01: VARIABLES, TIPOS DE DATOS Y MODELO DE MEMORIA (ZVAL Y COPY-ON-WRITE)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y Zend Engine)
 * ----------------------------------------------------------------------------
 * En PHP, toda variable comienza con el símbolo `$` y es gestionada internamente
 * por el motor **Zend Engine** mediante una estructura en C llamada **`zval`**
 * (Zend Value, de 16 bytes en sistemas de 64 bits).
 *
 * Modelo Mental en el Zend Engine (PHP 8.x):
 * - **Tipado Dinámico Gradual + `declare(strict_types=1)`**:
 *   Aunque las variables locales no llevan declaración de tipo al asignarse,
 *   PHP 8 cuenta con un sistema de tipos estricto para parámetros, retornos y
 *   propiedades de clase. Colocar `declare(strict_types=1);` en la primera línea
 *   del archivo desactiva la coerción silenciosa (ej. pasar `"123"` donde se
 *   espera `int` lanzará un `TypeError` en lugar de convertirlo en silencio).
 * - **Copy-On-Write (Copia en Escritura)**:
 *   Si asignas `$b = $a;` donde `$a` es un texto grande o un arreglo de 10,000
 *   elementos, PHP **NO duplica la memoria inmediatamente**: ambas variables
 *   apuntan al mismo `zval` incrementando un contador de referencias (`refcount`).
 *   Solo cuando modificas `$b`, el Zend Engine clona el bloque de memoria.
 * - **Los 8 Tipos Fundamentales**:
 *   - Escalares: `int` (64 bits con signo), `float` (IEEE 754 doble precisión),
 *     `string` (arreglo de bytes + longitud), `bool` (`true` / `false`).
 *   - Compuestos: `array` (mapa hash ordenado), `object`, `callable`, `iterable`.
 *   - Especiales: `null`, `resource`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Contratos estrictos en APIs y Servicios: Activar `declare(strict_types=1);`
 *   en todos los archivos de un proyecto Laravel/Symfony para detectar errores
 *   de tipos inmediatamente.
 * - Inspección y depuración precisa: Usar `var_dump($valor)` o `get_debug_type($valor)`
 *   (PHP 8+) para conocer el tipo exacto de un dato recibido desde JSON o BD.
 * - Manejo de memoria eficiente: Aprovechar el *Copy-On-Write* pasando arreglos
 *   por valor sin temor a copias innecesarias en memoria mientras solo se lean.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * $idUsuario = 1045;                   // int (64 bits)
 * $tasaInteres = 0.045;                // float (double precision)
 * $presupuesto = 1_500_000.00;         // Separador numérico visual (PHP 7.4+)
 * $nombreCliente = "Ana Pérez";        // string
 * $cuentaActiva = true;                // bool
 * $fechaBaja = null;                   // null (ausencia de valor)
 *
 * // Inspección de tipo moderna (PHP 8.0+):
 * echo get_debug_type($idUsuario) . PHP_EOL; // "int"
 * echo get_debug_type($fechaBaja) . PHP_EOL; // "null"
 *
 * // Intercambio rápido mediante destructuring de arreglos (sin variable temporal):
 * [$a, $b] = [10, 20];
 * [$a, $b] = [$b, $a]; // $a = 20, $b = 10
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un módulo de carrito de e-commerce registra el estado de una línea
 * de compra, calcula el subtotal en centavos (evitando errores de coma flotante)
 * e inspecciona los tipos en tiempo de ejecución.
 *
 * $sku = "LAP-PRO-16";
 * $cantidad = 2;
 * $precioUnitarioCentavos = 129_900; // $1,299.00 expresado en centavos (int)
 * $disponible = true;
 * $cuponAplicado = null;
 *
 * $subtotalCentavos = $cantidad * $precioUnitarioCentavos;
 * $subtotalFormateado = number_format($subtotalCentavos / 100, 2, '.', ',');
 *
 * echo sprintf(
 *     "SKU: %s (%s) | Cant: %d | Subtotal: $%s | Cupón: %s" . PHP_EOL,
 *     $sku,
 *     get_debug_type($sku),
 *     $cantidad,
 *     $subtotalFormateado,
 *     $cuponAplicado ?? 'Ninguno'
 * );
 * // Salida esperada:
 * // SKU: LAP-PRO-16 (string) | Cant: 2 | Subtotal: $2,598.00 | Cupón: Ninguno
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - DECLARA SIEMPRE `declare(strict_types=1);` AL INICIO DEL ARCHIVO: Sin esta
 *   directiva, PHP convierte silenciosamente `"42 Manzanas"` o `true` en números
 *   al pasarlos a funciones tipadas, ocultando bugs graves.
 * - EVITA LAS REFERENCIAS MANUALES (`&$var`) SALVO QUE SEA IMPRESCINDIBLE:
 *   Muchos programadores usan `&$arreglo` creyendo que "ahorra memoria". En
 *   realidad, crear una referencia manual **rompe el Copy-On-Write** del Zend
 *   Engine y a menudo hace el código más lento y propenso a mutaciones accidentales.
 * - NUNCA USES VARIABLES VARIABLES (`$$nombre`) NI `extract()`: Destruyen el
 *   análisis estático (PHPStan/Psalm) y abren brechas de seguridad si provienen
 *   de datos del usuario.
 * - CONVENCIÓN PSR-12: Usa `$camelCase` descriptivo para variables (`$totalPagado`,
 *   `$esClienteVip`) y evita abreviaturas crípticas (`$t`, `$x1`, `$tmp`).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Ficha técnica de servidor: Declara variables para `$hostname` (string),
 *    `$nucleosCpu` (int), `$usoMemoriaGb` (float) y `$enLinea` (bool), y muestra
 *    cada valor junto con su tipo usando `get_debug_type()`.
 * 2. Legibilidad numérica: Declara el presupuesto anual de una empresa y la
 *    población de un país usando separadores visuales `_` (`12_500_000`) y
 *    muéstralos formateados con `number_format()`.
 * 3. Intercambio sin variable temporal: Declara `$origen = "Bogotá"` y
 *    `$destino = "Madrid"`, intercambia sus valores en una sola línea usando
 *    *array destructuring* (`[$a, $b] = [$b, $a]`) e imprime el resultado.
 *
 * [Intermedio]
 * 4. Diferencia entre `isset()`, `empty()` e `is_null()`: Declara cuatro variables
 *    con valores `null`, `0`, `""` y `false`. Imprime una tabla comparativa que
 *    demuestre cómo `empty(0)` y `empty("0")` dan `true` (trampa clásica de PHP),
 *    mientras que `$v === null` solo detecta nulos reales.
 * 5. Contabilidad en centavos vs `float`: Calcula la suma de tres cobros de
 *    `$0.10`, `$0.20` y `$0.30` usando `float` y usando `int` (en centavos),
 *    comparando ambos resultados con `===`.
 * 6. Ciclo de vida y `unset()`: Crea una variable con un arreglo de datos,
 *    verifica su existencia, destrúyela con `unset($var)` y demuestra cómo
 *    verificarla de forma segura con `isset()` antes de leerla.
 * 7. Inspección de referencias vs Copy-On-Write: Asigna `$copia = $original`,
 *    modifica `$copia` y demuestra que `$original` permanece intacto; luego haz
 *    lo mismo con `$ref =& $original` (rompiendo el enlace después con `unset($ref)`).
 *
 * [Senior / Producción]
 * 8. Demostración de `strict_types=1`: Crea una función tipada
 *    `calcularImpuesto(int $montoCentavos, float $tasa): int` y envuelve en un
 *    `try / catch (TypeError $e)` el intento de invocarla pasando un `string`
 *    numérico `"1000"` para demostrar la protección del motor.
 * 9. Inspector diagnóstico de variables (`inspeccionarValor(mixed $valor): string`):
 *    Implementa una función que reciba cualquier tipo (`mixed`) y devuelva una
 *    descripción segura para logs (ej. `"string(len=8): 'Hola...'"`, `"int: 42"`,
 *    `"array(count=3)"`, `"null"`).
 * 10. Normalizador de configuración de entorno: Simula la lectura de variables
 *     crudas de entorno (`"true"`, `"8080"`, `"1_000"`, `null`) y construye un
 *     arreglo asociativo con cada valor convertido estrictamente a su tipo
 *     escalar nativo (`bool`, `int`, `string`).
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
