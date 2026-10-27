/*
 * ============================================================================
 * TEMA 10: BUCLES, ITERADORES TIPADOS, GENERADORES Y NOUNCHECKEDINDEXEDACCESS
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: el protocolo de iteración)
 * ----------------------------------------------------------------------------
 * Iterar en TypeScript va mucho más allá del `for (let i = 0; ...)` clásico. El
 * compilador entiende el **protocolo de iteración de ECMAScript** (`Symbol.iterator`
 * y `Symbol.asyncIterator`) y protege los accesos por índice:
 *
 * 1) **`for...of` vs `for` por índice con `noUncheckedIndexedAccess`**:
 *    - Con `noUncheckedIndexedAccess: true` en `tsconfig.json`, `items[i]` tiene
 *      tipo `T | undefined` (porque TS no puede garantizar que `i` esté dentro
 *      del rango si mutas el arreglo o te equivocas en `<` vs `<=`).
 *    - En cambio, `for (const item of items)` extrae cada elemento directamente
 *      con tipo `T` (sin `undefined`), funciona con `Set`, `Map`, `string` y
 *      generadores, y permite `break`, `continue` y `return` (a diferencia de
 *      `.forEach()`).
 * 2) **`for...in` recorre CLAVES enumerables (como `string`), NO valores**:
 *    incluye propiedades heredadas del prototipo y en arreglos devuelve índices
 *    como strings (`"0"`, `"1"`). Para objetos usa `for (const [k, v] of
 *    Object.entries(obj))` o comprueba `Object.hasOwn(obj, k)`.
 * 3) **El ámbito de `let` y `const` por iteración**: en `for (const x of xs)` o
 *    `for (let i = 0; ...)`, cada vuelta crea un *binding* fresco en memoria,
 *    por lo que los closures creados dentro del bucle capturan el valor correcto.
 * 4) **Generadores (`function*`): evaluación perezosa (*lazy*)**: devuelven un
 *    `Generator<TYield, TReturn, TNext>` que produce valores bajo demanda con
 *    `yield`. Permiten procesar millones de registros en memoria constante $O(1)$.
 * 5) **Iteración asíncrona (`for await...of`)**: consume `AsyncIterable<T>`
 *    (streams de archivos, cursores de base de datos, páginas de una API REST)
 *    esperando cada lote sin bloquear el event loop.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Procesamiento por lotes (*chunking* / *batching*): enviar 50 000 correos o
 *   inserciones SQL de 500 en 500 con un generador `enLotes(items, 500)`.
 * - Consumo de APIs paginadas (`AsyncGenerator`): un bucle `for await (const
 *   usuario of listarUsuariosPaginados())` que pide la siguiente página solo
 *   cuando el consumidor la necesita.
 * - Búsqueda con salida temprana (`break`/`return`): detener el recorrido en
 *   cuanto se encuentra una anomalía, algo imposible de cortar con `.forEach()`.
 * - Algoritmos de ventana deslizante, dos punteros o matrices 2D donde sí se
 *   necesita el índice numérico o `[i, valor]` con `items.entries()`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * const precios: readonly number[] = [100, 250, 80];
 *
 * // 1. for...of (valor directo de tipo number) y .entries() para [índice, valor]
 * for (const precio of precios) { console.log(precio); }
 * for (const [indice, precio] of precios.entries()) { console.log(indice, precio); }
 *
 * // 2. Iterar un Map y un Objeto de forma segura
 * const stock = new Map<string, number>([['A1', 5], ['B2', 0]]);
 * for (const [sku, cantidad] of stock) { console.log(sku, cantidad); }
 *
 * const config = { host: 'localhost', puerto: 5432 };
 * for (const [clave, valor] of Object.entries(config)) { console.log(clave, valor); }
 *
 * // 3. Generador síncrono tipado (evaluación perezosa O(1) en memoria)
 * function* rango(inicio: number, fin: number, paso = 1): Generator<number, void, unknown> {
 *     for (let actual = inicio; actual <= fin; actual += paso) {
 *         yield actual;
 *     }
 * }
 * for (const n of rango(1, 5, 2)) { console.log(n); } // 1, 3, 5
 *
 * // 4. Generador asíncrono (AsyncGenerator<T>) consumido con for await...of
 * async function* paginarSimulado(paginas: readonly string[][]): AsyncGenerator<string> {
 *     for (const pagina of paginas) {
 *         await Promise.resolve(); // simula latencia de red
 *         for (const item of pagina) yield item;
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un motor de sincronización divide una lista de pedidos en lotes
 * perezosos con un generador `enLotes<T>`, detiene el proceso si detecta un
 * pedido corrupto y resume el resultado.
 *
 * interface Pedido {
 *     readonly id: string;
 *     readonly monto: number;
 * }
 *
 * function* enLotes<T>(items: Iterable<T>, tamano: number): Generator<T[], void, unknown> {
 *     if (!Number.isInteger(tamano) || tamano <= 0) {
 *         throw new RangeError('El tamaño de lote debe ser un entero positivo.');
 *     }
 *     let lote: T[] = [];
 *     for (const item of items) {
 *         lote.push(item);
 *         if (lote.length === tamano) {
 *             yield lote;
 *             lote = [];
 *         }
 *     }
 *     if (lote.length > 0) yield lote;
 * }
 *
 * const colaPedidos: readonly Pedido[] = [
 *     { id: 'P-1', monto: 120 },
 *     { id: 'P-2', monto: 80 },
 *     { id: 'P-3', monto: 300 },
 *     { id: 'P-4', monto: -50 }, // monto inválido: debe abortar
 *     { id: 'P-5', monto: 90 },
 * ];
 *
 * let totalProcesado = 0;
 * let numeroLote = 0;
 *
 * bucleLotes: for (const lote of enLotes(colaPedidos, 2)) {
 *     numeroLote += 1;
 *     for (const pedido of lote) {
 *         if (pedido.monto <= 0) {
 *             console.log(`Alerta en lote #${numeroLote}: pedido ${pedido.id} inválido (${pedido.monto}). Abortando.`);
 *             break bucleLotes; // sale de ambos bucles anidados limpiamente
 *         }
 *         totalProcesado += pedido.monto;
 *     }
 *     console.log(`Lote #${numeroLote} completado (${lote.length} pedidos).`);
 * }
 * console.log(`Total facturado antes del corte: $${totalProcesado}`);
 *
 * // Salida esperada:
 * // Lote #1 completado (2 pedidos).
 * // Alerta en lote #2: pedido P-4 inválido (-50). Abortando.
 * // Total facturado antes del corte: $500
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - `await` DENTRO DE `.forEach()` NO ESPERA: `items.forEach(async (x) => await
 *   guardar(x))` lanza todas las promesas en paralelo sin esperar a que terminen
 *   ni capturar sus errores. Para ejecución secuencial usa `for (const x of
 *   items) { await guardar(x); }`; para paralelo controlado usa `Promise.all`.
 * - NUNCA USES `for...in` PARA RECORRER ARREGLOS: es más lento, entrega los
 *   índices como `string` (`"0" + 1 === "01"`) e incluye propiedades añadidas al
 *   prototipo. Usa `for...of` o `items.entries()`.
 * - NO ELIMINES ELEMENTOS DE UN ARREGLO MIENTRAS LO RECORRES HACIA ADELANTE CON
 *   `for...of` O `i++`: al hacer `splice(i, 1)`, los elementos siguientes se
 *   desplazan a la izquierda y te saltas uno. Filtra creando un arreglo nuevo
 *   con `.filter()` o recorre de atrás hacia adelante (`for (let i = arr.length - 1; i >= 0; i--)`).
 * - BUCLES INFINITOS ACCIDENTALES: en `while`, asegúrate siempre de que la
 *   variable de condición progrese en todas las ramas (cuidado con un `continue`
 *   colocado antes del incremento).
 * - CON `noUncheckedIndexedAccess`, PREFIERE `for...of`: si necesitas el índice
 *   y el valor a la vez, `for (const [i, valor] of arr.entries())` te da `valor`
 *   con tipo `T` exacto sin tener que comprobar `if (valor === undefined)`.
 * - LOS GENERADORES SON DE UN SOLO USO: un `Generator` es a la vez `Iterable` e
 *   `Iterator`. Una vez recorrido con `for...of`, queda agotado; un segundo
 *   `for...of` sobre la misma instancia no hará ninguna iteración.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Estadísticas en una pasada: escribe `resumirNumeros(nums: readonly number[])`
 *    usando `for...of` que calcule `{ suma, promedio, min, max, pares }` sin
 *    recorrer el arreglo más de una vez (maneja el arreglo vacío).
 * 2. Dígitos y reverso aritmético: con un bucle `while` (sin convertir a
 *    `string`), cuenta cuántos dígitos tiene un entero positivo y devuelve el
 *    número invertido (`1234 -> 4321`).
 * 3. Recorrido con índice seguro: dado un arreglo de nombres, usa `entries()`
 *    para devolver `["1. Ana", "2. Luis", ...]` sin usar `arr[i]`.
 *
 * [Intermedio]
 * 4. Generador Fibonacci acotado: implementa `function* fibonacciHasta(limite:
 *    bigint): Generator<bigint>` y úsalo con `for...of` para obtener todos los
 *    números de Fibonacci menores o iguales a `10_000n`.
 * 5. `zip` tipado con iterables: escribe `function* zip<A, B>(a: Iterable<A>,
 *    b: Iterable<B>): Generator<[A, B]>` que produzca pares hasta que el más
 *    corto se agote, usando `a[Symbol.iterator]()` y `.next()`.
 * 6. Ventana deslizante (*sliding window*): implementa `promedioMovil(valores:
 *    readonly number[], ventana: number): number[]` en tiempo $O(n)$ manteniendo
 *    la suma de la ventana en un bucle (comprobando `noUncheckedIndexedAccess`).
 * 7. Tubería perezosa (`tomar` y `filtrarIter`): implementa los generadores
 *    genéricos `filtrarIter<T>(it: Iterable<T>, pred: (x: T) => boolean)` y
 *    `tomar<T>(it: Iterable<T>, n: number)` y encadénalos sobre un rango de
 *    1 a 1 000 000 para obtener los primeros 5 múltiplos de 17 sin crear
 *    arreglos intermedios.
 *
 * [Senior / Producción]
 * 8.Iterable personalizado reutilizable: crea una clase `VentanaTiempo` que
 *    implemente `Iterable<Date>` mediante `[Symbol.iterator](): Iterator<Date>`
 *    (generando fechas cada $N$ minutos entre `inicio` y `fin`) y demuestra que
 *    puede recorrerse múltiples veces con `for...of`.
 * 9. Paginador asíncrono con corte temprano (`AsyncGenerator`): implementa
 *    `async function* consumirPaginas<T>(fetchPagina: (cursor: string | null) =>
 *    Promise<{ datos: T[]; siguienteCursor: string | null }>): AsyncGenerator<T>`
 *    y consúmelo con `for await...of` deteniéndote con `break` al encontrar el
 *    tercer elemento que cumpla una condición; verifica que no se pidan páginas
 *    adicionales tras el `break`.
 * 10. Motor de reintentos con bucle `for` y `AbortSignal`: implementa
 *     `ejecutarConReintentos<T>(tarea: () => Promise<T>, opciones: { maxIntentos:
 *     number; baseMs: number; signal?: AbortSignal }): Promise<T>` usando un
 *     bucle `for` secuencial que respete la cancelación antes y durante la
 *     espera entre intentos.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
