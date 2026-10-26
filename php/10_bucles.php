<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 10: BUCLES, ITERACIÓN, CONTROL DE FLUJO Y GENERADORES (YIELD)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Iteración y Memoria)
 * ----------------------------------------------------------------------------
 * Los bucles permiten procesar secuencias de datos de forma repetitiva. En PHP
 * cuentas con cuatro estructuras de bucle (`foreach`, `for`, `while`, `do-while`)
 * y una herramienta de nivel Senior para eficiencia de memoria: los **Generadores**
 * (`yield`).
 *
 * Modelo Mental en el Zend Engine:
 * 1) **`foreach ($items as $clave => $valor)`**:
 *    Es el bucle nativo y más rápido para recorrer arreglos y objetos `iterable`
 *    en PHP. Opera sobre el puntero interno de la tabla hash sin copiar el
 *    arreglo completo gracias a *Copy-On-Write*.
 * 2) **`for ($i = 0, $n = count($arr); $i < $n; $i++)`**:
 *    Útil cuando necesitas aritmética de índices (ej. comparar `$arr[$i]` con
 *    `$arr[$i - 1]`, recorrer de atrás hacia adelante o avanzar de 2 en 2).
 * 3) **`break` y `continue` (con niveles opcionales `break 2`)**:
 *    `continue` salta a la siguiente iteración (ideal como *Guard Clause* dentro
 *    del bucle para no anidar `if`); `break` termina el bucle inmediatamente.
 * 4) **Generadores (`yield`, PHP 5.5+)**:
 *    Si una función crea un arreglo de 1,000,000 de elementos con `return $arr`,
 *    consumirá cientos de megabytes de RAM. Si en su lugar usa `yield $elemento`,
 *    devuelve un objeto `Generator` perezoso que produce un valor a la vez
 *    consumiendo **$O(1)$ de memoria RAM**!
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Recorrido de Colecciones y Payloads JSON (`foreach` + destructuring):
 *   Extraer propiedades de filas asociativas directamente en la firma del bucle.
 * - Reintentos con *Exponential Backoff* (`while` / `for`): Reintentar una
 *   operación inestable hasta un máximo de intentos.
 * - Procesamiento de Grandes Volúmenes en Streaming (`yield`): Generar millones
 *   de filas para un reporte sin agotar el `memory_limit` de PHP.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. foreach con clave => valor y Guard Clause con continue:
 * foreach ($pedidos as $id => $pedido) {
 *     if ($pedido['estado'] === 'cancelado') {
 *         continue; // Salta cancelados sin anidar el resto del bucle
 *     }
 *     // Procesar pedido válido...
 * }
 *
 * // 2. foreach con Array Destructuring directo (PHP 7.1+):
 * $lineas = [
 *     ['sku' => 'A1', 'precio' => 10.0],
 *     ['sku' => 'B2', 'precio' => 25.0],
 * ];
 * foreach ($lineas as ['sku' => $sku, 'precio' => $precio]) {
 *     echo "{$sku}: {$precio}" . PHP_EOL;
 * }
 *
 * // 3. Generador perezoso en memoria constante O(1) con yield:
 * function generarRangoPerezoso(int $inicio, int $fin): Generator {
 *     for ($i = $inicio; $i <= $fin; $i++) {
 *         yield $i;
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un procesador de lotes recorre transacciones usando destructuring
 * en `foreach`, ignora transacciones inválidas con `continue` y detiene el lote
 * con `break` si se alcanza el límite diario de riesgo.
 *
 * $transacciones = [
 *     ['id' => 'TX-1', 'monto' => 300.0, 'valida' => true],
 *     ['id' => 'TX-2', 'monto' => -50.0, 'valida' => false],
 *     ['id' => 'TX-3', 'monto' => 450.0, 'valida' => true],
 *     ['id' => 'TX-4', 'monto' => 500.0, 'valida' => true],
 * ];
 *
 * $limiteDiario = 1000.0;
 * $acumulado = 0.0;
 *
 * foreach ($transacciones as ['id' => $id, 'monto' => $monto, 'valida' => $valida]) {
 *     if (!$valida) {
 *         continue;
 *     }
 *     if ($acumulado + $monto > $limiteDiario) {
 *         echo "[ALERTA] Límite superado al intentar procesar {$id}. Lote detenido." . PHP_EOL;
 *         break;
 *     }
 *     $acumulado += $monto;
 *     echo "Procesada {$id}: +\${$monto} (Acumulado: \${$acumulado})" . PHP_EOL;
 * }
 * // Salida esperada:
 * // Procesada TX-1: +$300 (Acumulado: $300)
 * // Procesada TX-3: +$450 (Acumulado: $750)
 * // [ALERTA] Límite superado al intentar procesar TX-4. Lote detenido.
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - ¡EL BUG MÁS FAMOSO DE PHP (`foreach ($arr as &$item)`)!:
 *   Si recorres un arreglo por referencia (`foreach ($items as &$item)`) y NO
 *   haces `unset($item);` inmediatamente después de cerrar el `foreach`, la
 *   variable `$item` queda apuntando al **último elemento del arreglo**. Si más
 *   abajo en la misma función haces otro `foreach ($items as $item)` normal (por
 *   valor), ¡sobrescribirás y corromperás el último elemento del arreglo en cada
 *   iteración! Mejor evita `&` y modifica con `$items[$clave] = ...`, o haz
 *   siempre `unset($item);` al terminar.
 * - NUNCA LLAMES A `count($arr)` EN LA CONDICIÓN DE CADA ITERACIÓN DE UN `for`:
 *   Aunque `count()` es $O(1)$ en PHP, invocar la función miles de veces añade
 *   overhead innecesario. Guárdalo en la inicialización:
 *   `for ($i = 0, $n = count($arr); $i < $n; $i++)`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Recorrido con `foreach` y resumen: Dado un arreglo de precios de productos,
 *    calcula mediante un bucle `foreach` el total, el precio más alto y cuántos
 *    superan los `$50`.
 * 2. Tabla de amortización o multiplicación con `for`: Genera las primeras 10
 *    cuotas de un préstamo mostrando número de cuota, abono a capital y saldo
 *    restante.
 * 3. Bucle `while` de agotamiento de inventario: Simula la atención de pedidos
 *    de una lista mientras `$stockDisponible > 0`.
 *
 * [Intermedio]
 * 4. Destructuring en `foreach`: Dada una lista de empleados
 *    `[['id' => 1, 'nombre' => 'Ana', 'salario' => 3200], ...]`, recórrela
 *    desestructurando las claves directamente en el encabezado del `foreach`.
 * 5. Uso de `continue` para limpiar código: Procesa una lista de correos donde
 *    algunos son vacíos, otros no tienen `'@'` y otros son válidos; usa `continue`
 *    para descartar los inválidos al inicio del cuerpo del bucle.
 * 6. Demostración y prevención del bug de referencia colgante en `foreach`:
 *    Muestra qué pasa si usas `foreach ($nums as &$n)` sin `unset($n)` seguido
 *    de un `foreach ($nums as $n)`, y corrígelo.
 * 7. Búsqueda en matriz bidimensional con `break 2`: Recorre una cuadrícula
 *    (arreglo de arreglos) buscando un código específico y sal de ambos bucles
 *    instantáneamente con `break 2` al encontrarlo.
 *
 * [Senior / Producción]
 * 8. Generador de secuencias en memoria constante (`yield` vs `range()`):
 *    Compara `memory_get_usage()` al iterar 100,000 elementos usando una función
 *    generadora con `yield` frente a construir un arreglo completo en memoria.
 * 9. Procesamiento por lotes (*Batch Chunking*): Implementa una función
 *    generadora `iterarEnLotes(array $datos, int $tamanoLote): Generator` que
 *    entregue sub-arreglos de tamaño `$tamanoLote` listos para inserción masiva.
 * 10. Ventana móvil sobre serie temporal con `for`: Dado un arreglo de ventas
 *     diarias de 30 días, calcula con un bucle `for` el promedio móvil de cada
 *     ventana de 3 días consecutivos y detecta en qué día ocurrió el mayor salto.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
