/*
 * ============================================================================
 * TEMA 24: ESTRUCTURAS DE DATOS GENÉRICAS (PILAS, COLAS, HEAPS Y BUFFERS)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: Costes Reales en V8)
 * ----------------------------------------------------------------------------
 * Una estructura de datos define CÓMO se organizan los elementos y, por tanto,
 * cuánto cuesta cada operación. Con GENÉRICOS (`Pila<T>`, `MonticuloMin<T>`)
 * TypeScript permite escribirlas una sola vez y usarlas con cualquier tipo sin
 * perder seguridad: `Pila<Pedido>` rechaza en compilación un `Pila<string>`.
 * Recuerda: los genéricos se BORRAN en runtime; dentro no puedes hacer
 * `typeof T` ni `new T()`.
 *
 * Costes reales del `Array` de V8 (arreglo dinámico contiguo):
 * - `push` / `pop` (final): O(1) amortizado -> PILA (LIFO) perfecta.
 * - `shift` / `unshift` (inicio): O(n), mueven todos los elementos. Una COLA
 *   (FIFO) con `shift()` sobre 100 000 trabajos se vuelve cuadrática.
 *   Solución: índice de cabeza, lista enlazada o buffer circular -> O(1).
 * - Acceso por índice O(1); búsqueda por valor O(n). Para pertenencia usa
 *   `Set` y para clave -> valor `Map` (tablas hash, O(1) promedio, conservan el
 *   orden de inserción).
 * - **Heap binario** (montículo): árbol completo guardado en un arreglo
 *   (hijos de `i` en `2i+1` y `2i+2`, padre en `(i-1) >> 1`). Inserta y
 *   extrae el mínimo en O(log n): base de las COLAS DE PRIORIDAD. JavaScript
 *   NO trae una incorporada (a diferencia de `heapq` de Python o
 *   `SplPriorityQueue` de PHP).
 * - **Buffer circular**: arreglo de tamaño fijo con índices que "dan la
 *   vuelta" (`%`); memoria acotada y operaciones O(1).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Pila: deshacer/rehacer, navegación "atrás", evaluación de expresiones,
 *   DFS iterativo, validación de etiquetas o paréntesis.
 * - Cola: trabajos en segundo plano, BFS, rate limiting, turnos de atención.
 * - Cola de prioridad (heap): triaje de alertas, planificadores de tareas,
 *   Dijkstra en rutas logísticas, top-K de productos más vendidos.
 * - Buffer circular: últimas N lecturas de sensores IoT, logs recientes,
 *   medias móviles de métricas, sin crecer en memoria.
 * - `Map` como caché LRU (aprovechando el orden de inserción).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (TS 5.x, genéricos)
 * ----------------------------------------------------------------------------
 * class Pila<T> {
 *     readonly #items: T[] = [];
 *     apilar(valor: T): void { this.#items.push(valor); }
 *     desapilar(): T | undefined { return this.#items.pop(); }
 *     cima(): T | undefined { return this.#items.at(-1); }
 *     get tamano(): number { return this.#items.length; }
 * }
 *
 * class Cola<T> {                                 // FIFO O(1) amortizado
 *     #items: T[] = [];
 *     #cabeza = 0;
 *     encolar(valor: T): void { this.#items.push(valor); }
 *     desencolar(): T | undefined {
 *         if (this.#cabeza >= this.#items.length) return undefined;
 *         const valor = this.#items[this.#cabeza++];
 *         if (this.#cabeza > 1024 && this.#cabeza * 2 > this.#items.length) {
 *             this.#items = this.#items.slice(this.#cabeza);   // compacta
 *             this.#cabeza = 0;
 *         }
 *         return valor;
 *     }
 * }
 *
 * // Contratos genéricos con restricciones
 * interface Coleccion<T> extends Iterable<T> { readonly tamano: number }
 * function primero<T>(c: Iterable<T>): T | undefined { for (const x of c) return x; }
 * const indice = new Map<string, Set<number>>();  // índice invertido
 * const vistos: ReadonlySet<string> = new Set(['a', 'b']);
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Una central IoT de un edificio recibe alertas de sensores. Un
 * `MonticuloMin<T>` genérico las atiende por severidad (1 = crítica) y, a igual
 * severidad, por orden de llegada; un `BufferCircular<T>` guarda solo las
 * últimas 3 lecturas de temperatura para una media móvil.
 *
 * class MonticuloMin<T> {
 *     readonly #datos: T[] = [];
 *     constructor(private readonly comparar: (a: T, b: T) => number) {}
 *
 *     get tamano(): number {
 *         return this.#datos.length;
 *     }
 *
 *     insertar(valor: T): void {                  // O(log n): sube (sift-up)
 *         const d = this.#datos;
 *         d.push(valor);
 *         let i = d.length - 1;
 *         while (i > 0) {
 *             const padre = (i - 1) >> 1;
 *             if (this.comparar(d[i]!, d[padre]!) >= 0) break;
 *             [d[i], d[padre]] = [d[padre]!, d[i]!];
 *             i = padre;
 *         }
 *     }
 *
 *     extraer(): T | undefined {                  // O(log n): baja (sift-down)
 *         const d = this.#datos;
 *         if (d.length === 0) return undefined;
 *         const raiz = d[0]!;
 *         const ultimo = d.pop()!;
 *         if (d.length > 0) {
 *             d[0] = ultimo;
 *             let i = 0;
 *             for (;;) {
 *                 const izq = 2 * i + 1;
 *                 const der = izq + 1;
 *                 let menor = i;
 *                 if (izq < d.length && this.comparar(d[izq]!, d[menor]!) < 0) menor = izq;
 *                 if (der < d.length && this.comparar(d[der]!, d[menor]!) < 0) menor = der;
 *                 if (menor === i) break;
 *                 [d[i], d[menor]] = [d[menor]!, d[i]!];
 *                 i = menor;
 *             }
 *         }
 *         return raiz;
 *     }
 * }
 *
 * class BufferCircular<T> {                       // ventana fija: O(1) y memoria acotada
 *     readonly #celdas: (T | undefined)[];
 *     #inicio = 0;
 *     #cantidad = 0;
 *     constructor(readonly capacidad: number) {
 *         this.#celdas = new Array<T | undefined>(capacidad);
 *     }
 *     agregar(valor: T): void {
 *         this.#celdas[(this.#inicio + this.#cantidad) % this.capacidad] = valor;
 *         if (this.#cantidad < this.capacidad) this.#cantidad++;
 *         else this.#inicio = (this.#inicio + 1) % this.capacidad;   // pisa el más antiguo
 *     }
 *     aArreglo(): T[] {
 *         const salida: T[] = [];
 *         for (let k = 0; k < this.#cantidad; k++) {
 *             salida.push(this.#celdas[(this.#inicio + k) % this.capacidad] as T);
 *         }
 *         return salida;
 *     }
 * }
 *
 * type Severidad = 1 | 2 | 3;                     // 1 = crítica
 * interface Alerta {
 *     sensor: string;
 *     severidad: Severidad;
 *     secuencia: number;                          // desempate => orden FIFO
 * }
 *
 * const alertas = new MonticuloMin<Alerta>(
 *     (a, b) => a.severidad - b.severidad || a.secuencia - b.secuencia,
 * );
 * const llegadas: ReadonlyArray<readonly [string, Severidad]> = [
 *     ['temp-03', 2], ['humo-01', 1], ['puerta-07', 3], ['gas-02', 1], ['temp-04', 2],
 * ];
 * llegadas.forEach(([sensor, severidad], secuencia) => alertas.insertar({ sensor, severidad, secuencia }));
 * console.log(`En cola: ${alertas.tamano}`);
 *
 * const orden: string[] = [];
 * for (let a = alertas.extraer(); a !== undefined; a = alertas.extraer()) {
 *     orden.push(`${a.sensor}(S${a.severidad})`);
 * }
 * console.log(orden.join(' -> '));
 *
 * const ultimas = new BufferCircular<number>(3);
 * [21.5, 22.0, 22.4, 23.1, 24.8].forEach((t) => ultimas.agregar(t));
 * const ventana = ultimas.aArreglo();
 * const promedio = ventana.reduce((s, t) => s + t, 0) / ventana.length;
 * console.log(ventana, promedio.toFixed(2));
 *
 * // Salida esperada:
 * // En cola: 5
 * // humo-01(S1) -> gas-02(S1) -> temp-03(S2) -> temp-04(S2) -> puerta-07(S3)
 * // [ 22.4, 23.1, 24.8 ] 23.43
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - NO USES `shift()` PARA COLAS GRANDES: es O(n) por llamada. Usa índice de
 *   cabeza, buffer circular o lista enlazada.
 * - UN HEAP NO ES ESTABLE: si dos elementos empatan, el orden de salida no
 *   está garantizado. Añade un número de secuencia como desempate (ejemplo).
 * - `pop()` Y `at()` DEVUELVEN `T | undefined`: no lo ocultes con `!`; decide
 *   un contrato claro para la estructura vacía (devolver `undefined` o lanzar).
 * - ENCAPSULA EL ARREGLO INTERNO (`#items`): si lo expones, cualquiera puede
 *   hacer `splice` y romper la propiedad del heap o el orden FIFO.
 * - CLAVES DE `Map`/`Set` SE COMPARAN POR IDENTIDAD (SameValueZero): dos
 *   objetos `{ id: 1 }` distintos son claves diferentes. Usa ids primitivos.
 * - OBJETOS LITERALES COMO DICCIONARIOS: claves heredadas (`'constructor' in {}`
 *   es `true`) y claves siempre string. Prefiere `Map` o `Object.create(null)`.
 * - IMPLEMENTA `[Symbol.iterator]()` para que tus estructuras funcionen con
 *   `for...of`, spread y `Array.from`, y tipa con `Iterable<T>`.
 * - MIDE ANTES DE OPTIMIZAR: para pocos cientos de elementos, ordenar un array
 *   puede ser más simple y suficientemente rápido que un heap.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Implementa `Pila<T>` con `apilar`, `desapilar`, `cima`, `estaVacia` y
 *    getter `tamano`; documenta qué devuelve con la pila vacía.
 * 2. Usa la pila para invertir una cadena con emojis respetando caracteres
 *    completos (`[...texto]`, no `split('')`).
 * 3. Implementa `Cola<T>` con índice de cabeza y simula los turnos de una EPS
 *    (`encolar`, `desencolar`, `frente`).
 *
 * [Intermedio]
 * 4. Validador de delimitadores: `estaBalanceado(codigo: string): boolean` para
 *    `()`, `[]` y `{}` usando `Pila<string>` y un `Map` de cierres.
 * 5. Historial de navegación con dos pilas: `visitar(url)`, `atras()` y
 *    `adelante()`, devolviendo `string | undefined`.
 * 6. Haz que `Pila<T>` y `Cola<T>` implementen `Iterable<T>` con
 *    `*[Symbol.iterator]()` y úsalas con spread.
 * 7. `BufferCircular<T>` con `estaLleno`, `masAntiguo()` y `promedio()` solo
 *    disponible cuando `T` es `number` (pista: función genérica aparte).
 *
 * [Senior / Producción]
 * 8. Caché LRU genérica `CacheLRU<K, V>` sobre `Map` con capacidad fija:
 *    `obtener` mueve la clave al final y `guardar` expulsa la más antigua.
 * 9. Top-K: `topK<T>(items: Iterable<T>, k: number, comparar)` usando un
 *    `MonticuloMin` de tamaño k para obtener los K productos más vendidos en
 *    O(n log k).
 * 10. Planificador de despachos: con un heap, implementa Dijkstra sobre un
 *     grafo `Map<string, Array<{ destino: string; km: number }>>` de bodegas y
 *     devuelve la ruta más corta y su distancia total.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
