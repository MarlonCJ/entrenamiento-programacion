<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 07: COMPARACIÓN ESTRICTA (===), NAVE ESPACIAL (<=>) Y ÁLGEBRA BOOLEANA
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en el Zend Engine)
 * ----------------------------------------------------------------------------
 * En PHP existen dos familias de comparación de igualdad:
 * 1) **Igualdad Débil (`==` y `!=` / `<>`)**: Realiza *Type Juggling* (coerción
 *    automática de tipos) antes de comparar. Por ejemplo, `0 == "0"`, `0 == false`,
 *    `"" == null` y `"10" == "10.0"` dan `true`! (Nota: en PHP 8.0 se corrigió
 *    el infame `0 == "hola"` para que dé `false`, pero `"42" == 42` y `0 == false`
 *    siguen dando `true`).
 * 2) **Identidad Estricta (`===` y `!==`)**: Compara primero que **ambos operandos
 *    tengan exactamente el mismo tipo** en su `zval` y luego que su valor sea
 *    idéntico (para objetos, `===` verifica que apunten a la misma instancia en
 *    el Heap). Es más rápida en CPU porque no ejecuta conversiones de tipo y es
 *    obligatoria en código de nivel Senior.
 * 3) **Operador Nave Espacial (`<=>` - Spaceship Operator, PHP 7+)**:
 *    `$a <=> $b` devuelve `-1` si `$a < $b`, `0` si `$a == $b`, y `1` si `$a > $b`.
 *    Es la herramienta estándar para escribir funciones de ordenamiento en `usort()`.
 * 4) **Cortocircuito Lógico (`&&`, `||`) vs Palabras Clave (`and`, `or`, `xor`)**:
 *    - `&&` y `||` evalúan de izquierda a derecha y se detienen en cuanto el
 *      resultado ya está decidido (*short-circuit evaluation*).
 *    - ¡Peligro con `and` y `or`!: Tienen **menor precedencia que el operador de
 *      asignación `=`**. Escribir `$res = true and false;` asigna `true` a `$res`!
 *      Usa SIEMPRE `&&` y `||`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Búsqueda Segura en Strings y Arreglos (`strpos` / `array_search`):
 *   Si una subcadena está en la posición `0`, `strpos` devuelve `0`. Con `!= false`
 *   falla porque `0 == false`; con `!== false` funciona siempre (o mejor aún,
 *   en PHP 8.0+ usa `str_contains()`, `str_starts_with()`, `str_ends_with()`).
 * - Ordenamiento Multicriterio con `<=>`: Ordenar arreglos de objetos o filas
 *   en una sola línea dentro de `usort()`.
 * - Leyes de De Morgan para Simplificar Condiciones de Negocio:
 *   Transformar `!($esActivo && $tieneSaldo)` en `!$esActivo || !$tieneSaldo`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Comparación estricta siempre:
 * $esCeroExacto = (0 === "0");       // false
 * $noEsFalso    = (0 !== false);     // true
 *
 * // 2. Operador Nave Espacial (<=>) y desempate en cascada:
 * // Ordena por precio ascendente y, si empatan (0), por nombre ascendente:
 * // ($a['precio'] <=> $b['precio']) ?: ($a['nombre'] <=> $b['nombre'])
 *
 * // 3. Cortocircuito seguro (la derecha solo se evalúa si la izquierda se cumple):
 * $usuario = ['activo' => true, 'rol' => 'ADMIN'];
 * $accesoTotal = isset($usuario['rol']) && $usuario[' activo' ] ?? false;
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un motor de elegibilidad de crédito evalúa reglas booleanas con
 * variables explicativas y ordena las ofertas bancarias usando `<=>`.
 *
 * function puedeAccederACredito(int $edad, float $ingresos, bool $reportadoEnCentrales, float $cuotaSolicitada): bool {
 *     $edadValida = ($edad >= 21 && $edad <= 70);
 *     $capacidadEndeudamientoOk = ($cuotaSolicitada <= $ingresos * 0.30);
 *     return $edadValida && !$reportadoEnCentrales && $capacidadEndeudamientoOk;
 * }
 *
 * $aprobado = puedeAccederACredito(30, 4000.0, false, 1000.0);
 * echo "Crédito aprobado: " . ($aprobado ? 'SÍ' : 'NO') . PHP_EOL;
 * // Salida esperada:
 * // Crédito aprobado: SÍ
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - REGLA DE ORO: USA SIEMPRE `===` Y `!==`, Y PASA `true` COMO 3ER ARGUMENTO A `in_array()`:
 *   Por defecto, `in_array($aguja, $pajar)` usa comparación débil `==`! Eso hace
 *   que `in_array(0, ['admin', 'editor'])` en PHP 7 diera `true`, o que
 *   `in_array("42", [42])` dé `true`. Escribe siempre:
 *   `in_array($valor, $listaPermitida, true)`.
 * - NUNCA USES `and` U `or` EN LUGAR DE `&&` Y `||`:
 *   `$valido = $a && $b;` asigna el resultado de `$a && $b` a `$valido`.
 *   `$valido = $a and $b;` equivale a `($valido = $a) and $b;` por precedencia!
 * - EVITA `if ($condicion === true) return true; else return false;`:
 *   Devuelve directamente la expresión booleana: `return $condicion;`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Auditoría de `==` vs `===`: Imprime el resultado de comparar con `==` y
 *    con `===` los pares: `(0, false)`, `("", null)`, `("100", 100)` y `(0.0, 0)`.
 * 2. Validación de rango inclusivo y exclusivo: Implementa `estaEnRangoTemperatura(float $temp): bool`
 *    que verifique si la temperatura está entre `-10.0` y `45.0` inclusive.
 * 3. Uso del operador nave espacial (`<=>`): Compara dos versiones o dos montos
 *    y traduce el resultado `-1`, `0`, `1` a `'Menor'`, `'Igual'` o `'Mayor'`.
 *
 * [Intermedio]
 * 4. Protección por cortocircuito (`&&`): Demuestra cómo en
 *    `$divisor !== 0 && ($numerador / $divisor) > 5` el cortocircuito de `&&`
 *    evita que se lance `DivisionByZeroError` cuando `$divisor` es `0`.
 * 5. El peligro de `in_array` sin `strict = true`: Demuestra con un arreglo
 *    `['001', '002', true]` qué devuelve `in_array(1, $arr)` vs `in_array(1, $arr, true)`.
 * 6. Demostración del bug de precedencia de `and` vs `&&`: Muestra en código
 *    por qué `$resultado = true and false;` deja `$resultado` en `true`, mientras
 *    que `$resultado = true && false;` lo deja en `false`.
 * 7. Aplicación de las Leyes de De Morgan: Refactoriza una condición negada
 *    compleja `!(!$cuentaVerificada || $cuentaSuspendida || $saldo < 0)` a su
 *    forma positiva directa y verifica con una tabla de verdad que son idénticas.
 *
 * [Senior / Producción]
 * 8. Ordenamiento multicriterio con `<=>`: Dado un arreglo de productos con
 *    `['nombre', 'activo', 'precio']`, ordénalos con `usort()` poniendo primero
 *    los activos (`$b['activo'] <=> $a['activo']`), luego por menor precio
 *    (`$a['precio'] <=> $b['precio']`) y desempatando por nombre alfabético.
 * 9. Motor de Reglas de Control de Acceso (RBAC + ABAC): Implementa una función
 *    `puedeEditarDocumento(array $usuario, array $documento): bool` que permita
 *    la edición si el usuario está activo Y (es `'ADMIN'`, o es el autor del
 *    documento y el documento sigue en estado `'BORRADOR'`).
 * 10. Comparación de objetos por valor vs por identidad: Crea dos instancias de
 *     una clase `Coordenada(10, 20)` y demuestra la diferencia entre `$c1 == $c2`
 *     (compara propiedades) y `$c1 === $c2` (compara si son el mismo `zval`/instancia
 *     en el Heap).
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
