/*
 * ============================================================================
 * TEMA 28: COMPLEJIDAD ALGORÍTMICA Y OPTIMIZACIÓN EN TYPESCRIPT / V8
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: Big O + cómo optimiza V8)
 * ----------------------------------------------------------------------------
 * La notación Big O describe cómo crece el costo (tiempo o memoria) cuando
 * crece la entrada `n`. TypeScript no cambia la complejidad de nada: los tipos
 * se borran y lo que corre es JavaScript sobre V8. Pero los tipos SÍ ayudan a
 * escribir código que V8 optimiza mejor y a elegir la estructura correcta.
 *
 * 1) **Órdenes típicos**: `O(1)` acceso por índice, `Map.get`, `Set.has`;
 *    `O(log n)` búsqueda binaria o heap; `O(n)` un recorrido; `O(n log n)`
 *    `toSorted`/`sort` (TimSort en V8); `O(n^2)` bucles anidados sobre la misma
 *    lista; `O(2^n)` recursión sin memoizar.
 * 2) **Costos ocultos de la API**: `includes`, `indexOf`, `find`, `filter`
 *    son `O(n)`; `shift`/`unshift`/`splice` al inicio desplazan todo (`O(n)`);
 *    el spread `[...arr]` y `{ ...obj }` copian (`O(n)`). Un `includes` dentro
 *    de un `for` es un `O(n^2)` disfrazado.
 * 3) **V8 por dentro**: el JIT (Ignition -> Sparkplug -> Maglev -> TurboFan)
 *    optimiza funciones "calientes" asumiendo que los objetos tienen siempre la
 *    misma *forma* (hidden class / shape). Interfaces estables, propiedades
 *    inicializadas en el mismo orden y arreglos homogéneos (`number[]` y no
 *    `(number | string)[]`) mantienen los *inline caches* monomórficos. Borrar
 *    propiedades con `delete` o añadirlas tarde degrada a modo diccionario.
 * 4) **Memoria también es complejidad**: crear arreglos intermedios en cada
 *    `map().filter()` sobre millones de filas genera presión en el *garbage
 *    collector* (pausas). Generadores o un solo bucle reducen asignaciones.
 * 5) **Mide antes de optimizar**: `performance.now()`, `node --cpu-prof`,
 *    `node --inspect` + Chrome DevTools, `process.memoryUsage()`, y
 *    benchmarks repetibles (Vitest `bench`, `mitata`).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Conciliación de nóminas o pagos: cruzar dos listas grandes con un índice
 *   `Map` en lugar de bucles anidados.
 * - Autocompletado y búsquedas en catálogos ordenados (búsqueda binaria, tries).
 * - Endpoints con SLA de latencia (p95 < 200 ms) donde un `O(n^2)` oculto
 *   provoca *timeouts* al crecer los clientes.
 * - Caché de cálculos costosos (tarifas, rutas) con memoización y LRU.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // Índice O(1) tipado a partir de una lista (as const => tupla [clave, valor]):
 * const indice = new Map(clientes.map((c) => [c.id, c] as const)); // Map<number, Cliente>
 *
 * // Búsqueda binaria genérica O(log n) sobre un arreglo ORDENADO:
 * function buscarBinaria<T>(lista: readonly T[], objetivo: T, cmp: (a: T, b: T) => number): number {
 *     let bajo = 0, alto = lista.length - 1;
 *     while (bajo <= alto) {
 *         const medio = (bajo + alto) >>> 1;
 *         const orden = cmp(lista[medio]!, objetivo);
 *         if (orden === 0) return medio;
 *         if (orden < 0) bajo = medio + 1; else alto = medio - 1;
 *     }
 *     return -1;
 * }
 *
 * // Memoización genérica (clave serializable):
 * function memoizar<A extends readonly unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
 *     const cache = new Map<string, R>();
 *     return (...args) => {
 *         const clave = JSON.stringify(args);
 *         if (!cache.has(clave)) cache.set(clave, fn(...args));
 *         return cache.get(clave)!;
 *     };
 * }
 *
 * // Medición rápida:
 * const t0 = performance.now(); trabajo(); console.log(`${(performance.now() - t0).toFixed(1)} ms`);
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: RR. HH. detecta correos duplicados en una nómina de 2 000
 * empleados. Contamos OPERACIONES (determinista) en vez de milisegundos para
 * comparar la versión cuadrática con la lineal basada en `Set`.
 *
 * interface Empleado {
 *     readonly id: number;
 *     readonly email: string;
 * }
 *
 * interface Medicion {
 *     readonly duplicados: readonly string[];
 *     readonly operaciones: number;
 * }
 *
 * // O(n^2): compara cada par (i, j) con j > i
 * function duplicadosCuadratico(lista: readonly Empleado[]): Medicion {
 *     const duplicados: string[] = [];
 *     let operaciones = 0;
 *     for (let i = 0; i < lista.length; i++) {
 *         for (let j = i + 1; j < lista.length; j++) {
 *             operaciones++;
 *             if (lista[i]!.email === lista[j]!.email) duplicados.push(lista[j]!.email);
 *         }
 *     }
 *     return { duplicados, operaciones };
 * }
 *
 * // O(n): Set con búsqueda/inserción O(1) amortizado
 * function duplicadosLineal(lista: readonly Empleado[]): Medicion {
 *     const vistos = new Set<string>();
 *     const duplicados: string[] = [];
 *     let operaciones = 0;
 *     for (const { email } of lista) {
 *         operaciones++;
 *         if (vistos.has(email)) duplicados.push(email);
 *         else vistos.add(email);
 *     }
 *     return { duplicados, operaciones };
 * }
 *
 * const nomina: readonly Empleado[] = Array.from({ length: 2000 }, (_, i) => ({
 *     id: i + 1,
 *     email: `user${i % 1990}@empresa.com`,
 * }));
 *
 * const lenta = duplicadosCuadratico(nomina);
 * const rapida = duplicadosLineal(nomina);
 * const fmt = (n: number): string => n.toLocaleString('en-US');
 *
 * console.log(`O(n^2): ${lenta.duplicados.length} duplicados en ${fmt(lenta.operaciones)} operaciones`);
 * console.log(`O(n):   ${rapida.duplicados.length} duplicados en ${fmt(rapida.operaciones)} operaciones`);
 * console.log('Mismo resultado:', lenta.duplicados.join() === rapida.duplicados.join());
 *
 * const indicePorId = new Map(nomina.map((e) => [e.id, e] as const)); // Map<number, Empleado>
 * console.log(indicePorId.get(1995)?.email, indicePorId.get(9999)?.email ?? 'no existe');
 *
 * // Salida esperada:
 * // O(n^2): 10 duplicados en 1,999,000 operaciones
 * // O(n):   10 duplicados en 2,000 operaciones
 * // Mismo resultado: true
 * // user4@empresa.com no existe
 *
 * Con 200 000 empleados la versión cuadrática haría ~20 000 millones de
 * comparaciones (minutos); la lineal, 200 000 (milisegundos).
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - PRIMERO CORRECTO Y LEGIBLE, LUEGO RÁPIDO: optimiza solo lo que el
 *   profiler señala. Un `for` manual "porque es más rápido" que `map` rara vez
 *   importa frente a un algoritmo mal elegido o una consulta N+1 a la BD.
 * - `sort()` SIN COMPARADOR ORDENA COMO TEXTO y MUTA: usa
 *   `toSorted((a, b) => a - b)`. Para textos con tildes usa
 *   `Intl.Collator('es').compare` (créalo una vez, no en cada comparación).
 * - `arr.shift()` EN UN BUCLE PARA UNA COLA ES `O(n^2)`: usa un índice de
 *   cabeza o una cola circular (tema 24).
 * - NO USES OBJETOS LITERALES COMO DICCIONARIOS DINÁMICOS: `Map<K, V>` es más
 *   rápido para altas/bajas frecuentes, acepta cualquier clave y no hereda
 *   claves de `Object.prototype` (`'constructor' in {}` es `true`).
 * - FORMAS ESTABLES: inicializa todas las propiedades en el constructor (TS
 *   con `strictPropertyInitialization` te obliga), evita `delete obj.prop`
 *   (asigna `undefined` o crea un objeto nuevo) y no mezcles tipos en arreglos.
 * - MEMOIZAR TIENE COSTO: la caché crece sin límite (fuga de memoria) y
 *   `JSON.stringify` como clave es `O(tamaño)`. Pon tope (LRU) o usa
 *   `WeakMap` cuando la clave sea un objeto.
 * - EL TIPO `number` ES DOUBLE: enteros exactos solo hasta
 *   `Number.MAX_SAFE_INTEGER` (2^53 - 1); para más usa `bigint` (más lento).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Clasifica en un comentario la complejidad de 6 fragmentos (acceso por
 *    índice, `includes`, dos bucles anidados, búsqueda binaria, `toSorted`,
 *    fibonacci recursivo) y justifica cada una.
 * 2. `existeSku(skus: readonly string[], sku)` con `includes` vs con un
 *    `ReadonlySet<string>` precomputado; mide 100 000 consultas con `performance.now()`.
 * 3. `buscarBinaria<T>` genérica con comparador y pruebas con números y con
 *    fechas ISO ordenadas.
 *
 * [Intermedio]
 * 4. Two-sum en `O(n)`: `parQueSuma(montos: readonly number[], objetivo)` que
 *    devuelva `[i, j] | null` usando un `Map<number, number>`.
 * 5. Conciliación bancaria: cruza 50 000 movimientos del banco con 50 000
 *    registros contables por `referencia` en `O(n)` y reporta faltantes.
 * 6. `memoizar` genérica con límite de entradas (expulsa la más antigua) y
 *    contador de aciertos/fallos; aplícala a `tarifaEnvio(origen, destino, kg)`.
 * 7. Ventana deslizante: `maxPromedioMovil(lecturas: readonly number[], k)`
 *    en `O(n)` para un medidor IoT de consumo eléctrico.
 *
 * [Senior / Producción]
 * 8. `CacheLru<K, V>` con `get`/`set` en `O(1)` aprovechando el orden de
 *    inserción de `Map`, con capacidad y métricas tipadas.
 * 9. Top-K con un `MinHeap<T>` genérico: los 10 clientes con mayor facturación
 *    entre 1 000 000 en `O(n log k)`; compáralo con ordenar todo.
 * 10. Benchmark reproducible: compara `forEach`, `for...of`, `for` clásico y
 *     `reduce` sumando 5 000 000 de números, con calentamiento del JIT,
 *     varias repeticiones, mediana y `process.memoryUsage().heapUsed`;
 *     documenta conclusiones y por qué los microbenchmarks engañan.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
