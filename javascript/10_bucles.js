'use strict';

/*
 * ============================================================================
 * TEMA 10: BUCLES, PROTOCOLO ITERABLE (FOR...OF) Y GENERADORES (FUNCTION*)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Iteración en JS)
 * ----------------------------------------------------------------------------
 * JavaScript ofrece múltiples formas de iterar, pero confundir **`for...of`**
 * con **`for...in`** es uno de los errores más peligrosos en el lenguaje:
 *
 * 1) **`for (const elemento of iterable)` (ES6+ — El Estándar para Valores)**:
 *    Funciona sobre cualquier objeto que implemente el **Protocolo Iterable**
 *    (`[Symbol.iterator]`): `Array`, `String` (iterando por puntos de código
 *    Unicode completos, no unidades UTF-16 partidas!), `Map`, `Set`, `TypedArray`
 *    y Generadores. Permite usar `break`, `continue` y `return` (a diferencia de
 *    `.forEach()`, que NO permite `break` ni `return` de la función exterior!).
 * 2) **`for (const clave in objeto)` (Solo para Claves Enumerables de Objetos)**:
 *    Recorre las claves string enumerables de un objeto **incluyendo las heredadas
 *    por su cadena de prototipos**.
 *    - ¡PROHIBIDO usar `for...in` para recorrer arreglos!: Devuelve los índices
 *      como `string` (`"0"`, `"1"`), es mucho más lento en V8 y recorre propiedades
 *      extra añadidas al prototipo.
 *    - Para iterar un objeto plano en JS moderno, prefiere:
 *      `for (const [clave, valor] of Object.entries(obj))`!
 * 3) **Funciones Generadoras (`function*` y `yield`)**:
 *    Producen secuencias de datos de manera **perezosa** (*lazy evaluation*) bajo
 *    demanda con costo de memoria $O(1)$, pudiendo incluso representar secuencias
 *    infinitas sin bloquear ni agotar la memoria RAM.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Recorrido de Arreglos con Control de Flujo (`for...of`): Cuando necesitas
 *   detener la búsqueda temprano con `break` o usar `await` secuencial dentro
 *   del bucle.
 * - Recorrido de Arreglos Necesitando Índice y Valor (`arr.entries()`):
 *   `for (const [indice, valor] of items.entries())`.
 * - Iteración de Diccionarios Planos (`Object.entries(obj)`):
 *   Desestructurar `[clave, valor]` de forma limpia y segura.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. for...of sobre valores y con índice usando .entries():
 * const servidores = ['srv-01', 'srv-02'];
 * for (const [idx, nombre] of servidores.entries()) {
 *     console.log(`${idx}: ${nombre}`);
 * }
 *
 * // 2. Iterar un objeto plano de forma segura con Object.entries():
 * const tasas = { USD: 1.0, EUR: 0.92 };
 * for (const [moneda, tasa] of Object.entries(tasas)) {
 *     console.log(`${moneda} -> ${tasa}`);
 * }
 *
 * // 3. Función Generadora perezosa (function* y yield):
 * function* generarRango(inicio, fin, paso = 1) {
 *     for (let actual = inicio; actual <= fin; actual += paso) {
 *         yield actual;
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un procesador de lotes utiliza un generador `function*` para partir
 * una lista de tareas en bloques de tamaño fijo sin duplicar memoria y los
 * recorre con `for...of`.
 *
 * function* partirEnLotes(lista, tamanoLote) {
 *     for (let i = 0; i < lista.length; i += tamanoLote) {
 *         yield lista.slice(i, i + tamanoLote);
 *     }
 * }
 *
 * const pedidosIds = [101, 102, 103, 104, 105];
 * for (const lote of partirEnLotes(pedidosIds, 2)) {
 *     console.log('Procesando lote:', JSON.stringify(lote));
 * }
 * // Salida esperada:
 * // Procesando lote: [101,102]
 * // Procesando lote: [103,104]
 * // Procesando lote: [105]
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - LA TRAMPA DE `.forEach()` CON `return` Y `break`:
 *   En `items.forEach((x) => { if (x === 5) return; })`, ese `return` NO sale de
 *   la función principal ni detiene el bucle (solo salta a la siguiente iteración
 *   como un `continue`), y poner `break` dentro de `.forEach()` es un `SyntaxError`.
 *   Usa siempre `for (const x of items)` cuando necesites cortar el bucle.
 * - NUNCA USES `for...in` EN ARREGLOS: En `for (const i in ['a', 'b'])`, `i` es
 *   el string `"0"`, por lo que `i + 1` da `"01"` en vez de `1`!
 * - ETIQUETAS DE BUCLE (`bucleExterno: for (...)`): Cuando necesites salir de dos
 *   bucles anidados simultáneamente, usa una etiqueta con `break bucleExterno;`
 *   o extrae el bucle a una función y usa `return`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Recorrido con `for...of` y `.entries()`: Dada una lista de temperaturas
 *    horarias, recórrela mostrando el índice de hora y detecta la primera hora
 *    que supere los `35` grados deteniendo el bucle con `break`.
 * 2. Recorrido de objetos con `Object.entries()`: Dado un objeto de inventario
 *    `{ manzanas: 10, peras: 0, uvas: 25 }`, recórrelo desestructurando
 *    `[producto, stock]` e imprime solo los que tengan stock mayor a `0`.
 * 3. Diferencia entre `for...in` y `for...of`: Demuestra con el arreglo `['A', 'B']`
 *    qué imprime `for (const x in arr)` (índices como string) frente a
 *    `for (const x of arr)` (valores reales).
 *
 * [Intermedio]
 * 4. Desestructuración de objetos en `for...of`: Dada una lista de transacciones
 *    `[{ id: 'T1', monto: 50, estado: 'OK' }, ...]`, recórrela con
 *    `for (const { id, monto, estado } of transacciones)` filtrando con `continue`.
 * 5. Iteración sobre puntos de código Unicode en Strings: Compara recorrer un
 *    string con emojis (`"A🚀B"`) usando un `for (let i = 0; i < str.length; i++)`
 *    (que parte el emoji en dos unidades UTF-16 corruptas) frente a usar
 *    `for (const char of "A🚀B")` (que entrega el emoji completo!).
 * 6. Salida de bucles anidados con etiqueta (`break filaLoop;`): Busca un valor
 *    objetivo en una matriz 2D y aborta ambos bucles en cuanto lo encuentres.
 * 7. Generador de IDs y Secuencia de Fibonacci (`function*`): Crea un generador
 *    infinito de números de Fibonacci y consume únicamente los primeros 10
 *    usando `for...of` con un `break`.
 *
 * [Senior / Producción]
 * 8. Implementación del Protocolo Iterable Personalizado (`[Symbol.iterator]`):
 *    Crea un objeto o clase `RangoFechas` que implemente el método `*[Symbol.iterator]()`
 *    para que se pueda usar directamente en `for (const dia of miRango)` y en el
 *    operador spread `[...miRango]`.
 * 9. Pipeline de Generadores Encadenados (Evaluación Perezosa $O(1)$ RAM):
 *    Implementa las funciones generadoras `filtrarPerezoso(iterable, fn)` y
 *    `tomarPrimeros(iterable, n)` para encontrar los primeros 5 cuadrados pares
 *    de un rango de 1 a 10,000,000 evaluando solo un puñado de elementos.
 * 10. Simulador de Reintentos con *Exponential Backoff* y *Jitter*: Usa un bucle
 *     `for` controlado que calcule los tiempos de espera `baseMs * (2 ** intento)`
 *     acotados por un `maxDelayMs` hasta que la operación tenga éxito o agote
 *     los intentos.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
