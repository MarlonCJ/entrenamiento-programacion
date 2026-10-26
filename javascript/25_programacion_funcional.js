'use strict';

/*
 * ============================================================================
 * TEMA 25: PROGRAMACIÓN FUNCIONAL (MAP, FILTER, REDUCE, COMPOSICIÓN E INMUTABILIDAD)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental Funcional en JavaScript)
 * ----------------------------------------------------------------------------
 * JavaScript tiene raíces profundamente funcionales (inspiradas en Scheme). En
 * arquitecturas modernas (React, Redux, Node.js funcional), el código se
 * construye con tres principios:
 *
 * 1) **Funciones Puras (*Pure Functions*) y Transparencia Referencial**:
 *    Una función es pura si: (a) a iguales argumentos de entrada SIEMPRE retorna
 *    el mismo resultado, y (b) **no tiene efectos secundarios** (no muta los
 *    objetos o arreglos recibidos por parámetro, no modifica variables externas,
 *    no llama a `Math.random()` ni a `Date.now()`).
 * 2) **Transformaciones Declarativas de Colecciones**:
 *    - `.map(fn)`: Transforma 1 a 1 cada elemento devolviendo un nuevo arreglo.
 *    - `.filter(predicado)`: Conserva los elementos que cumplen la condición.
 *    - `.flatMap(fn)`: Mapea y aplana 1 nivel en una sola pasada (ideal para
 *      filtrar y transformar simultáneamente devolviendo `[]` o `[nuevoItem]`).
 *    - `.reduce((acum, actual) => nuevoAcum, valorInicial)`: Colapsa el arreglo
 *      en cualquier valor o estructura acumulada.
 *    - `.every(pred)` ($\forall$ cuantificador universal) y `.some(pred)` ($\exists$
 *      cuantificador existencial) con cortocircuito automático.
 * 3) **Composición de Funciones (`pipe` y `compose`) y *Currying***:
 *    Construir tuberías de procesamiento uniendo funciones pequeñas y probadas.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Tuberías de Transformación de Datos (*Data Pipelines*): Limpiar, validar,
 *   enriquecer y agrupar respuestas de bases de datos o APIs.
 * - Actualizaciones de Estado Inmutables: Producir un nuevo estado de aplicación
 *   sin mutar el estado anterior.
 * - Validadores Componibles con `.every()` y `.some()`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Pipeline declarativo con filter -> map -> reduce:
 * const pedidos = [
 *     { id: 1, estado: 'PAGADO', monto: 100 },
 *     { id: 2, estado: 'CANCELADO', monto: 50 },
 *     { id: 3, estado: 'PAGADO', monto: 200 },
 * ];
 *
 * const totalPagado = pedidos
 *     .filter((p) => p.estado === 'PAGADO')
 *     .map((p) => p.monto)
 *     .reduce((suma, monto) => suma + monto, 0); // 300
 *
 * // 2. Función pipe universal (ejecuta funciones de izquierda a derecha):
 * const pipe = (...fns) => (valorInicial) =>
 *     fns.reduce((acum, fn) => fn(acum), valorInicial);
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un consolidador contable extrae todos los ítems de una lista de
 * órdenes pagadas usando `.flatMap()` y calcula el ingreso total por SKU usando
 * `.reduce()`.
 *
 * const ordenes = [
 *     {
 *         pagada: true,
 *         lineas: [
 *             { sku: 'LIB-1', subtotal: 25 },
 *             { sku: 'LAP-2', subtotal: 800 },
 *         ],
 *     },
 *     {
 *         pagada: false,
 *         lineas: [{ sku: 'LIB-1', subtotal: 25 }],
 *     },
 *     {
 *         pagada: true,
 *         lineas: [{ sku: 'LIB-1', subtotal: 50 }],
 *     },
 * ];
 *
 * const ingresosPorSku = ordenes
 *     .flatMap((orden) => (orden.pagada ? orden.lineas : []))
 *     .reduce((acc, linea) => {
 *         acc[linea.sku] = (acc[linea.sku] ?? 0) + linea.subtotal;
 *         return acc;
 *     }, {});
 *
 * console.log(JSON.stringify(ingresosPorSku));
 * // Salida esperada:
 * // {"LIB-1":75,"LAP-2":800}
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - ¡EL FAMOSO BUG DE `['10', '10', '10'].map(parseInt)`!:
 *   `.map(fn)` pasa **3 argumentos** al callback: `(elemento, indice, arreglo)`.
 *   Como `parseInt(str, radix)` recibe la base numérica en su 2do argumento,
 *   hacer `.map(parseInt)` ejecuta `parseInt('10', 0)`, `parseInt('10', 1)` y
 *   `parseInt('10', 2)` devolviendo **`[10, NaN, 2]`**!
 *   Usa siempre `.map(Number)` o `.map((x) => Number.parseInt(x, 10))`.
 * - SIEMPRE PASA EL `valorInicial` A `.reduce(fn, valorInicial)`:
 *   Si llamas a `.reduce(fn)` sin segundo argumento sobre un arreglo vacío `[]`,
 *   ¡lanza inmediatamente `TypeError: Reduce of empty array with no initial value`!
 * - NO USES `{ ...acc, [k]: v }` DENTRO DE `.reduce()` EN ARREGLOS GRANDES:
 *   Clonar todo el objeto acumulador con spread `{ ...acc }` en cada iteración
 *   convierte un `.reduce()` lineal $O(n)$ en un algoritmo cuadrático **$O(n^2)$**
 *   que congela el servidor! Es perfectamente puro mutar el acumulador recién
 *   creado dentro del propio `.reduce`: `acc[k] = v; return acc;`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Demostración del bug de `.map(parseInt)` vs `.map(Number)`: Muestra en
 *    consola el resultado de ambos sobre `['10', '20', '30']` y explica por qué
 *    ocurre.
 * 2. Consultas expresivas con `.every()`, `.some()` y `.find()`: Dada una lista
 *    de servidores, verifica si TODOS están en línea (`.every`), si ALGUNO supera
 *    el 90% de CPU (`.some`) y encuentra el primero con alerta (`.find`).
 * 3. Filtrado y transformación combinada con `.flatMap()`: Dada una lista de
 *    departamentos donde cada uno tiene un arreglo `empleados`, obtén en un solo
 *    `.flatMap()` los nombres de todos los empleados de la empresa.
 *
 * [Intermedio]
 * 4. Estadísticas en una sola pasada con `.reduce()`: Dado un arreglo de ventas,
 *    calcula en un único `.reduce()` un objeto `{ conteo, suma, min, max }` sin
 *    recorrer el arreglo 4 veces.
 * 5. Tubería funcional con `pipe` y `compose`: Implementa ambas funciones y crea
 *    un procesador de texto `normalizarTitulo = pipe(quitarEspacios, pasarAMinusculas, capitalizarPalabras)`.
 * 6. Aplicación parcial y *Currying*: Implementa una función `curry(fn)` que
 *    permita invocar `calcularPrecio(impuesto, descuento, base)` tanto de golpe
 *    como por partes `calcularPrecio(0.19)(0.10)(100)`.
 * 7. Actualización profunda inmutable de estado: Dado un objeto de estado anidado
 *    `estado.usuario.preferencias.notificaciones`, crea una función pura que
 *    cambie `email: false` sin mutar ningún nivel del objeto original.
 *
 * [Senior / Producción]
 * 8. Combinadores de Predicados Funcionales (`allPass`, `anyPass`, `complement`):
 *    Implementa funciones de orden superior que reciban una lista de predicados
 *    `[esAdulto, tieneIngresos, sinDeudaMora]` y devuelvan un nuevo predicado
 *    compuesto evaluado con cortocircuito.
 * 9. Iterator Helpers / Evaluación Perezosa Funcional (ES2025 `Iterator.from` o
 *    Generadores): Compara encadenar `.filter().map().slice(0, 3)` sobre un
 *    arreglo de 100,000 elementos (que crea arreglos completos intermedios)
 *    frente a usar un pipeline perezoso que se detiene al encontrar el 3er elemento.
 * 10. Transductores o Fusión de Pasadas (*Loop Fusion*): Implementa una utilidad
 *     `filtrarYMapear(lista, predicado, transformador)` que realice el filtrado
 *     y mapeo en una sola iteración sin alojar arreglos intermedios.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
