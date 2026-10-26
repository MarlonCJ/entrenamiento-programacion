<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 15: ÁMBITO DE VARIABLES (SCOPE), CLOSURES (USE vs FN) Y VARIABLES STATIC
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Alcance Léxico en PHP)
 * ----------------------------------------------------------------------------
 * A diferencia de JavaScript o Python, en PHP las funciones tienen un **ámbito
 * local completamente aislado por defecto**:
 * - Una variable declarada fuera de una función (en el ámbito global o del
 *   archivo) **NO es visible** dentro de una función normal `function miFuncion()`.
 * - A la inversa, los bloques condicionales (`if`, `else`) y los bucles (`for`,
 *   `foreach`, `while`) en PHP **NO crean un ámbito separado**: una variable
 *   creada dentro de un `if` o un `foreach` sigue existiendo en el resto de la
 *   función!
 *
 * Los 3 Mecanismos de Captura de Estado en Funciones PHP:
 * 1) **Funciones Anónimas Clásicas (`function ($x) use ($factor)`)**:
 *    Deben declarar explícitamente con `use ($var)` qué variables del ámbito
 *    padre desean capturar. Por defecto, `use ($var)` captura **por valor** (una
 *    copia en el momento en que se define el closure, no cuando se ejecuta!).
 *    Si necesitas mutar una variable externa (ej. un contador), usas `use (&$contador)`.
 * 2) **Arrow Functions (`fn($x) => $x * $factor`, PHP 7.4+)**:
 *    Capturan automáticamente variables del ámbito padre **por valor** sin
 *    escribir `use`, y contienen una única expresión cuyo valor se retorna.
 * 3) **Variables Locales `static` (`static $cache = [];`)**:
 *    Se inicializan solo en la primera llamada a la función y conservan su valor
 *    entre llamadas sucesivas dentro del mismo ciclo de petición.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Callbacks concisos en `array_map` / `array_filter` / `usort`: Usar Arrow
 *   Functions `fn(array $p): bool => $p['precio'] >= $precioMinimo` capturando
 *   `$precioMinimo` del ámbito exterior automáticamente.
 * - Fábricas de Funciones y *Currying* (`Closure`): Crear validadores o
 *   multiplicadores preconfigurados que recuerdan su configuración en su closure.
 * - Memoización Ligera dentro de una Función (`static $memo = []`): Cachear
 *   cálculos repetidos sin contaminar el ámbito global.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * $impuesto = 0.19;
 *
 * // 1. Closure clásico con captura explícita por valor (use):
 * $calcularConUse = function (float $neto) use ($impuesto): float {
 *     return round($neto * (1 + $impuesto), 2);
 * };
 *
 * // 2. Arrow Function con captura automática por valor (PHP 7.4+):
 * $calcularConFn = fn(float $neto): float => round($neto * (1 + $impuesto), 2);
 *
 * // 3. Variable static para persistir estado entre invocaciones:
 * function siguienteIdSecuencial(): int {
 *     static $ultimoId = 0;
 *     return ++$ultimoId;
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Una fábrica de reglas de negocio genera un filtro personalizado
 * para un rango de precios y un contador acumulador que lleva la cuenta de
 * cuántos elementos fueron evaluados.
 *
 * function crearFiltroRango(float $min, float $max, int &$totalEvaluados): Closure {
 *     return function (float $precio) use ($min, $max, &$totalEvaluados): bool {
 *         $totalEvaluados++;
 *         return $precio >= $min && $precio <= $max;
 *     };
 * }
 *
 * $evaluados = 0;
 * $esPrecioMedio = crearFiltroRango(20.0, 100.0, $evaluados);
 * $precios = [10.0, 45.0, 80.0, 150.0];
 * $filtrados = array_values(array_filter($precios, $esPrecioMedio));
 *
 * echo "Filtrados: " . json_encode($filtrados) . " | Evaluados: {$evaluados}" . PHP_EOL;
 * // Salida esperada:
 * // Filtrados: [45,80] | Evaluados: 4
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - PROHIBIDO USAR LA PALABRA CLAVE `global $var;` O `$GLOBALS`: Acopla las
 *   funciones a un estado global invisible, hace imposible probarlas en
 *   aislamiento y provoca bugs imposibles de rastrear. Pasa siempre los datos
 *   como parámetros o captura valores inmutables en un `Closure`.
 * - RECUERDA QUE `use ($x)` Y `fn() => $x` CAPTURAN EN EL MOMENTO DE DEFINICIÓN:
 *   Si defines `$c = fn() => $tasa;` cuando `$tasa = 0.10`, y luego cambias
 *   `$tasa = 0.20;` antes de llamar a `$c()`, `$c()` seguirá usando `0.10`!
 * - LAS ARROW FUNCTIONS (`fn`) NO PERMITEN MUTAR EL ÁMBITO EXTERIOR:
 *   Aunque modifiques una variable capturada dentro de `fn()`, es una copia por
 *   valor y el cambio no afectará a la variable externa.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Aislamiento del ámbito local: Demuestra que modificar una variable `$tasa`
 *    dentro de una función no altera la variable `$tasa` que está fuera de ella.
 * 2. Filtrado con Arrow Function (`fn`): Dado un arreglo de pedidos y una
 *    variable externa `$estadoBuscado = 'pagado'`, filtra los pedidos usando
 *    `array_filter` y una *Arrow Function*.
 * 3. Contador con variable `static`: Crea una función `registrarLlamada(string $endpoint): int`
 *    que use un arreglo `static $conteo = []` para devolver cuántas veces se ha
 *    invocado ese endpoint específico.
 *
 * [Intermedio]
 * 4. Momento de captura en `use ($var)` por valor vs `use (&$var)` por referencia:
 *    Crea dos closures sobre la misma variable `$mensaje = "Inicial"`, cambia
 *    `$mensaje = "Modificado"` y ejecuta ambos closures para demostrar la diferencia.
 * 5. Fábrica de multiplicadores / calculadores de impuestos (*Higher-Order Function*):
 *    Implementa `crearCalculadorIva(float $porcentaje): Closure` que devuelva un
 *    closure listo para aplicar ese porcentaje a cualquier monto.
 * 6. Fuga de variables de bucle (`foreach` no tiene scope propio en PHP):
 *    Demuestra cómo la variable `$item` de un `foreach` sigue existiendo después
 *    del bucle en la misma función, y por qué reutilizar el mismo nombre de
 *    variable temporal sin reinicializarla puede causar errores.
 * 7. Encapsulación de estado privado mediante Closures (Módulo Funcional):
 *    Crea una función `crearBilletera(int $saldoInicial): array` que retorne un
 *    arreglo de tres closures `['depositar' => ..., 'retirar' => ..., 'saldo' => ...]`
 *    compartiendo `$saldo` por referencia sin exponer la variable al exterior.
 *
 * [Senior / Producción]
 * 8. Decorador `once(callable $fn): Closure`: Implementa una función de orden
 *    superior que envuelva cualquier callback usando variables en su closure para
 *    garantizar que la función original se ejecute **máximo una sola vez** y en
 *    llamadas posteriores devuelva el resultado cacheado.
 * 9. Memoizador Genérico con Closure (`memoize(callable $fn): Closure`):
 *    Implementa un envoltorio que guarde en un mapa privado del closure los
 *    resultados de invocar `$fn` según la clave de sus argumentos.
 * 10. Vinculación dinámica de contexto con `Closure::bind` / `$closure->call($objeto)`:
 *     Demuestra cómo un `Closure` puede ejecutarse temporalmente en el ámbito de
 *     un objeto específico usando `$closure->call($instancia)` (técnica usada en
 *     frameworks de testing e hidratación de entidades).
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
