'use strict';

const { performance } = require('node:perf_hooks');

/*
 * ============================================================================
 * TEMA 28: COMPLEJIDAD ALGORÍTMICA (BIG-O), OPTIMIZACIÓN EN V8 Y CACHÉ LRU
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Rendimiento en V8)
 * ----------------------------------------------------------------------------
 * En Node.js, como existe un **único hilo para el Event Loop**, si ejecutas un
 * algoritmo síncrono $O(n^2)$ que tarda 500 milisegundos en CPU, **bloqueas a
 * TODOS los demás usuarios conectados al servidor durante esos 500 ms**!
 *
 * Los 4 Pilares de Optimización Algorítmica y del Motor V8:
 * 1) **De $O(n^2)$ a $O(n)$ con `Map` y `Set`**:
 *    - Llamar a `array.includes(x)` o `array.find(...)` dentro de un bucle `for`
 *      o `.filter()` es **$O(n \times m)$**.
 *    - Pre-indexar en un `Set` (`.has()` en $O(1)$) o en un `Map` (`.get()` en
 *      $O(1)$) reduce el tiempo de segundos a menos de 1 milisegundo!
 * 2) **Evitar Clonar Acumuladores en Bucles (`.reduce((acc, x) => ({ ...acc, ... }))`)**:
 *    Usar spread `{ ...acc }` o `[...acc, x]` dentro de un bucle copia todas las
 *    propiedades anteriores en cada paso ($1 + 2 + \dots + n = \frac{n(n+1)}{2} \to O(n^2)$).
 *    Muta siempre la estructura local recién creada antes de retornarla.
 * 3) **Clases Ocultas (*Hidden Classes / Shapes*) y Monomorfismo en V8**:
 *    El compilador JIT de V8 (*TurboFan*) optimiza el acceso a propiedades si
 *    todos los objetos de un mismo tipo se inicializan con las **mismas
 *    propiedades y en el mismo orden** en su constructor (y sin usar `delete`).
 * 4) **Caché LRU en $O(1)$ aprovechando el orden de inserción de `Map`**:
 *    En JavaScript, `Map` mantiene el orden de inserción y `map.keys().next().value`
 *    devuelve la clave más antigua en tiempo constante **$O(1)$**!
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Cruce de Datos en Memoria (*In-Memory Hash Join*): Unir pedidos con clientes
 *   o productos usando un `Map` indexado por ID.
 * - Ventana Deslizante (*Sliding Window*) y Dos Punteros (*Two Pointers*).
 * - Cachés en Memoria Acotadas (LRU Cache con TTL): Evitar que un `Map` de caché
 *   crezca infinitamente hasta agotar el Heap de V8 (`--max-old-space-size`).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Medición de alta precisión con performance.now():
 * const t0 = performance.now();
 * // ... operación ...
 * const duracionMs = performance.now() - t0;
 *
 * // 2. Caché LRU (Least Recently Used) en O(1) con Map nativo de JS:
 * class CacheLru {
 *     #capacidad;
 *     #mapa = new Map();
 *
 *     constructor(capacidad) {
 *         this.#capacidad = capacidad;
 *     }
 *     obtener(clave) {
 *         if (!this.#mapa.has(clave)) return undefined;
 *         const valor = this.#mapa.get(clave);
 *         // Refrescar orden: borrar y volver a insertar lo mueve al final (más reciente)
 *         this.#mapa.delete(clave);
 *         this.#mapa.set(clave, valor);
 *         return valor;
 *     }
 *     guardar(clave, valor) {
 *         if (this.#mapa.has(clave)) this.#mapa.delete(clave);
 *         else if (this.#mapa.size >= this.#capacidad) {
 *             const claveMasAntigua = this.#mapa.keys().next().value; // O(1)!
 *             this.#mapa.delete(claveMasAntigua);
 *         }
 *         this.#mapa.set(clave, valor);
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Unir en memoria un catálogo de usuarios con una lista de eventos de
 * auditoría en tiempo lineal $O(n + m)$ usando un `Map` en lugar de `.find()`
 * anidado ($O(n \times m)$).
 *
 * function enriquecerEventosConUsuarios(eventos, usuarios) {
 *     // 1. Indexar usuarios en O(n):
 *     const usuariosPorId = new Map(usuarios.map((u) => [u.id, u]));
 *     // 2. Enriquecer eventos en O(m) con búsqueda O(1):
 *     return eventos.map((ev) => ({
 *         ...ev,
 *         nombreUsuario: usuariosPorId.get(ev.usuarioId)?.nombre ?? 'Desconocido',
 *     }));
 * }
 *
 * const resultado = enriquecerEventosConUsuarios(
 *     [{ id: 'E1', usuarioId: 20 }],
 *     [{ id: 10, nombre: 'Ana' }, { id: 20, nombre: 'Carlos' }]
 * );
 * console.log(JSON.stringify(resultado));
 * // Salida esperada:
 * // [{"id":"E1","usuarioId":20,"nombreUsuario":"Carlos"}]
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - EL ASESINO SILENCIOSO: `.reduce((acc, x) => [...acc, x], [])`:
 *   Para 20,000 elementos, hacer `[...acc, x]` copia el arreglo 20,000 veces
 *   alojando y descartando ~200 millones de posiciones de memoria! Usa siempre
 *   `acc.push(x); return acc;` o `.map()`.
 * - NUNCA DEJES CACHÉS GLOBALES EN `Map` SIN LÍMITE DE TAMAÑO: En un servidor
 *   Node.js de larga ejecución, cada entrada que agregas a un `Map` global y
 *   nunca borras es una fuga de memoria permanente. Usa siempre `CacheLru` o
 *   `WeakMap`.
 * - INICIALIZA TODAS LAS PROPIEDADES EN EL CONSTRUCTOR (Aunque sea con `null`):
 *   Permite a V8 reutilizar la misma *Hidden Class* para todas las instancias.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Benchmark `Array.includes` ($O(n^2)$) vs `Set.has` ($O(n)$): Crea dos
 *    arreglos de 10,000 números y mide con `performance.now()` el tiempo de
 *    encontrar su intersección usando `.filter((x) => arr2.includes(x))` frente
 *    a usar un `Set`.
 * 2. Benchmark del antipatrón `reduce` con spread `{ ...acc }` vs mutación local:
 *    Compara el tiempo de indexar 5,000 objetos por `id` de ambas maneras.
 * 3. Conciliación de pares en $O(n)$ (*Two Sum*): Encuentra dos transacciones en
 *    un arreglo cuyos montos sumen exactamente un objetivo usando un `Map` en
 *    una sola pasada.
 *
 * [Intermedio]
 * 4. Ventana Deslizante (*Sliding Window* $O(n)$): Calcula el máximo de peticiones
 *    acumuladas en cualquier ventana de `k` minutos consecutivos sin recalcular
 *    la suma desde cero en cada posición.
 * 5. Sumas Prefijas (*Prefix Sums*): Preprocesa un arreglo de costos diarios
 *    para responder consultas `costoRango(diaInicio, diaFin)` en $O(1)$.
 * 6. Agrupación de anagramas o firmas equivalentes en $O(n)$: Agrupa palabras o
 *    configuraciones equivalentes usando una clave canónica en un `Map`.
 * 7. Dos Punteros (*Two Pointers*): Dados dos arreglos ya ordenados de eventos
 *    con timestamps, fusiónalos en un único arreglo ordenado en una sola pasada
 *    lineal $O(n + m)$ sin llamar a `.sort()`.
 *
 * [Senior / Producción]
 * 8. Caché LRU con Expiración por Tiempo (*LRU + TTL Cache*): Extiende la clase
 *    `CacheLru` para que cada entrada tenga un `expiraEnMs` (`Date.now() + ttlMs`),
 *    descartando entradas vencidas al consultarlas y desalojando la menos usada
 *    al llenarse.
 * 9. Procesamiento No Bloqueante del Event Loop (*Chunked Yielding* con `setImmediate`):
 *    Si necesitas procesar síncronamente 100,000 registros en CPU, implementa una
 *    función `procesarSinBloquearEventLoop(items, fn, tamanoLote = 1000)` que
 *    ceda el turno al Event Loop con `await new Promise((r) => setImmediate(r))`
 *    cada 1,000 elementos para que el servidor siga respondiendo peticiones HTTP!
 * 10. Agrupador de Consultas (*DataLoader / Batching Pattern*): Implementa una
 *     utilidad que recolecte todas las llamadas individuales `cargarPorId(id)`
 *     hechas en el mismo tick (`queueMicrotask`) y ejecute una única llamada
 *     masiva `cargarMuchosPorIds(idsUnicos)`.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
