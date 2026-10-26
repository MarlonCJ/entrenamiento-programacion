<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 16: RECURSIÓN, PILA DE LLAMADAS (CALL STACK), ÁRBOLES Y MEMOIZACIÓN
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental del Call Stack en el Zend Engine)
 * ----------------------------------------------------------------------------
 * Una función recursiva es aquella que se invoca a sí misma para resolver un
 * problema dividiéndolo en subproblemas más pequeños de la misma naturaleza.
 *
 * Toda función recursiva correcta consta de dos partes obligatorias:
 * 1) **Caso Base (Condición de Parada)**: El escenario más simple que devuelve
 *    una respuesta directa sin hacer más llamadas recursivas (ej. `$n <= 1` o
 *    subcarpeta vacía).
 * 2) **Paso Recursivo (Reducción)**: Llamarse a sí misma con un dato estrictamente
 *    más pequeño o más cercano al caso base.
 *
 * Modelo Mental en el Zend Engine:
 * - Cada llamada a una función apila un nuevo **Stack Frame** (`zend_execute_data`)
 *   en la pila de ejecución de la máquina virtual con sus propias variables locales.
 * - **PHP NO realiza optimización automática de recursión de cola (*Tail Call
 *   Optimization - TCO*)** en su configuración estándar (y con Xdebug activo suele
 *   limitarse a `xdebug.max_nesting_level = 256` o hasta agotar la pila).
 * - Por tanto, en PHP:
 *   - Para secuencias lineales simples de miles de pasos -> **Usa iteración (`while`/`for`)**.
 *   - Para **estructuras jerárquicas y arbóreas** (categorías anidadas, menús,
 *     JSON profundo, directorios, ASTs) -> **La recursión es la herramienta natural**.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Árboles de Categorías y Comentarios Anidados: Recorrer o construir un árbol
 *   de categorías de e-commerce de profundidad arbitraria (`Electrónica -> Computadores -> Laptops`).
 * - Limpieza, Sanitización o Enmascaramiento de JSON Profundo: Recorrer un
 *   arreglo asociativo multidimensional ocultando todas las claves llamadas
 *   `'password'` o `'token'` sin importar en qué nivel de anidamiento estén.
 * - Aplanamiento de Estructuras Jerárquicas (*Flatten*).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Estructura clásica con Caso Base como Guard Clause:
 * function factorial(int $n): int {
 *     if ($n < 0) {
 *         throw new InvalidArgumentException("No existe factorial de negativos");
 *     }
 *     if ($n <= 1) {
 *         return 1; // Caso base
 *     }
 *     return $n * factorial($n - 1); // Paso recursivo
 * }
 *
 * // 2. Recorrido recursivo de arreglo multidimensional:
 * function ocultarSecretosRecursivo(array $datos): array {
 *     foreach ($datos as $clave => $valor) {
 *         if (is_array($valor)) {
 *             $datos[$clave] = ocultarSecretosRecursivo($valor);
 *         } elseif (in_array(strtolower((string) $clave), ['password', 'token'], true)) {
 *             $datos[$clave] = '***OCULTO***';
 *         }
 *     }
 *     return $datos;
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Calcular el costo total de un paquete compuesto (Patrón Composite /
 * Lista de Materiales BOM) donde una caja puede contener productos simples u
 * otras sub-cajas anidadas.
 *
 * function calcularCostoPaquete(array $nodo): float {
 *     $total = (float) ($nodo['precio'] ?? 0.0);
 *     foreach ($nodo['hijos'] ?? [] as $hijo) {
 *         $total += calcularCostoPaquete($hijo);
 *     }
 *     return $total;
 * }
 *
 * $kitGamer = [
 *     'nombre' => 'Kit Escritorio',
 *     'precio' => 5.0, // Costo del empaque principal
 *     'hijos' => [
 *         ['nombre' => 'Monitor', 'precio' => 200.0],
 *         [
 *             'nombre' => 'Combo Periféricos',
 *             'precio' => 2.0,
 *             'hijos' => [
 *                 ['nombre' => 'Teclado', 'precio' => 45.0],
 *                 ['nombre' => 'Mouse', 'precio' => 25.0],
 *             ],
 *         ],
 *     ],
 * ];
 *
 * echo "Costo total del Kit: $" . calcularCostoPaquete($kitGamer) . PHP_EOL;
 * // Salida esperada:
 * // Costo total del Kit: $277
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - EXPLOSIÓN EXPONENCIAL $O(2^n)$ EN RECURSIÓN CON SUBPROBLEMAS REPETIDOS:
 *   Calcular `fibonacci($n)` como `fib($n - 1) + fib($n - 2)` sin caché recalcula
 *   millones de veces los mismos valores (para `$n = 40` hace más de 300 millones
 *   de llamadas!). Al agregar **Memoización** (`array &$memo = []`), pasa de
 *   $O(2^n)$ a **$O(n)$** instantáneo.
 * - PROTECCIÓN DE PROFUNDIDAD MÁXIMA EN DATOS EXTERNOS (`$maxProfundidad`):
 *   Si procesas recursivamente un JSON enviado por un usuario, un atacante puede
 *   enviar 10,000 niveles de arreglos anidados `[[[[...]]]]` para desbordar la
 *   pila. Pasa siempre un parámetro `int $profundidad = 0` y lanza excepción si
 *   supera un umbral razonable (ej. `32`).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Suma de dígitos y potencia recursiva: Implementa `sumarDigitos(int $n): int`
 *    (ej. `1234 -> 10`) y `potenciaEntera(int $base, int $exp): int` con caso base.
 * 2. Máximo Común Divisor (Algoritmo de Euclides): Implementa `mcd(int $a, int $b): int`
 *    usando la relación recursiva `mcd($b, $a % $b)` con caso base `$b === 0`.
 * 3. Verificador recursivo de palíndromo: Comprueba si una palabra limpia es
 *    palíndromo comparando el primer y último carácter y llamando recursivamente
 *    a la subcadena interior.
 *
 * [Intermedio]
 * 4. Fibonacci con Memoización ($O(n)$ vs $O(2^n)$): Implementa `fibonacciMemo(int $n, array &$memo = []): int`
 *    y calcula instantáneamente `fibonacciMemo(50)`.
 * 5. Aplanador de arreglos de profundidad arbitraria (`flattenArray`): Convierte
 *    `[1, [2, [3, 4], 5], 6]` en `[1, 2, 3, 4, 5, 6]` sin usar `array_walk_recursive`.
 * 6. Buscador de ruta en árbol de categorías (*Breadcrumbs*): Dado un árbol de
 *    categorías anidadas, busca una categoría por su `id` y devuelve la ruta
 *    completa de nombres desde la raíz (`"Tecnología > Audio > Audífonos"`).
 * 7. Sanitizador recursivo de strings (`trimRecursivo`): Recorre un arreglo de
 *    cualquier profundidad aplicando `trim()` a todos los strings y protegiendo
 *    con un límite `$maxProfundidad = 10`.
 *
 * [Senior / Producción]
 * 8. Constructor de Árbol desde Tabla Plana de Base de Datos (`construirArbol`):
 *    Dada una lista plana de categorías con `['id' => ..., 'padre_id' => ..., 'nombre' => ...]`,
 *    constrúyelas en una jerarquía anidada con sub-arreglos `'hijos' => [...]`.
 * 9. Comparador profundo de estructuras (`diferenciaProfunda(array $a, array $b): array`):
 *    Implementa una función recursiva que compare dos configuraciones anidadas y
 *    devuelva únicamente las claves que cambiaron de valor entre `$a` y `$b`.
 * 10. Conversión de Recursión a Iteración con Pila Explícita (`SplStack` / `array`):
 *     Reescribe el cálculo del costo del árbol de paquetes del ejemplo práctico
 *     usando una pila explícita en un bucle `while` para garantizar que jamás
 *     pueda desbordar el Call Stack sin importar la profundidad.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
