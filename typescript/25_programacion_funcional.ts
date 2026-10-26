/*
 * ============================================================================
 * TEMA 25: PROGRAMACIÓN FUNCIONAL TIPADA (MAP, FILTER, REDUCE, PIPE E INMUTABILIDAD)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: funciones como valores con tipo)
 * ----------------------------------------------------------------------------
 * En TypeScript las funciones son valores de primera clase CON TIPO propio:
 * `(e: Envio) => boolean` es un tipo tan real como `string`. Eso permite
 * componer funciones pequeñas y que el compilador verifique que "encajan".
 *
 * 1) **Funciones puras**: mismo input -> mismo output, sin efectos secundarios
 *    (no mutan parámetros, no leen `Date.now()`, no hacen I/O). TS no puede
 *    garantizar la pureza, pero `readonly` y `ReadonlyArray<T>` hacen que el
 *    compilador RECHACE `push`, `sort`, `splice` o asignaciones sobre los datos
 *    recibidos.
 * 2) **La inmutabilidad de TS es solo de compilación (type erasure)**:
 *    `readonly` desaparece al compilar a JS. En runtime el arreglo sigue siendo
 *    mutable; si necesitas garantía real usa `Object.freeze` (superficial).
 * 3) **Inferencia en cadenas declarativas**: en `lista.filter(...).map(...)`
 *    TS infiere el tipo de cada paso. Un *type predicate* en `filter`
 *    (`(x): x is T => ...`) estrecha el tipo del arreglo resultante; desde
 *    TS 5.5 muchos predicados se infieren solos (`.filter((x) => x !== null)`).
 * 4) **Genéricos para funciones de orden superior**: `pipe`, `compose`, `curry`
 *    o `memoizar` se tipan con parámetros `<A, B, C>` y sobrecargas, para que
 *    el tipo de salida de una función sea el de entrada de la siguiente.
 * 5) **Métodos que copian (ES2023)**: `toSorted`, `toReversed`, `toSpliced` y
 *    `with(i, v)` existen en `ReadonlyArray`, mientras que `sort`/`reverse` no.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Reducers de estado (Redux, `useReducer`, NgRx): `(estado, accion) => nuevo`
 *   con uniones discriminadas para las acciones.
 * - Pipelines ETL de logística, banca o IoT: limpiar, validar, agrupar y
 *   agregar registros con `filter`/`map`/`reduce`/`Object.groupBy`.
 * - Validadores y reglas de negocio componibles (scoring de crédito, reglas
 *   de envío gratis, elegibilidad de pacientes).
 * - Middlewares tipados (Express/Fastify/tRPC) como composición de funciones.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // Tipos función y orden superior:
 * type Predicado<T> = (valor: T) => boolean;
 * const negar = <T>(p: Predicado<T>): Predicado<T> => (v) => !p(v);
 *
 * // Type predicate en filter: de (string | null)[] a string[]
 * const codigos = ['A1', null, 'B2'].filter((c): c is string => c !== null);
 *
 * // reduce con tipo explícito del acumulador (evita que se infiera {}):
 * const total = [10, 20].reduce<number>((suma, n) => suma + n, 0);
 *
 * // Currying tipado:
 * const conIva = (tasa: number) => (base: number): number => base * (1 + tasa);
 * const ivaColombia = conIva(0.19); // (base: number) => number
 *
 * // Actualización inmutable con spread y Readonly:
 * type Paciente = Readonly<{ id: number; alergias: readonly string[] }>;
 * const agregarAlergia = (p: Paciente, a: string): Paciente =>
 *     ({ ...p, alergias: [...p.alergias, a] });
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un operador logístico calcula los kilos ENTREGADOS por ciudad con
 * un `pipe` tipado, ordena sin mutar con `toSorted` y agrupa por estado con
 * `Object.groupBy` (Node 21+, `lib: ES2024`).
 *
 * type EstadoEnvio = 'ENTREGADO' | 'EN_RUTA' | 'DEVUELTO';
 *
 * interface Envio {
 *     readonly id: string;
 *     readonly ciudad: string;
 *     readonly estado: EstadoEnvio;
 *     readonly pesoKg: number;
 * }
 *
 * const envios: readonly Envio[] = [
 *     { id: 'E1', ciudad: 'Lima', estado: 'ENTREGADO', pesoKg: 2.5 },
 *     { id: 'E2', ciudad: 'Quito', estado: 'EN_RUTA', pesoKg: 10 },
 *     { id: 'E3', ciudad: 'Lima', estado: 'ENTREGADO', pesoKg: 4 },
 *     { id: 'E4', ciudad: 'Bogotá', estado: 'DEVUELTO', pesoKg: 1.2 },
 *     { id: 'E5', ciudad: 'Quito', estado: 'ENTREGADO', pesoKg: 7.5 },
 * ];
 *
 * function pipe<A, B>(f: (a: A) => B): (a: A) => B;
 * function pipe<A, B, C>(f: (a: A) => B, g: (b: B) => C): (a: A) => C;
 * function pipe(...fns: Array<(x: any) => any>): (x: any) => any {
 *     return (x) => fns.reduce((acc, fn) => fn(acc), x);
 * }
 *
 * const esEntregado = (e: Envio): boolean => e.estado === 'ENTREGADO';
 *
 * const kgPorCiudad = (lista: readonly Envio[]): Record<string, number> =>
 *     lista.filter(esEntregado).reduce<Record<string, number>>((acc, e) => {
 *         acc[e.ciudad] = (acc[e.ciudad] ?? 0) + e.pesoKg; // acumulador local: mutarlo es seguro
 *         return acc;
 *     }, {});
 *
 * const formatear = (r: Readonly<Record<string, number>>): string[] =>
 *     Object.entries(r).map(([ciudad, kg]) => `${ciudad}: ${kg.toFixed(1)} kg`);
 *
 * const reporte = pipe(kgPorCiudad, formatear); // (a: readonly Envio[]) => string[]
 * console.log(reporte(envios));
 *
 * const idsPorPeso = envios.toSorted((a, b) => b.pesoKg - a.pesoKg).map((e) => e.id);
 * console.log(idsPorPeso.join(','), '| original intacto:', envios[0]?.id);
 *
 * const porEstado = Object.groupBy(envios, (e) => e.estado);
 * console.log(Object.keys(porEstado), porEstado.ENTREGADO?.length ?? 0);
 *
 * // Salida esperada:
 * // [ 'Lima: 6.5 kg', 'Quito: 7.5 kg' ]
 * // E2,E5,E3,E1,E4 | original intacto: E1
 * // [ 'ENTREGADO', 'EN_RUTA', 'DEVUELTO' ] 3
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - `['10', '10', '10'].map(parseInt)` COMPILA SIN ERRORES y devuelve
 *   `[10, NaN, 2]`: TS acepta pasar `parseInt(s, radix?)` como callback porque
 *   `map` le entrega `(valor, indice, arreglo)` y el índice encaja en `radix`.
 *   Los tipos no protegen de este bug de runtime: usa `.map(Number)` o
 *   `.map((s) => Number.parseInt(s, 10))`.
 * - `readonly` NO ES PROFUNDO NI EXISTE EN RUNTIME: `Readonly<T>` solo afecta
 *   al primer nivel. Para estructuras anidadas define un `DeepReadonly<T>` con
 *   tipos mapeados recursivos o usa `as const` en literales.
 * - TIPA EL ACUMULADOR DE `reduce`: `reduce((acc, x) => ..., {})` infiere `{}`
 *   y luego no puedes indexarlo. Usa `reduce<Record<string, number>>(...)`.
 *   Y pasa SIEMPRE el valor inicial (con `[]` vacío lanza `TypeError`).
 * - EVITA `{ ...acc, [k]: v }` EN CADA ITERACIÓN DE `reduce`: copia todo el
 *   objeto y convierte un algoritmo `O(n)` en `O(n^2)`. Mutar el acumulador
 *   recién creado dentro del propio `reduce` sigue siendo una función pura.
 * - `sort()` MUTA Y ORDENA COMO TEXTO: `[10, 9, 1].sort()` da `[1, 10, 9]`.
 *   Usa `toSorted((a, b) => a - b)`; en un `readonly T[]` TS ni te deja usar
 *   `sort`, lo cual es una gran ventaja.
 * - NO ABUSES DE `any` EN UTILIDADES GENÉRICAS: si es inevitable dentro de la
 *   implementación de `pipe`, exponlo hacia fuera con sobrecargas bien tipadas.
 * - Con `noUncheckedIndexedAccess`, `arr[0]` es `T | undefined`: usa `?.`,
 *   `at()` o desestructuración con valor por defecto en lugar de `!`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Bug de `.map(parseInt)`: imprime `['10', '20', '30'].map(parseInt)` y
 *    `['10', '20', '30'].map(Number)`; explica en un comentario por qué TS no
 *    detecta el error.
 * 2. Cuantificadores tipados: dada `readonly Sensor[]` (`{ id; online; bateria }`),
 *    usa `every`, `some` y `find` para saber si todos están online, si alguno
 *    tiene batería < 15 y cuál es el primero en alerta (`Sensor | undefined`).
 * 3. `filter` con type predicate: convierte `(Factura | null)[]` en
 *    `Factura[]` escribiendo `esFactura(x): x is Factura`.
 *
 * [Intermedio]
 * 4. Estadísticas en una pasada: `estadisticas(ventas: readonly number[])`
 *    que con un único `reduce` tipado devuelva `{ conteo, suma, min, max }`.
 * 5. `pipe` y `compose` con sobrecargas para hasta 4 funciones y un normalizador
 *    `normalizarNombre = pipe(recortar, aMinusculas, capitalizarPalabras)`.
 * 6. Currying tipado: `precioFinal(impuesto)(descuento)(base)` y aplicaciones
 *    parciales `precioColombia = precioFinal(0.19)`.
 * 7. `DeepReadonly<T>`: define el tipo mapeado recursivo y una función pura
 *    `desactivarNotificacionEmail(estado)` que actualice
 *    `estado.usuario.preferencias.email` sin mutar ningún nivel.
 *
 * [Senior / Producción]
 * 8. Combinadores `todos`, `alguno` y `negar` sobre `Predicado<T>` para la
 *    elegibilidad de un crédito (`esMayorDeEdad`, `tieneIngresos`, `sinMora`),
 *    con cortocircuito y tipos genéricos.
 * 9. Evaluación perezosa: compara `filter().map().slice(0, 3)` sobre 100 000
 *    pedidos con un pipeline de generadores (`function*`) o Iterator Helpers
 *    (Node 22+, `Iterator.prototype.filter/map/take`) contando callbacks.
 * 10. Reducer de carrito con unión discriminada `Accion` (`AGREGAR`, `QUITAR`,
 *     `VACIAR`), `switch` exhaustivo con `never` y pruebas que verifiquen que el
 *     estado anterior nunca se muta (`Object.freeze` + `node:assert/strict`).
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
