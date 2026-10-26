'use strict';

/*
 * ============================================================================
 * TEMA 12: ARREGLOS, MÉTODOS INMUTABLES (ES2023+) Y MODELO DE MEMORIA EN V8
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Arrays en el Motor V8)
 * ----------------------------------------------------------------------------
 * En el motor V8 (Node.js / Chrome), los arreglos tienen representaciones
 * internas distintas según cómo los uses:
 * - **`PACKED_SMI_ELEMENTS` / `PACKED_ELEMENTS` (Arreglos Densos y Contiguos)**:
 *   Cuando todos los índices `0..N-1` son contiguos sin huecos, V8 almacena el
 *   arreglo en un bloque continuo de memoria ultrarrápido en C++.
 * - **`HOLEY_ELEMENTS` (Arreglos Dispersos / Con Huecos — ¡Evítalos!)**:
 *   Si haces `const a = []; a[100] = 'x';` o `delete a[1]`, creas "huecos"
 *   (*empty slots*). Una vez que un arreglo pasa a ser *Holey* en V8, **jamás
 *   vuelve a ser *Packed*** y todas las lecturas se vuelven más lentas porque
 *   V8 debe consultar la cadena de prototipos en cada hueco.
 *
 * Revolución de Inmutabilidad en Arreglos (ES2023+):
 * Históricamente, cuatro métodos de `Array` eran peligrosos porque **mutaban el
 * arreglo original in-place**: `.sort()`, `.reverse()`, `.splice()` y `arr[i] = v`.
 * Desde ES2023 (Node 20+), JavaScript introdujo sus equivalentes **100% inmutables**
 * que devuelven una copia nueva sin alterar el original:
 * - `.toSorted(compareFn)` (reemplazo inmutable de `.sort()`)
 * - `.toReversed()` (reemplazo inmutable de `.reverse()`)
 * - `.toSpliced(inicio, borrar, ...items)` (reemplazo inmutable de `.splice()`)
 * - `.with(indice, nuevoValor)` (reemplazo inmutable de `arr[indice] = nuevoValor`)
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Ordenar o Invertir Datos sin Mutar las Props o el Estado Original:
 *   Usar `productos.toSorted((a, b) => a.precio - b.precio)` sin corromper el
 *   arreglo recibido por parámetro.
 * - Acceso al Último Elemento con `.at(-1)`: Mucho más limpio que `arr[arr.length - 1]`.
 * - Desestructuración con Rest (`const [primero, ...resto] = lista`) y Clonación
 *   Superficial (`[...lista]`).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * const original = [30, 10, 20];
 *
 * // 1. Métodos inmutables ES2023+ (original NO se modifica!):
 * const ordenado    = original.toSorted((a, b) => a - b); // [10, 20, 30]
 * const invertido   = original.toReversed();              // [20, 10, 30]
 * const reemplazado = original.with(1, 99);               // [30, 99, 20]
 * const sinMedio    = original.toSpliced(1, 1);           // [30, 20]
 *
 * // 2. Indexación negativa con .at() (ES2022+):
 * const ultimo = original.at(-1); // 20
 *
 * // 3. Creación pre-inicializada con Array.from():
 * const secuencia = Array.from({ length: 5 }, (_, i) => (i + 1) * 10); // [10, 20, 30, 40, 50]
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Actualizar el precio de un ítem específico en una lista de precios
 * y obtener el ranking ordenado sin mutar el arreglo original de auditoría.
 *
 * const preciosOriginales = Object.freeze([150, 80, 220, 95]);
 *
 * // Actualizamos el índice 1 a 110 y ordenamos de menor a mayor de forma 100% inmutable:
 * const preciosActualizados = preciosOriginales.with(1, 110);
 * const rankingAscendente = preciosActualizados.toSorted((a, b) => a - b);
 *
 * console.log('Original intacto:', JSON.stringify(preciosOriginales));
 * console.log('Nuevo ordenado:  ', JSON.stringify(rankingAscendente));
 * // Salida esperada:
 * // Original intacto: [150,80,220,95]
 * // Nuevo ordenado:   [95,110,150,220]
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - ¡EL PEOR GOTCHA DE JAVASCRIPT: `[10, 2, 30].sort()` ORDENA ALFABÉTICAMENTE!:
 *   Si llamas a `.sort()` o `.toSorted()` **sin pasar función comparadora**,
 *   JavaScript convierte todos los números a `string` y los ordena por código
 *   UTF-16: `[10, 2, 30].sort()` devuelve **`[10, 2, 30]`** (porque `"10" < "2"`!).
 *   Para números, pasa SIEMPRE `(a, b) => a - b` (ascendente) o `(a, b) => b - a`
 *   (descendente).
 * - NUNCA USES `delete arr[i]` PARA ELIMINAR UN ELEMENTO DE UN ARREGLO:
 *   `delete arr[1]` NO reduce `arr.length`; deja un hueco `<1 empty item>` y
 *   degrada el arreglo a `HOLEY_ELEMENTS` en V8. Usa `.splice(i, 1)`,
 *   `.toSpliced(i, 1)` o `.filter()`.
 * - CUIDADO CON `new Array(3).fill({})`: Pasa la **misma referencia** del objeto
 *   vacío a las 3 posiciones! Si modificas `arr[0].x = 1`, cambiarán las 3
 *   posiciones. Usa siempre `Array.from({ length: 3 }, () => ({}))`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. El peligro de `.sort()` sin comparador: Muestra qué devuelve
 *    `[100, 25, 5, 10, 2].sort()` frente a `.toSorted((a, b) => a - b)`.
 * 2. Uso de `.at()` y destructuring con `...rest`: De una lista de competidores,
 *    extrae el primero, el segundo, el último (con `.at(-1)`) y un sub-arreglo
 *    con los demás.
 * 3. Operaciones en los extremos (`push`/`pop` vs `unshift`/`shift`): Simula
 *    el agregado y retiro de elementos y explica por qué `push`/`pop` son $O(1)$
 *    mientras que `unshift`/`shift` son $O(n)$.
 *
 * [Intermedio]
 * 4. Suite de métodos inmutables ES2023+ (`with`, `toSorted`, `toReversed`, `toSpliced`):
 *    Congela un arreglo con `Object.freeze` y realiza las 4 transformaciones
 *    demostrando que el arreglo original permanece congelado e intacto.
 * 5. El bug de `Array(n).fill({})` con referencias compartidas: Demuestra cómo
 *    mutar una fila en `new Array(3).fill([])` altera todas las filas, y
 *    corrígelo usando `Array.from({ length: 3 }, () => [])`.
 * 6. Aplanamiento de arreglos anidados con `.flat(profundidad)`: Convierte
 *    `[[1, 2], [3, [4, 5]]]` en un arreglo plano de un solo nivel usando `.flat(2)`
 *    o `.flat(Infinity)`.
 * 7. Búsqueda desde el final con `.findLast()` y `.findLastIndex()` (ES2023+):
 *    En un registro cronológico de eventos, encuentra el último evento de un
 *    usuario específico sin invertir el arreglo.
 *
 * [Senior / Producción]
 * 8. Paginador y Particionador Inmutable (`paginar` y `chunk`): Implementa
 *    `paginar(items, pagina, porPagina)` usando `.slice()` devolviendo
 *    `{ datos, totalItems, totalPaginas, tieneSiguiente, tieneAnterior }`.
 * 9. Arreglos Tipados Binarios (`TypedArray` - `Int32Array` / `Float64Array`):
 *    Crea un `Float64Array(1000)`, llénalo de mediciones y explica por qué en
 *    cálculos numéricos intensivos o WebSockets binarios consume menos memoria
 *    y evita el *boxing* en V8.
 * 10. Ventana Deslizante y Rotación Circular de Arreglo: Implementa
 *     `rotarDerechaInmutable(arr, k)` usando `.slice()` y spread `[...]` en
 *     $O(n)$ manejando el caso en que `k > arr.length` mediante `k % arr.length`.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
