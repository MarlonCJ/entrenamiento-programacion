'use strict';

/*
 * ============================================================================
 * TEMA 23: ALGORITMOS DE BÚSQUEDA, ORDENAMIENTO Y TIMSORT EN EL MOTOR V8
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Ordenamiento y Búsqueda en V8)
 * ----------------------------------------------------------------------------
 * Comprender la complejidad de búsqueda y cómo ordena internamente el motor V8
 * evita errores sutiles y cuellos de botella severos:
 *
 * 1) **Búsqueda Lineal ($O(n)$) vs Búsqueda Binaria ($O(\log n)$)**:
 *    - `.find()`, `.findIndex()` e `.includes()` recorren el arreglo de principio
 *      a fin ($O(n)$).
 *    - Si el arreglo está **ordenado**, la **Búsqueda Binaria** descarta la
 *      mitad de los elementos en cada iteración usando `Math.trunc((izq + der) / 2)`,
 *      encontrando un dato entre 1,000,000 de registros en máximo **20 pasos**!
 * 2) **Cómo funciona `Array.prototype.sort` / `toSorted` en V8**:
 *    - El motor V8 utiliza **TimSort** (un algoritmo híbrido entre *Merge Sort*
 *      e *Insertion Sort* con complejidad $O(n \log n)$ en el peor caso y $O(n)$
 *      cuando los datos ya están casi ordenados).
 *    - Desde **ES2019 (Node 12+)**, el ordenamiento en JavaScript es **100%
 *      ESTABLE** por especificación: los elementos que empatan en el comparador
 *      (`0`) conservan garantizadamente su orden relativo original.
 * 3) **El Contrato de `compareFn(a, b)`**:
 *    - Si devuelve `< 0`: `a` va antes que `b`.
 *    - Si devuelve `> 0`: `b` va antes que `a`.
 *    - Si devuelve `0`: son equivalentes (se mantiene su orden original).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Ordenamiento Multicriterio Inmutable (`.toSorted()`): Ordenar productos por
 *   disponibilidad, luego por precio ascendente y desempatar alfabéticamente con
 *   `Intl.Collator`.
 * - Búsqueda Binaria sobre Series Temporales o Tarifarios: Encontrar en $O(\log n)$
 *   la cotización o el evento inmediatamente anterior a un timestamp dado.
 * - Ordenamiento de Alto Rendimiento de Textos con `Intl.Collator`: Mucho más
 *   rápido que llamar a `a.localeCompare(b)` miles de veces dentro de `.sort()`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Búsqueda Binaria Iterativa O(log n):
 * function busquedaBinaria(arregloOrdenado, objetivo) {
 *     let izq = 0;
 *     let der = arregloOrdenado.length - 1;
 *     while (izq <= der) {
 *         const medio = izq + Math.trunc((der - izq) / 2);
 *         const actual = arregloOrdenado[medio];
 *         if (actual === objetivo) return medio;
 *         if (actual < objetivo) izq = medio + 1;
 *         else der = medio - 1;
 *     }
 *     return -1;
 * }
 *
 * // 2. Comparador de textos ultrarrápido con Intl.Collator y desempate numérico:
 * const comparadorEs = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
 * // lista.toSorted((a, b) => (a.precio - b.precio) || comparadorEs.compare(a.nombre, b.nombre));
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Ordenar un catálogo de candidatos primero por puntaje de prueba
 * descendente y, en caso de empate (aprovechando que `0` es falsy en `||`),
 * desempatar alfabéticamente en español usando `Intl.Collator`.
 *
 * const collatorEs = new Intl.Collator('es', { sensitivity: 'base' });
 * const candidatos = [
 *     { nombre: 'Óscar', puntaje: 90 },
 *     { nombre: 'Ana', puntaje: 95 },
 *     { nombre: 'Andrés', puntaje: 90 },
 * ];
 *
 * const ranking = candidatos.toSorted(
 *     (a, b) => (b.puntaje - a.puntaje) || collatorEs.compare(a.nombre, b.nombre)
 * );
 *
 * console.log(JSON.stringify(ranking));
 * // Salida esperada:
 * // [{"nombre":"Ana","puntaje":95},{"nombre":"Andrés","puntaje":90},{"nombre":"Óscar","puntaje":90}]
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - NUNCA DEVUELVAS UN BOOLEANO EN `.sort((a, b) => a > b)`:
 *   En JavaScript, `true` o `false` NO cumplen el contrato del comparador (que
 *   exige un número negativo, cero o positivo). Devolver un booleano produce un
 *   ordenamiento corrupto e inconsistente. Usa `(a, b) => a - b` para números y
 *   `collator.compare(a, b)` para strings.
 * - USA `new Intl.Collator('es')` EN LUGAR DE `a.localeCompare(b, 'es')` EN LISTAS GRANDES:
 *   Instanciar un `Intl.Collator` una sola vez fuera del `.toSorted()` es hasta
 *   **10 veces más rápido** que llamar a `localeCompare` en cada una de las
 *   $N \log N$ comparaciones!
 * - CUIDADO CON `NaN` EN EL ARREGLO AL ORDENAR NÚMEROS: `NaN - 5` devuelve `NaN`,
 *   lo que rompe las invariantes del comparador de TimSort. Filtra o maneja
 *   `Number.isNaN` antes de ordenar.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Búsqueda lineal vs `.findIndex()`: Implementa manualmente la búsqueda del
 *    primer pedido que supere `$500` devolviendo su índice o `-1`, y compárala
 *    con `pedidos.findIndex((p) => p.total > 500)`.
 * 2. Verificación de arreglo ordenado en $O(n)$: Implementa `estaOrdenado(arr)`
 *    que compruebe en una sola pasada si el arreglo ya está en orden ascendente.
 * 3. Implementación de *Insertion Sort*: Escribe el algoritmo de ordenamiento
 *    por inserción sobre una copia del arreglo (`[...arr]`) y explica por qué
 *    TimSort lo utiliza internamente para sub-arreglos pequeños.
 *
 * [Intermedio]
 * 4. Búsqueda Binaria con conteo de pasos: Implementa `busquedaBinariaConPasos(arr, objetivo)`
 *    que retorne `{ indice, pasos }` y comprueba cuántos pasos toma buscar en un
 *    arreglo de `65,536` elementos.
 * 5. Búsqueda Binaria de Punto de Inserción (*Lower Bound* / `bisectLeft`):
 *    Encuentra en $O(\log n)$ el primer índice donde `arr[i] >= objetivo` para
 *    saber exactamente en qué posición insertar un nuevo elemento manteniendo el
 *    arreglo ordenado.
 * 6. Ordenamiento natural alfanumérico con `Intl.Collator({ numeric: true })`:
 *    Ordena `['Archivo 10', 'Archivo 2', 'Archivo 1', 'Archivo 20']` para que
 *    quede en el orden humano `1, 2, 10, 20`.
 * 7. Implementación de *Merge Sort* ($O(n \log n)$): Implementa `mergeSort(arr)`
 *    y su función auxiliar `fusionar(izq, der)` de forma inmutable.
 *
 * [Senior / Producción]
 * 8. Ordenamiento Multicriterio con `null` / `undefined` siempre al final (*Nulls Last*):
 *    Implementa un comparador para ordenar productos por `fechaDescuento`
 *    ascendente asegurando que aquellos cuya `fechaDescuento` sea `null` queden
 *    siempre al final de la lista tanto en orden ascendente como descendente.
 * 9. Búsqueda Binaria en Espacio de Respuestas (*Binary Search on Answer*):
 *    Dado un arreglo de pesos de paquetes y un número máximo de días `D`, usa
 *    búsqueda binaria para encontrar la capacidad mínima diaria del camión
 *    necesaria para despachar todos los paquetes en `D` días.
 * 10. Algoritmo *QuickSelect* o Selección de Percentil P95 / Mediana: Calcula el
 *     percentil 95 (P95) y la mediana exacta de los tiempos de respuesta de un
 *     servidor.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
