<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 23: ALGORITMOS DE BÚSQUEDA, ORDENAMIENTO Y COMPARADORES (USORT / <=> )
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Búsqueda y Orden en PHP)
 * ----------------------------------------------------------------------------
 * Entender los algoritmos clásicos de búsqueda y ordenamiento y cómo funcionan
 * las primitivas en C del Zend Engine te permite procesar grandes colecciones en
 * una fracción de milisegundo:
 *
 * 1) **Búsqueda Lineal ($O(n)$) vs Búsqueda Binaria ($O(\log n)$) vs Hash Lookup ($O(1)$)**:
 *    - `in_array()` y `array_search()` recorren el arreglo elemento por elemento
 *      ($O(n)$). En una lista de 100,000 elementos hacen hasta 100,000 pasos.
 *    - La **Búsqueda Binaria** sobre una lista ordenada divide el espacio de
 *      búsqueda a la mitad en cada paso using `intdiv($izq + $der, 2)`, encontrando
 *      cualquier elemento entre 100,000 en máximo **17 pasos** ($O(\log n)$)!
 * 2) **Ordenamiento Estable en PHP 8.0+**:
 *    - Internamente, las funciones de ordenamiento de PHP (`sort`, `rsort`,
 *      `asort`, `ksort`, `usort`, `uasort`) utilizan una variante optimizada en C
 *      en tiempo $O(n \log n)$.
 *    - **Desde PHP 8.0, todos los algoritmos de ordenamiento de PHP son ESTABLES**:
 *      si dos elementos empatan según el comparador (`0`), PHP garantiza preservar
 *      el orden relativo original en que estaban antes de ordenar.
 * 3) **Familia de Funciones de Ordenamiento de PHP**:
 *    - `sort($a)` / `rsort($a)`: Ordena valores y **renumera** las claves `0..N-1`.
 *    - `asort($a)` / `arsort($a)`: Ordena por valores **preservando** las claves asociativas.
 *    - `ksort($a)` / `krsort($a)`: Ordena por **claves**.
 *    - `usort($a, $fn)` / `uasort($a, $fn)`: Ordena con función comparadora
 *      personalizada usando el operador nave espacial `<=>`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Ordenamiento Multicriterio de Catálogos y Reportes (`usort` + `<=>`):
 *   Ordenar primero por prioridad, luego por fecha descendente y desempatar por ID.
 * - Búsqueda de Rangos Tarifarios o Impuestos por Tramos (Búsqueda Binaria):
 *   Encontrar en $O(\log n)$ en qué tramo salarial o rango de IPs cae un valor.
 * - Ordenamiento Natural de Versiones y Códigos (`natsort` / `strnatcmp`):
 *   Ordenar `['img2.png', 'img10.png', 'img1.png']` como `1, 2, 10` y no `1, 10, 2`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Búsqueda Binaria en lista indexada ordenada O(log n):
 * function busquedaBinaria(array $listaOrdenada, int $objetivo): int {
 *     $izq = 0;
 *     $der = count($listaOrdenada) - 1;
 *     while ($izq <= $der) {
 *         $medio = $izq + intdiv($der - $izq, 2);
 *         $valor = $listaOrdenada[$medio];
 *         if ($valor === $objetivo) {
 *             return $medio;
 *         }
 *         if ($valor < $objetivo) {
 *             $izq = $medio + 1;
 *         } else {
 *             $der = $medio - 1;
 *         }
 *     }
 *     return -1;
 * }
 *
 * // 2. Ordenamiento multicriterio con usort, Arrow Function y <=> :
 * // usort($productos, fn(array $a, array $b): int =>
 * //     ($a['categoria'] <=> $b['categoria'])
 * //     ?: ($b['precio'] <=> $a['precio']) // Descendente: $b <=> $a
 * // );
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Ordenar una cola de tickets de soporte primero por severidad
 * (menor número = más urgente) y, en caso de empate, por antigüedad, aprovechando
 * `<=>` y el cortocircuito del operador `?:`.
 *
 * $tickets = [
 *     ['id' => 'T-101', 'severidad' => 2, 'minutosEspera' => 15],
 *     ['id' => 'T-102', 'severidad' => 1, 'minutosEspera' => 5],
 *     ['id' => 'T-103', 'severidad' => 2, 'minutosEspera' => 45],
 * ];
 *
 * usort(
 *     $tickets,
 *     fn(array $a, array $b): int =>
 *         ($a['severidad'] <=> $b['severidad'])
 *         ?: ($b['minutosEspera'] <=> $a['minutosEspera'])
 * );
 *
 * echo "Orden de atención: " . implode(' -> ', array_column($tickets, 'id')) . PHP_EOL;
 * // Salida esperada:
 * // Orden de atención: T-102 -> T-103 -> T-101
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - ¡RECUERDA QUE `sort()`, `usort()`, `asort()` Y `ksort()` MUTAN EL ARREGLO
 *   IN-PLACE Y DEVUELVEN `true`!:
 *   Un error muy común es escribir `$ordenados = sort($numeros);` — eso guarda
 *   `bool(true)` en `$ordenados`! Primero copia el arreglo si no quieres alterar
 *   el original (`$copia = $numeros; sort($copia);`).
 * - CUIDADO CON `sort()` SOBRE ARREGLOS ASOCIATIVOS: `sort()` **destruye todas
 *   las claves string** y las reemplaza por `0, 1, 2...`! Si necesitas conservar
 *   las claves asociativas, usa siempre `asort()` o `uasort()`.
 * - EN `usort()`, SIEMPRE RETORNA UN `int` (`< 0`, `0`, `> 0`): En PHP 8.0+,
 *   devolver un `bool` en el callback de `usort()` emite una advertencia de
 *   deprecación y ordena mal. Usa siempre el operador nave espacial `<=>`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Búsqueda lineal vs `array_search(..., true)`: Implementa una función que
 *    busque un elemento en una lista devolviendo su índice o `-1`, y compárala
 *    con `array_search($val, $lista, true)`.
 * 2. Verificador de arreglo ordenado ($O(n)$): Implementa `estaOrdenadoAscendente(array $nums): bool`
 *    que verifique en una sola pasada si cada elemento es `<=` al siguiente.
 * 3. Ordenamiento por Inserción (*Insertion Sort*): Impleméntalo manualmente
 *    sobre un arreglo de enteros para comprender su invariante de subarreglo
 *    izquierdo ordenado.
 *
 * [Intermedio]
 * 4. Búsqueda Binaria Iterativa ($O(\log n)$): Implementa `busquedaBinaria` y
 *    cuenta cuántas comparaciones realiza para encontrar un número en un arreglo
 *    de `10,000` elementos frente a cuántas hace la búsqueda lineal.
 * 5. Ordenamiento natural de versiones y archivos (`natsort` / `version_compare`):
 *    Ordena la lista `['v1.10.0', 'v1.2.0', 'v1.9.5', 'v2.0.0']` usando `usort`
 *    con `version_compare()`.
 * 6. Ordenamiento de diccionarios preservando claves (`uasort`): Dado un mapa
 *    asociativo de `sku => ['nombre' => ..., 'stock' => ...]`, ordénalo de menor
 *    a mayor stock sin perder las claves `sku`.
 * 7. Implementación de *Merge Sort* ($O(n \log n)$): Implementa en PHP el
 *    algoritmo recursivo de ordenamiento por mezcla con su función `fusionarListasOrdenadas(array $izq, array $der): array`.
 *
 * [Senior / Producción]
 * 8. Búsqueda Binaria de Frontera (*Lower Bound* / Tramo Fiscal): Dado un
 *    arreglo ordenado de límites de tramos `[0, 1000, 5000, 20000]`, usa búsqueda
 *    binaria para encontrar en $O(\log n)$ a qué índice de tramo pertenece un
 *    monto dado (ej. `3400` cae en el tramo de `1000`).
 * 9. Demostración de Ordenamiento Estable en PHP 8+: Dada una lista de pedidos
 *    que ya viene ordenada cronológicamente por hora de llegada, ordénala por
 *    `estado` con `usort()` y comprueba que dentro de cada estado se conserva el
 *    orden cronológico original.
 * 10. Ordenamiento por prioridad de negocio personalizada: Ordena una lista de
 *     tareas cuyos estados son `'CRITICO'`, `'ALTO'`, `'MEDIO'`, `'BAJO'` (que
 *     NO están en orden alfabético) mapeándolos a un peso numérico en $O(1)$
 *     dentro del comparador de `usort()`.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
