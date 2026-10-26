<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 12: ARREGLOS INDEXADOS, LISTAS, MATRICES Y DESTRUCTURING
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Arreglos en el Zend Engine)
 * ----------------------------------------------------------------------------
 * En PHP, el tipo `array` es la estructura de datos más versátil del lenguaje,
 * pero es fundamental comprender cómo está implementada internamente en el
 * **Zend Engine**:
 *
 * Modelo Mental (`Packed Array` vs `Hash Table`):
 * - Históricamente todo `array` en PHP es un mapa hash ordenado. Sin embargo,
 *   desde PHP 7 y especialmente en PHP 8.2+, cuando un arreglo tiene claves
 *   enteras secuenciales `0, 1, 2, ..., n-1` sin huecos, el Zend Engine lo
 *   optimiza internamente como un **`Packed Array`** (un vector contiguo en
 *   memoria mucho más rápido y que consume mucha menos RAM).
 * - En PHP 8.1+ se introdujo la función **`array_is_list(array $arr): bool`**,
 *   que verifica en $O(1)$ (o $O(n)$ en casos mixtos) si un arreglo es una
 *   lista pura indexada desde `0` sin huecos.
 * - **Peligro con `unset($lista[$i])` en listas**: Si eliminas un elemento en
 *   medio de una lista con `unset($lista[1])`, los índices quedan `[0 => 'a', 2 => 'c']`
 *   (¡con un hueco!). Eso rompe `array_is_list()`, hace que `json_encode()` lo
 *   convierta en un objeto `{ "0": "a", "2": "c" }` en vez de un arreglo JSON
 *   `["a", "c"]`, y degrada el *Packed Array* a *Hash Table*. Para reindexar
 *   usa `array_values($lista)` o elimina con `array_splice($lista, $i, 1)`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Manejo de Lotes y Listas de Dominio: Pilas de elementos (`$lista[] = $item`,
 *   `array_pop()`), rebanadas de paginación (`array_slice()`) y particiones en
 *   bloques (`array_chunk()`).
 * - Fusión Inmutable con el Operador Spread (`[...$a, ...$b]`): Combinar listas
 *   o clonar arreglos añadiendo elementos al inicio o al final.
 * - Retorno de Múltiples Valores (Tuplas simuladas con Destructuring):
 *   `[$exito, $mensaje, $codigo] = validarOperacion();`
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Creación y operaciones en el extremo final O(1):
 * $tareas = ['Diseñar', 'Codificar'];
 * $tareas[] = 'Probar';              // Más rápido que array_push($tareas, 'Probar')
 * $ultima = array_pop($tareas);      // Extrae 'Probar' en O(1)
 *
 * // 2. Operador Spread (...) y Destructuring con omisión de elementos:
 * $todas = ['Planear', ...$tareas, 'Desplegar'];
 * [$primera, , $tercera] = $todas;   // Toma índice 0 e índice 2
 *
 * // 3. Verificación de lista continua (PHP 8.1+) y rebanado:
 * $esLista = array_is_list($todas);  // true
 * $pagina  = array_slice($todas, 0, 2); // Primeros 2 elementos
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un despachador de lotes elimina un elemento defectuoso de una
 * lista de envíos, reindexa la lista para garantizar que siga siendo una lista
 * JSON válida (`array_is_list`) y la divide en paquetes de 2 unidades.
 *
 * $envios = ['ENV-101', 'ENV-ERR', 'ENV-102', 'ENV-103', 'ENV-104'];
 * unset($envios[1]); // Deja un hueco en el índice 1!
 *
 * // Reindexamos con array_values() para restaurar índices 0..N-1:
 * $enviosLimpios = array_values($envios);
 * $lotes = array_chunk($enviosLimpios, 2);
 *
 * echo "¿Es lista pura?: " . (array_is_list($enviosLimpios) ? 'SÍ' : 'NO') . PHP_EOL;
 * echo "JSON Lote 1: " . json_encode($lotes[0]) . PHP_EOL;
 * // Salida esperada:
 * // ¿Es lista pura?: SÍ
 * // JSON Lote 1: ["ENV-101","ENV-102"]
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - USA `$lista[] = $valor` EN LUGAR DE `array_push($lista, $valor)`: Para
 *   insertar un solo elemento al final, `$lista[] = $v` es una construcción del
 *   lenguaje directa y evita el costo de invocar una función.
 * - CUIDADO CON `array_unshift()` Y `array_shift()` EN ARREGLOS GRANDES:
 *   Insertar o extraer al **inicio** de un arreglo indexado en PHP es **$O(n)$**
 *   porque obliga al motor a renumerar todas las claves enteras `0..N`! Si
 *   necesitas una cola grande de alto rendimiento, usa `SplQueue` (Tema 24).
 * - EL PELIGRO DE `unset()` ANTES DE `json_encode()`: Si aplicas `unset()` o
 *   `array_filter()` sobre una lista, las claves originales se conservan con
 *   huecos (`[0 => 'a', 2 => 'b']`), y `json_encode()` producirá un objeto JSON
 *   `{"0":"a","2":"b"}` rompiendo los clientes móviles/frontend que esperan un
 *   array `["a","b"]`. Pasa siempre el resultado por `array_values()`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Manipulación de lista de tareas: Crea un arreglo indexado, agrega dos
 *    elementos con `$arr[] = ...`, lee el primero (`$arr[0]`) y el último
 *    (`$arr[array_key_last($arr)]`) y muestra el total con `count()`.
 * 2. Destructuring de tuplas: Crea una función `calcularMinMaxPromedio(array $numeros): array`
 *    que devuelva `[$min, $max, $promedio]` y desestructúralos en 3 variables.
 * 3. Fusión con Spread Operator (`...`): Combina dos listas de sucursales
 *    nacionales e internacionales en una sola lista usando `[...$nac, ...$int]`.
 *
 * [Intermedio]
 * 4. El bug del hueco en `unset()` y `array_is_list()`: Crea una lista de 4
 *    elementos, elimina el índice `1` con `unset()`, comprueba que `array_is_list()`
 *    pasa a `false` y observa la salida de `json_encode()`; luego corrígelo con
 *    `array_values()` o `array_splice()`.
 * 5. Paginación en memoria con `array_slice()`: Crea una función
 *    `paginarLista(array $items, int $pagina, int $porPagina): array` que
 *    devuelva la rebanada correcta de elementos junto con metadatos de paginación.
 * 6. Particionado por lotes con `array_chunk()`: Divide una lista de 10 IDs de
 *    usuarios en lotes de 3 elementos para simular el envío de correos por bloques.
 * 7. Eliminación de duplicados preservando índices de lista: Combina
 *    `array_values(array_unique($lista))` sobre una lista de etiquetas repetidas.
 *
 * [Senior / Producción]
 * 8. Operaciones con Matrices 2D (Transposición y Suma de Diagonal): Dada una
 *    matriz cuadrada de números (arreglo de arreglos), implementa una función
 *    que calcule su matriz transpuesta y la suma de su diagonal principal.
 * 9. Rotación e Inversión de Arreglos In-Place ($O(1)$ memoria extra):
 *    Implementa `invertirInPlace(array &$lista): void` usando dos punteros
 *    (`$izq` y `$der`) e intercambio con destructuring `[$lista[$izq], $lista[$der]] = ...`.
 * 10. Intercalado y Emparejamiento de Listas (*Zip*): Implementa una función
 *     `emparejarListas(array $claves, array $valores): array` que combine dos
 *     listas de igual o diferente longitud en una lista de pares `[clave, valor]`.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
