<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 25: PROGRAMACIÓN FUNCIONAL (ARRAY_MAP, ARRAY_FILTER, ARRAY_REDUCE Y PIPELINES)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Transformaciones Inmutables)
 * ----------------------------------------------------------------------------
 * La programación funcional en PHP consiste en construir software componiendo
 * **funciones puras** (funciones cuyo resultado depende únicamente de sus
 * argumentos de entrada y que no mutan estado global ni referencias externas) y
 * transformando colecciones mediante primitivas declarativas:
 *
 * 1) **`array_map(callable $fn, array $arr)`**: Transforma cada elemento $x \to f(x)$
 *    devolviendo un nuevo arreglo de la misma longitud.
 * 2) **`array_filter(array $arr, callable $predicado)`**: Conserva solo los
 *    elementos que cumplen el predicado booleano.
 *    ¡Detalle crítico en PHP!: `array_filter` **preserva las claves originales**
 *    (dejando huecos en los índices numéricos `[0 => 'a', 2 => 'c']`). Si
 *    necesitas una lista reindexada `0..N-1`, envuélvelo en `array_values(...)`.
 * 3) **`array_reduce(array $arr, callable $reductor, mixed $inicial)`**:
 *    Colapsa todo un arreglo en un único valor acumulado (un número, un string o
 *    incluso un nuevo arreglo agrupado/indexado).
 *
 * ¡Cuidado con la Inconsistencia Histórica del Orden de Argumentos en PHP!:
 * - `array_map($callback, $arreglo)` -> El **callback va PRIMERO**!
 * - `array_filter($arreglo, $callback)` -> El **arreglo va PRIMERO**!
 * - `array_reduce($arreglo, $callback, $inicial)` -> El **arreglo va PRIMERO**!
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Transformación de DTOs y Respuestas de API (`array_map`): Convertir una
 *   lista de entidades de dominio en arreglos listos para `json_encode`.
 * - Agregaciones Financieras y Agrupaciones Complejas (`array_reduce`):
 *   Calcular totales, subtotales por categoría o construir diccionarios en una
 *   sola pasada inmutable.
 * - Tuberías de Datos (*Data Pipelines*): Encadenar validaciones, limpiezas y
 *   cálculos sin variables temporales mutables.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * $numeros = [1, 2, 3, 4, 5, 6];
 *
 * // 1. Filtrar pares (reindexando con array_values):
 * $pares = array_values(array_filter($numeros, fn(int $n): bool => $n % 2 === 0));
 *
 * // 2. Transformar cada elemento al cuadrado (Nota: callback va primero en array_map!):
 * $cuadrados = array_map(fn(int $n): int => $n ** 2, $pares);
 *
 * // 3. Reducir a la suma total con valor inicial explícito 0:
 * $suma = array_reduce($cuadrados, fn(int $acum, int $n): int => $acum + $n, 0); // 56
 *
 * // 4. Callables de primera clase (PHP 8.1+):
 * $limpios = array_map(trim(...), ['  hola ', ' mundo  ']);
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Procesar un lote de facturas de forma declarativa para filtrar las
 * facturas pagadas, aplicar la conversión de tasa de cambio y consolidar el
 * ingreso total por moneda usando `array_reduce`.
 *
 * $facturas = [
 *     ['id' => 'F1', 'moneda' => 'USD', 'monto' => 100.0, 'pagada' => true],
 *     ['id' => 'F2', 'moneda' => 'USD', 'monto' => 50.0,  'pagada' => false],
 *     ['id' => 'F3', 'moneda' => 'EUR', 'monto' => 200.0, 'pagada' => true],
 *     ['id' => 'F4', 'moneda' => 'USD', 'monto' => 150.0, 'pagada' => true],
 * ];
 *
 * $pagadas = array_filter($facturas, fn(array $f): bool => $f['pagada']);
 *
 * $totalesPorMoneda = array_reduce(
 *     $pagadas,
 *     function (array $acumulado, array $factura): array {
 *         $moneda = $factura['moneda'];
 *         $acumulado[$moneda] = ($acumulado[$moneda] ?? 0.0) + $factura['monto'];
 *         return $acumulado;
 *     },
 *     []
 * );
 *
 * echo "Totales pagados: " . json_encode($totalesPorMoneda) . PHP_EOL;
 * // Salida esperada:
 * // Totales pagados: {"USD":250,"EUR":200}
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA USES `array_filter($arr)` SIN CALLBACK SI EL `0` O `"0"` SON DATOS VÁLIDOS:
 *   Si llamas a `array_filter($arr)` sin pasar segundo argumento, PHP elimina
 *   todos los valores *falsy* (`false`, `null`, `""`, **`0`** y **`"0"`**!). Si
 *   solo quieres eliminar `null`, pasa siempre `fn($v) => $v !== null`.
 * - SIEMPRE PASA EL VALOR INICIAL (`$initial`) EN `array_reduce`:
 *   Si omites el 3er argumento de `array_reduce` y el arreglo está vacío,
 *   devolverá `null` en lugar de `0` o `[]`, rompiendo el tipo de retorno.
 * - CUÁNDO PREFERIR `foreach` SOBRE `array_map` + `array_filter`:
 *   Si encadenas 4 llamadas `array_reduce(array_map(..., array_filter(...)))`
 *   sobre un arreglo gigante, PHP crea 3 arreglos intermedios en memoria. Para
 *   datos masivos usa un solo `array_reduce`, un `foreach` limpio o Generadores
 *   perezosos (`yield`).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Transformación con `array_map` y callable de primera clase (`...`):
 *    Dada una lista de correos con espacios y mayúsculas mezcladas, límpialos y
 *    pásalos a minúsculas usando `array_map`.
 * 2. Filtrado seguro de nulos vs valores falsy: Demuestra en el arreglo
 *    `[10, 0, null, '', '0', 25]` la diferencia entre `array_filter($arr)` y
 *    `array_filter($arr, fn($v) => $v !== null && $v !== '')`.
 * 3. Cálculo de factura total con `array_reduce`: Dada una lista de líneas
 *    `[['precio' => 10.5, 'cant' => 2], ...]`, calcula el gran total en una sola
 *    expresión `array_reduce` con valor inicial `0.0`.
 *
 * [Intermedio]
 * 4. Uso de `array_map` con múltiples arreglos en paralelo: Dados dos arreglos
 *    `$nombres` y `$salarios`, únelos con `array_map(fn($n, $s) => [...], $nombres, $salarios)`
 *    para producir una lista de DTOs asociativos.
 * 5. Filtrado por clave y valor (`ARRAY_FILTER_USE_BOTH`): Usa el tercer
 *    parámetro de `array_filter` para conservar únicamente las entradas de un
 *    arreglo asociativo cuya clave empiece por `'cfg_'` y cuyo valor no sea vacío.
 * 6. Agrupación e indexación con `array_reduce`: Convierte una lista de empleados
 *    en un diccionario agrupado por departamento usando exclusivamente `array_reduce`.
 * 7. Composición funcional (`compose` y `pipe`): Crea una función `pipe(mixed $valor, callable ...$funciones): mixed`
 *    que pase `$valor` secuencialmente por cada función de la lista.
 *
 * [Senior / Producción]
 * 8. Función de Orden Superior *Currying* / Aplicación Parcial: Implementa
 *    `aplicarDescuentoPorcentaje(float $porcentaje): Closure` y úsala directamente
 *    como callback dentro de `array_map` sobre una lista de precios.
 * 9. Implementación de una clase `ColeccionInmutable` (Estilo Laravel Collection):
 *    Crea una clase `readonly` que envuelva un `array` y ofrezca métodos fluidos
 *    inmutables `->filtrar(callable): self`, `->mapear(callable): self`,
 *    `->reducir(callable, mixed): mixed` y `->aLista(): array`.
 * 10. Pipeline Perezoso en Memoria $O(1)$ con Generadores (`lazyMap` y `lazyFilter`):
 *     Implementa las versiones perezosas de `map` y `filter` usando `yield` para
 *     transformar y filtrar 100,000 registros sin crear arreglos intermedios en RAM.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
