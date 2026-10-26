<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 28: COMPLEJIDAD ALGORÍTMICA (BIG-O), MEMOIZACIÓN Y OPTIMIZACIÓN EN PHP
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Rendimiento en el Zend Engine)
 * ----------------------------------------------------------------------------
 * En producción, la diferencia entre una API que responde en 8 milisegundos y
 * una que agota el tiempo de espera (*504 Gateway Timeout*) rara vez es "el
 * lenguaje": casi siempre es un algoritmo **$O(n^2)$** oculto o un uso ineficiente
 * de la memoria RAM.
 *
 * Los 4 Cuellos de Botella Más Frecuentes en PHP y su Solución $O(1)$ / $O(n)$:
 * 1) **`in_array()` o `array_search()` dentro de un bucle ($O(n^2)$)**:
 *    Si tienes 20,000 pedidos y por cada uno haces `in_array($id, $clientesVip, true)`
 *    sobre una lista de 10,000 VIPs, PHP realiza **200,000,000 de comparaciones**!
 *    - Solución Senior ($O(n + m)$): Convierte `$clientesVip` una sola vez antes
 *      del bucle en un diccionario con `array_flip($clientesVip)` y consulta con
 *      `isset($vipsSet[$id])` en tiempo constante **$O(1)$**.
 * 2) **`array_merge()` dentro de un bucle `foreach` ($O(n^2)$ en copias de memoria)**:
 *    Hacer `$resultado = array_merge($resultado, $lote);` dentro de un bucle
 *    copia todo el arreglo acumulado en cada iteración!
 *    - Solución Senior ($O(n)$): Acumula los lotes en una lista `$lotes[] = $lote;`
 *      y haz un único `array_merge(...$lotes)` al salir del bucle!
 * 3) **Cruces de Datos en Memoria (*In-Memory Hash Join*)**:
 *    Indexar por clave con `array_column($items, null, 'id')` antes de cruzar.
 * 4) **Perfilado Real con `hrtime(true)` y `memory_get_peak_usage()`**:
 *    En PHP 7.3+, para medir tiempos de ejecución precisos nunca uses `microtime(true)`
 *    (que puede alterarse si el reloj del sistema se sincroniza por NTP); usa
 *    siempre el reloj monotónico de alta resolución **`hrtime(true)`** (nanosegundos).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Conciliación de Pagos y Cruce de Reportes: Cruzar 50,000 registros del banco
 *   contra 50,000 órdenes de la tienda en menos de 30 milisegundos usando mapas hash.
 * - Ventana Deslizante (*Sliding Window*) y Dos Punteros (*Two Pointers*):
 *   Analizar series de tiempo, logs de tráfico o rachas de ventas en una sola pasada $O(n)$.
 * - Cachés con Desalojo LRU (*Least Recently Used*): Aprovechar que los arreglos
 *   de PHP mantienen el orden de inserción para construir una caché LRU en $O(1)$!
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Medición precisa con reloj monotónico (hrtime en nanosegundos -> milisegundos):
 * $inicioNs = hrtime(true);
 * // ... código a medir ...
 * $duracionMs = (hrtime(true) - $inicioNs) / 1_000_000;
 *
 * // 2. Antipatrón array_merge en bucle O(n^2) vs Unpacking O(n):
 * // MAL: foreach ($grupos as $g) { $todos = array_merge($todos, $g); }
 * // BIEN (1 sola llamada al final):
 * // $todos = array_merge(...$grupos);
 *
 * // 3. Caché LRU O(1) aprovechando el orden interno de los arrays de PHP:
 * // Al acceder o insertar una clave: unset($cache[$k]); $cache[$k] = $v; (la mueve al final)
 * // Si count($cache) > $max: unset($cache[array_key_first($cache)]); (borra la más antigua en O(1)!)
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Unir en memoria una lista de pedidos con su respectivo cliente en
 * tiempo lineal $O(n + m)$ pre-indexando los clientes por su ID, en lugar de
 * recorrer la lista de clientes por cada pedido ($O(n \times m)$).
 *
 * $clientes = [
 *     ['id' => 10, 'nombre' => 'Ana Pérez'],
 *     ['id' => 20, 'nombre' => 'Luis Gómez'],
 * ];
 * $pedidos = [
 *     ['pedido_id' => 501, 'cliente_id' => 20, 'total' => 95.0],
 *     ['pedido_id' => 502, 'cliente_id' => 10, 'total' => 140.0],
 * ];
 *
 * // Paso 1: Indexación O(n) -> Crea mapa [10 => [...], 20 => [...]]
 * $clientesPorId = array_column($clientes, null, 'id');
 *
 * // Paso 2: Cruce O(m) con búsqueda O(1) por cada pedido
 * foreach ($pedidos as $p) {
 *     $nombre = $clientesPorId[$p['cliente_id']]['nombre'] ?? 'Desconocido';
 *     echo "Pedido #{$p['pedido_id']} -> Cliente: {$nombre} (\${$p['total']})" . PHP_EOL;
 * }
 * // Salida esperada:
 * // Pedido #501 -> Cliente: Luis Gómez ($95)
 * // Pedido #502 -> Cliente: Ana Pérez ($140)
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA EJECUTES CONSULTAS SQL NI LLAMADAS HTTP DENTRO DE UN BUCLE (Problema N+1):
 *   En lugar de hacer `SELECT * FROM clientes WHERE id = ?` dentro de un
 *   `foreach ($pedidos as $p)`, recolecta todos los IDs con
 *   `$ids = array_unique(array_column($pedidos, 'cliente_id'));`, haz una sola
 *   consulta `WHERE id IN (...)` y únelos en memoria con el patrón del ejemplo.
 * - EVITA `count()` O `strlen()` REPETIDOS SI MODIFICAS GRANDES STRINGS EN BUCLES.
 * - RECUERDA QUE LOS ARREGLOS DE PHP SON TABLAS HASH ORDENADAS:
 *   Esto te regala en forma nativa el equivalente al `LinkedHashMap` de Java:
 *   `array_key_first($arr)` te da el elemento más antiguo en $O(1)$ y
 *   `array_key_last($arr)` te da el más reciente en $O(1)$!
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Benchmark `in_array` ($O(n^2)$) vs `isset` con `array_flip` ($O(n)$):
 *    Genera dos listas de 5,000 números y mide con `hrtime(true)` cuánto tarda
 *    encontrar las coincidencias con un bucle que usa `in_array(..., true)`
 *    frente a usar un mapa de claves con `isset()`.
 * 2. Benchmark `array_merge` dentro de un bucle vs `array_merge(...$lotes)`:
 *    Compara el tiempo de unir 500 sub-arreglos de 20 elementos de ambas formas.
 * 3. Detección de duplicados en una sola pasada $O(n)$: Implementa
 *    `encontrarDuplicados(array $items): array` usando un mapa de vistos sin
 *    bucles anidados.
 *
 * [Intermedio]
 * 4. *Two Sum* (Conciliación de dos facturas en $O(n)$): Dado un arreglo de
 *    montos de facturas y un pago recibido `$objetivo`, encuentra en una sola
 *    pasada qué dos facturas suman exactamente `$objetivo` guardando los
 *    complementos en un arreglo asociativo.
 * 5. Técnica de Ventana Deslizante (*Sliding Window* $O(n)$): Dado un arreglo de
 *    ingresos por hora y una ventana `$k = 4`, calcula la suma máxima de 4 horas
 *    consecutivas actualizando la suma en $O(1)$ en cada paso.
 * 6. Sumas Prefijas (*Prefix Sums*): Construye un arreglo de sumas acumuladas en
 *    $O(n)$ que permita responder cualquier consulta `sumaEntreDias(int $inicio, int $fin)`
 *    en tiempo constante $O(1)$.
 * 7. Anagramas y Agrupación por Firma Canónica ($O(n \cdot k \log k)$): Agrupa
 *    una lista de palabras que son anagramas entre sí ordenando las letras de
 *    cada palabra para usarla como clave de un mapa asociativo.
 *
 * [Senior / Producción]
 * 8. Implementación de **Caché LRU en $O(1)$** (*Least Recently Used*):
 *    Crea la clase `CacheLru` con capacidad máxima `$capacidad` aprovechando
 *    `unset($this->items[$clave])`, `$this->items[$clave] = $valor` y
 *    `array_key_first($this->items)` para lograr `get()` y `put()` en tiempo
 *    constante $O(1)$.
 * 9. Solución al Problema de Consultas N+1 (*Batch Loader / DataLoader*):
 *    Simula un repositorio de base de datos que cuenta cuántas consultas ejecuta,
 *    y refactoriza un cargador de pedidos + categorías + clientes para que pase
 *    de hacer $2N + 1$ consultas a hacer exactamente **3 consultas** sin importar
 *    cuántos pedidos haya.
 * 10. Auditoría de Memoria con `memory_get_usage()`: Compara la huella de memoria
 *     en bytes de almacenar 10,000 registros como arreglos asociativos con claves
 *     largas repetidas frente a usar instancias de una `readonly class` con
 *     propiedades tipadas (las clases tipadas en PHP 8 consumen mucha menos RAM
 *     porque los nombres de las propiedades se guardan una sola vez en la definición
 *     de la clase y no en cada fila!).
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
