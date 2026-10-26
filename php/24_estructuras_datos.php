<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 24: ESTRUCTURAS DE DATOS (SPLSTACK, SPLQUEUE, SPLPRIORITYQUEUE Y HEAPS)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Estructuras Lineales y SPL)
 * ----------------------------------------------------------------------------
 * La Biblioteca Estándar de PHP (**SPL - Standard PHP Library**) incluye
 * estructuras de datos implementadas en C diseñadas específicamente para evitar
 * los cuellos de botella de los arreglos tradicionales en operaciones de cola y
 * prioridad:
 *
 * 1) **Pila (Stack - LIFO: *Last-In, First-Out*)**:
 *    El último en entrar es el primero en salir.
 *    - Con `array`: `$pila[] = $v` y `array_pop($pila)` son ambos **$O(1)$**.
 *    - Con SPL: **`SplStack`** (`$pila->push($v)`, `$pila->pop()`, `$pila->top()`).
 * 2) **Cola (Queue - FIFO: *First-In, First-Out*)**:
 *    El primero en llegar es el primero en salir.
 *    - ¡Por qué NO usar `array_shift()` en colas grandes!: En un `array` normal,
 *      `array_shift($cola)` es **$O(n)$** porque obliga al Zend Engine a reindexar
 *      todos los elementos restantes `0..N-1` en cada extracción! Procesar una
 *      cola de 100,000 elementos con `array_shift()` se vuelve cuadrático $O(n^2)$.
 *    - Con **`SplQueue`** (`$cola->enqueue($v)` y `$cola->dequeue()`): Está
 *      implementada como una lista doblemente enlazada en C, por lo que tanto
 *      encolar como desencolar son **$O(1)$** reales!
 * 3) **Colas de Prioridad y Heaps (`SplPriorityQueue`, `SplMinHeap`, `SplMaxHeap`)**:
 *    Mantienen un árbol binario *Heap* en memoria donde insertar y extraer el
 *    elemento de mayor prioridad cuesta solo **$O(\log n)$**.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Pilas (LIFO): Historial de acciones *Undo / Redo*, analizadores sintácticos
 *   (validador de paréntesis/etiquetas HTML/JSON) y recorridos en profundidad (DFS).
 * - Colas (`SplQueue` FIFO): Workers de procesamiento de trabajos en segundo
 *   plano, recorridos en anchura (BFS) y buffers de eventos.
 * - Colas de Prioridad (`SplPriorityQueue`): Despachar primero los trabajos de
 *   clientes VIP o las alertas de severidad crítica antes que las informativas.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Pila LIFO con SplStack:
 * $pila = new SplStack();
 * $pila->push('Paso 1');
 * $pila->push('Paso 2');
 * $ultimo = $pila->pop(); // 'Paso 2' (O(1))
 *
 * // 2. Cola FIFO de alto rendimiento O(1) con SplQueue:
 * $cola = new SplQueue();
 * $cola->enqueue('Trabajo A');
 * $cola->enqueue('Trabajo B');
 * $primero = $cola->dequeue(); // 'Trabajo A' (O(1) real, sin reindexar!)
 *
 * // 3. Cola de Prioridad (Max-Heap por prioridad) con SplPriorityQueue:
 * $urgencias = new SplPriorityQueue();
 * $urgencias->insert('Reporte mensual', 1); // Prioridad baja (1)
 * $urgencias->insert('Caída de pagos', 10); // Prioridad crítica (10)
 * $masUrgente = $urgencias->extract();      // 'Caída de pagos'
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un verificador de sintaxis de expresiones utiliza una `SplStack`
 * para comprobar en una sola pasada $O(n)$ si los paréntesis, corchetes y llaves
 * están perfectamente balanceados.
 *
 * function tieneDelimitadoresBalanceados(string $codigo): bool {
 *     $pila = new SplStack();
 *     $pares = [')' => '(', ']' => '[', '}' => '{'];
 *
 *     for ($i = 0, $n = strlen($codigo); $i < $n; $i++) {
 *         $char = $codigo[$i];
 *         if ($char === '(' || $char === '[' || $char === '{') {
 *             $pila->push($char);
 *         } elseif (isset($pares[$char])) {
 *             if ($pila->isEmpty() || $pila->pop() !== $pares[$char]) {
 *                 return false;
 *             }
 *         }
 *     }
 *     return $pila->isEmpty();
 * }
 *
 * echo "'{[()]}' -> " . (tieneDelimitadoresBalanceados('{[()]}') ? 'VÁLIDO' : 'INVÁLIDO') . PHP_EOL;
 * echo "'{[(])}' -> " . (tieneDelimitadoresBalanceados('{[(])}') ? 'VÁLIDO' : 'INVÁLIDO') . PHP_EOL;
 * // Salida esperada:
 * // '{[()]}' -> VÁLIDO
 * // '{[(])}' -> INVÁLIDO
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA USES `array_shift()` DENTRO DE UN BUCLE `while` SOBRE LISTAS GRANDES:
 *   Reemplázalo siempre por `SplQueue::enqueue()` y `SplQueue::dequeue()` para
 *   pasar de $O(n^2)$ a $O(n)$.
 * - GOTCHA DE `SplPriorityQueue` Y `SplHeap` AL ITERARLOS:
 *   En PHP, recorrer una `SplPriorityQueue` con `foreach` **extrae y consume
 *   los elementos** (la cola queda vacía al terminar el bucle!). Si necesitas
 *   recorrerla sin vaciar la original, haz `$copia = clone $colaPrioridad;`.
 * - SIEMPRE VERIFICA `!$pila->isEmpty()` ANTES DE `pop()`, `top()` O `dequeue()`:
 *   Si la estructura está vacía, `SplStack` y `SplQueue` lanzan `RuntimeException`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Pila LIFO con `SplStack`: Apila 4 páginas visitadas, muestra el tope actual
 *    con `$pila->top()` sin sacarlo, y luego desapílalas todas en orden inverso.
 * 2. Cola FIFO con `SplQueue`: Simula una fila de impresión donde se encolan 4
 *    documentos con `enqueue()` y se procesan en orden con `dequeue()`.
 * 3. Benchmark `SplQueue::dequeue()` vs `array_shift()`: Mide con `hrtime(true)`
 *    el tiempo de encolar y desencolar 20,000 elementos usando `SplQueue` ($O(n)$
 *    total) frente a usar `array_shift` ($O(n^2)$ total).
 *
 * [Intermedio]
 * 4. Motor completo de *Undo / Redo* (Deshacer y Rehacer): Crea una clase
 *    `EditorConHistorial` usando dos `SplStack` (`$pilaUndo` y `$pilaRedo`) que
 *    permita `escribir(string)`, `deshacer()`, `rehacer()` y `obtenerTexto()`.
 * 5. Evaluador de Notación Polaca Inversa (RPN) con `SplStack`: Evalúa
 *    expresiones postfijas como `"10 5 + 3 *"` (= 45) y `"20 4 / 2 -"` (= 3).
 * 6. Despachador de Tareas con `SplPriorityQueue`: Encola 5 tareas de servidor
 *    con distintas prioridades numéricas, extrae tanto el dato como su prioridad
 *    configurando `$cola->setExtractFlags(SplPriorityQueue::EXTR_BOTH)`.
 * 7. Uso de `SplMinHeap` y `SplMaxHeap`: Encuentra el valor mínimo y máximo en
 *    tiempo real de un flujo de cotizaciones bursátiles.
 *
 * [Senior / Producción]
 * 8. Cola de Prioridad Estable (FIFO en caso de empate de prioridad):
 *    Por defecto, `SplPriorityQueue` no garantiza orden de llegada cuando dos
 *    elementos tienen la misma prioridad. Soluciónalo insertando como prioridad
 *    un arreglo `[$prioridad, -$secuenciaLlegada++]` y demuestra que desempata
 *    en estricto orden FIFO!
 * 9. Recorrido en Anchura (BFS - *Breadth-First Search*) con `SplQueue`:
 *    Dado un grafo de conexiones entre ciudades o servidores representado como
 *    lista de adyacencia, encuentra la ruta con menor número de saltos entre el
 *    nodo origen y el nodo destino usando una `SplQueue`.
 * 10. Buffer Circular de Capacidad Fija (*Ring Buffer* / Últimos $N$ Logs):
 *     Implementa una clase `BufferCircular` respaldada por `SplQueue` que
 *     mantenga en memoria únicamente los últimos $N$ eventos recibidos en $O(1)$.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
