/*
 * ============================================================================
 * TEMA 23: ALGORITMOS DE BÚSQUEDA, ORDENAMIENTO Y COMPARADORES GENÉRICOS
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: V8 + Sistema de Tipos)
 * ----------------------------------------------------------------------------
 * Buscar y ordenar son las operaciones más frecuentes sobre colecciones. En
 * TypeScript los algoritmos son los de JavaScript (los tipos se borran), pero
 * el sistema de tipos permite escribirlos UNA vez de forma GENÉRICA y segura.
 *
 * 1) **`Array.prototype.sort` en V8 usa TimSort** (desde 2019, Node 11+):
 *    híbrido de merge sort + insertion sort, O(n log n) en el peor caso,
 *    O(n) si los datos ya vienen casi ordenados, y ESTABLE (garantizado por
 *    ES2019): elementos "iguales" conservan su orden original. Esto permite
 *    ordenar por varios criterios con comparadores compuestos.
 * 2) **Sin comparador, `sort()` convierte a string**: `[10, 9, 1].sort()` da
 *    `[1, 10, 9]`. TS NO lo detecta: compila sin errores.
 * 3) **`sort` MUTA y devuelve el mismo arreglo**; `toSorted()` (ES2023,
 *    Node 20+, `lib: ["ES2023"]`) devuelve una copia. Sobre un
 *    `readonly T[]` TS prohíbe `sort()` pero permite `toSorted()`.
 * 4) **Búsqueda lineal O(n)** (`find`, `findIndex`, `includes`, `indexOf`) vs
 *    **binaria O(log n)** sobre datos ORDENADOS: con 1 millón de elementos,
 *    ~20 comparaciones frente a hasta 1 000 000.
 * 5) **Contrato del comparador** `(a, b) => number`: negativo si `a` va antes,
 *    positivo si va después, 0 si empatan. Debe ser consistente y transitivo;
 *    si no, el resultado es impredecible.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Catálogos y buscadores: ordenar por precio, relevancia y fecha (desempates).
 * - Rangos sobre datos ordenados: "precios entre X e Y", "eventos entre dos
 *   timestamps" con `lowerBound`/`upperBound` en vez de filtrar todo.
 * - Logística y finanzas: priorizar entregas, conciliar transacciones
 *   ordenando ambas listas y recorriéndolas con dos punteros (O(n)).
 * - Textos con idioma: `Intl.Collator('es').compare` para ordenar nombres con
 *   tildes y ñ correctamente (`localeCompare` es más lento en bucles grandes).
 * - Top-K: para "los 10 más vendidos" de millones de filas, un heap (tema 24)
 *   es mejor que ordenar todo.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (TS 5.x, lib ES2023)
 * ----------------------------------------------------------------------------
 * type Comparador<T> = (a: T, b: T) => number;
 *
 * const numeros = [40, 5, 100, 1];
 * numeros.sort((a, b) => a - b);                 // ascendente (MUTA)
 * const desc = numeros.toSorted((a, b) => b - a);// copia descendente
 * const coleccion = new Intl.Collator('es', { sensitivity: 'base' });
 * ['Ñandú', 'oso', 'Álamo'].sort(coleccion.compare);   // [ 'Álamo', 'Ñandú', 'oso' ]
 *
 * // Comparador genérico por clave (keyof + restricción)
 * function porClave<T, K extends keyof T>(clave: K): Comparador<T> {
 *     return (a, b) => (a[clave] < b[clave] ? -1 : a[clave] > b[clave] ? 1 : 0);
 * }
 * const invertir = <T>(c: Comparador<T>): Comparador<T> => (a, b) => c(b, a);
 *
 * // Búsquedas
 * const pedido = pedidos.find((p) => p.id === 'PX-9');   // Pedido | undefined
 * const ultimo = pedidos.findLast((p) => p.pagado);      // ES2023
 * const existe = new Set(ids).has('PX-9');               // O(1) tras construir el Set
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un buscador de vuelos ordena resultados por precio y, a igual
 * precio, por duración (comparadores compuestos); luego, sobre la lista
 * ordenada, usa búsqueda binaria `lowerBound` para extraer en O(log n) los
 * vuelos dentro del presupuesto del usuario.
 *
 * interface Vuelo {
 *     readonly codigo: string;
 *     readonly precio: number;
 *     readonly duracionMin: number;
 * }
 * type Comparador<T> = (a: T, b: T) => number;
 *
 * // Compone comparadores: desempata con el siguiente criterio si el anterior da 0.
 * function porCriterios<T>(...comparadores: Comparador<T>[]): Comparador<T> {
 *     return (a, b) => {
 *         for (const comparar of comparadores) {
 *             const r = comparar(a, b);
 *             if (r !== 0) return r;
 *         }
 *         return 0;
 *     };
 * }
 *
 * // lowerBound: primer índice cuyo valor es >= objetivo. O(log n).
 * function lowerBound<T>(ordenados: readonly T[], objetivo: number, clave: (x: T) => number): number {
 *     let bajo = 0;
 *     let alto = ordenados.length;
 *     while (bajo < alto) {
 *         const medio = (bajo + alto) >>> 1;
 *         if (clave(ordenados[medio]!) < objetivo) bajo = medio + 1;
 *         else alto = medio;
 *     }
 *     return bajo;
 * }
 *
 * const vuelos: readonly Vuelo[] = [
 *     { codigo: 'AV204', precio: 320, duracionMin: 410 },
 *     { codigo: 'LA118', precio: 280, duracionMin: 520 },
 *     { codigo: 'CM330', precio: 320, duracionMin: 365 },
 *     { codigo: 'IB650', precio: 610, duracionMin: 300 },
 *     { codigo: 'AA912', precio: 280, duracionMin: 470 },
 *     { codigo: 'UX077', precio: 450, duracionMin: 340 },
 * ];
 *
 * const porPrecio: Comparador<Vuelo> = (a, b) => a.precio - b.precio;
 * const porDuracion: Comparador<Vuelo> = (a, b) => a.duracionMin - b.duracionMin;
 *
 * const ordenados = vuelos.toSorted(porCriterios(porPrecio, porDuracion));   // no muta
 * console.log(ordenados.map((v) => `${v.codigo}:${v.precio}`).join(' '));
 *
 * const desde = lowerBound(ordenados, 300, (v) => v.precio);
 * const hasta = lowerBound(ordenados, 451, (v) => v.precio);   // precio <= 450
 * console.log(`Rango [300, 450] -> índices ${desde}..${hasta - 1}:`,
 *     ordenados.slice(desde, hasta).map((v) => v.codigo));
 *
 * console.log(`Original intacto: ${vuelos[0]?.codigo}`);
 * console.log([10, 9, 1, 100].sort(), [10, 9, 1, 100].sort((a, b) => a - b));
 *
 * // Salida esperada:
 * // AA912:280 LA118:280 CM330:320 AV204:320 UX077:450 IB650:610
 * // Rango [300, 450] -> índices 2..4: [ 'CM330', 'AV204', 'UX077' ]
 * // Original intacto: AV204
 * // [ 1, 10, 100, 9 ] [ 1, 9, 10, 100 ]
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - SIEMPRE PASA COMPARADOR A `sort` con números o fechas. Para fechas:
 *   `(a, b) => a.getTime() - b.getTime()`.
 * - `a - b` SOLO CON NÚMEROS FINITOS: con `NaN` el comparador devuelve `NaN`
 *   y rompe la transitividad. Con `bigint` no restes: usa `a < b ? -1 : a > b ? 1 : 0`.
 * - NO DEVUELVAS BOOLEANOS: `(a, b) => a > b` es un error clásico (TS lo
 *   rechaza porque `boolean` no es `number`, pero en JS "funciona" mal).
 * - `sort` MUTA: ordenar un arreglo recibido por parámetro modifica el del
 *   llamador (estado de React/Redux, cachés). Usa `toSorted` o `[...arr].sort()`.
 * - `noUncheckedIndexedAccess`: `arr[medio]` es `T | undefined`. Usa `!` solo
 *   cuando el índice está demostrado en rango (como en la búsqueda binaria).
 * - `(bajo + alto) >>> 1` evita decimales; en JS no hay desbordamiento de
 *   enteros hasta 2^53, pero `>>> 1` solo es válido para índices < 2^32.
 * - BÚSQUEDA BINARIA SOLO SOBRE DATOS ORDENADOS POR LA MISMA CLAVE: si ordenas
 *   por precio, no busques por duración.
 * - ¿Muchas búsquedas por igualdad? Construye un `Map`/`Set` una vez (O(n)) y
 *   consulta en O(1) en lugar de `find` dentro de un bucle (O(n²)).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Ordena `readonly Producto[]` por precio ascendente y luego descendente
 *    con `toSorted`, comprobando que el original no cambia.
 * 2. Implementa `busquedaLineal<T>(items: readonly T[], predicado: (x: T) =>
 *    boolean): number` que devuelva el índice o -1.
 * 3. Ordena nombres de estudiantes con tildes y ñ usando `Intl.Collator('es')`
 *    y compara el resultado con `sort()` sin comparador.
 *
 * [Intermedio]
 * 4. Implementa `busquedaBinaria<T>(ordenados, objetivo: T, comparar: Comparador<T>)`
 *    que devuelva el índice o -1, y cuenta cuántas comparaciones hace.
 * 5. Implementa `upperBound` y úsalo con `lowerBound` para contar cuántas
 *    lecturas de un sensor están entre dos timestamps.
 * 6. Escribe `porClave<T, K extends keyof T>(clave: K)` e `invertir(comparador)`
 *    y ordena pacientes por prioridad desc y hora de llegada asc.
 * 7. Implementa `ordenamientoInsercion<T>` y explica por qué es O(n) en datos
 *    casi ordenados (TimSort lo aprovecha para tramos pequeños).
 *
 * [Senior / Producción]
 * 8. Implementa `mergeSort<T>(items: readonly T[], comparar): T[]` estable y
 *    sin mutar; verifica la estabilidad con elementos de igual clave.
 * 9. Conciliación bancaria: dadas dos listas de transacciones ordenadas por
 *    referencia, encuentra en O(n + m) las que faltan en cada lado (dos punteros).
 * 10. Benchmark: compara `find` en bucle vs `Map` vs búsqueda binaria para
 *     100 000 consultas sobre 100 000 SKUs usando `performance.now()`, y
 *     documenta el punto en que conviene cada uno.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
