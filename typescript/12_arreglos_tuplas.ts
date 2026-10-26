/*
 * ============================================================================
 * TEMA 12: ARREGLOS TIPADOS, READONLY, TUPLAS Y ACCESO SEGURO POR ÍNDICE
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: misma lista, contrato distinto)
 * ----------------------------------------------------------------------------
 * En runtime un arreglo de TypeScript es un `Array` de JavaScript: dinámico,
 * mutable y pasado por referencia. TS añade un contrato sobre su CONTENIDO,
 * su LONGITUD y su MUTABILIDAD, que se verifica al compilar y luego se borra:
 *
 * 1) `T[]` y `Array<T>` son idénticos: lista homogénea de longitud variable.
 *    Un arreglo vacío sin anotar (`const xs = []`) evoluciona a `any[]`;
 *    anótalo siempre (`const xs: string[] = []`).
 * 2) `readonly T[]` (o `ReadonlyArray<T>`) elimina del tipo `push`, `pop`,
 *    `sort`, `splice` y la asignación por índice. NO congela nada en runtime
 *    (para eso está `Object.freeze`), pero documenta y garantiza que una
 *    función no muta lo que recibe. `T[]` es asignable a `readonly T[]`, no al
 *    revés.
 * 3) Tuplas: arreglos de longitud y tipos por posición fijos.
 *    - Etiquetadas: `[lat: number, lng: number]` (las etiquetas son
 *      documentación que aparece en el editor).
 *    - Opcionales: `[nombre: string, edad?: number]`.
 *    - Variádicas / con rest: `[encabezado: string, ...filas: number[]]` o
 *      `readonly [T, ...T[]]` para "arreglo NO vacío".
 * 4) `noUncheckedIndexedAccess`: `xs[i]` es `T | undefined`, porque el índice
 *    puede no existir. En tuplas, las posiciones conocidas siguen siendo
 *    exactas (`par[0]` es `number`). Te obliga a manejar el caso vacío.
 * 5) `as const` convierte un literal en una tupla `readonly` de literales:
 *    `['admin', 'editor'] as const` es `readonly ['admin', 'editor']`, de la
 *    que se deriva una unión con `(typeof ROLES)[number]`.
 * 6) Métodos inmutables ES2023 (`toSorted`, `toReversed`, `with`,
 *    `toSpliced`) devuelven copias y funcionan sobre `readonly T[]`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Funciones de dominio que reciben listas (`readonly Pedido[]`) y no deben
 *   mutarlas: estado de React/Redux, cachés compartidas.
 * - Tuplas como retorno múltiple: `useState` devuelve `[estado, setEstado]`;
 *   un parser puede devolver `[ok: boolean, valor: number]`.
 * - Filas de CSV o resultados SQL posicionales: `[fecha, concepto, monto]`.
 * - Coordenadas, rangos y pares clave-valor (`Object.entries` devuelve
 *   `[string, T][]`).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * const precios: number[] = [10, 20];          // equivalente a Array<number>
 * const fijos: readonly number[] = precios;    // vista de solo lectura
 * // fijos.push(30);                            // ❌ 'push' no existe en readonly
 *
 * type Punto = [lat: number, lng: number];             // tupla etiquetada
 * type Contacto = [nombre: string, telefono?: string];  // elemento opcional
 * type Fila = [id: number, ...valores: string[]];       // rest / variádica
 * type NoVacio<T> = readonly [T, ...T[]];              // al menos un elemento
 * type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];
 *
 * const ROLES = ['admin', 'editor', 'lector'] as const;
 * type Rol = (typeof ROLES)[number];           // 'admin' | 'editor' | 'lector'
 *
 * const nombres: string[] = ['Ana'];
 * const n0 = nombres[0];                       // string | undefined
 * const n0Seguro = nombres[0] ?? 'anónimo';   // string
 * const [primero = '', ...resto] = nombres;    // destructuring con default
 *
 * const ordenados = fijos.toSorted((a, b) => b - a);   // copia (ES2023)
 * const cambiado = fijos.with(0, 99);                    // copia con reemplazo
 * const limpios = [1, undefined, 3].filter((x): x is number => x !== undefined);
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Una app de finanzas personales importa el extracto bancario como
 * filas posicionales. Modelamos cada fila con una tupla etiquetada de solo
 * lectura (con categoría opcional), resumimos sin mutar el extracto y usamos
 * un tipo de "arreglo no vacío" para que el mayor gasto nunca sea `undefined`.
 *
 * type Movimiento = readonly [fecha: string, concepto: string, monto: number, categoria?: string];
 * type NoVacio<T> = readonly [T, ...T[]];
 *
 * const extracto: readonly Movimiento[] = [
 *     ['2026-10-01', 'Nómina', 3200],
 *     ['2026-10-03', 'Arriendo', -1100, 'vivienda'],
 *     ['2026-10-07', 'Supermercado', -245.5, 'comida'],
 *     ['2026-10-12', 'Freelance', 680],
 *     ['2026-10-15', 'Restaurante', -82.3, 'comida'],
 * ];
 *
 * function resumir(movs: readonly Movimiento[]): [ingresos: number, egresos: number] {
 *     let ingresos = 0;
 *     let egresos = 0;
 *     for (const [, , monto] of movs) {
 *         if (monto >= 0) ingresos += monto;
 *         else egresos += -monto;
 *     }
 *     return [ingresos, egresos];
 * }
 *
 * function esNoVacio<T>(xs: readonly T[]): xs is NoVacio<T> {
 *     return xs.length > 0;
 * }
 *
 * function mayorGasto(movs: NoVacio<Movimiento>): Movimiento {
 *     return movs.reduce((peor, m) => (m[2] < peor[2] ? m : peor)); // sin valor inicial: seguro
 * }
 *
 * const [ingresos, egresos] = resumir(extracto);
 * console.log(`Ingresos: ${ingresos.toFixed(2)} | Egresos: ${egresos.toFixed(2)}`);
 *
 * const top2 = extracto
 *     .toSorted((a, b) => a[2] - b[2])          // copia: el extracto no cambia
 *     .slice(0, 2)
 *     .map(([, concepto, monto]) => `${concepto} (${monto})`);
 * console.log(top2.join(', '));
 *
 * const sinCategoria = extracto.filter((m) => m[3] === undefined).map((m) => m[1]);
 * console.log(sinCategoria);
 * console.log(extracto[0]?.[1] ?? 'sin datos'); // índice: Movimiento | undefined
 *
 * if (esNoVacio(extracto)) {
 *     const [fecha, concepto, monto, categoria = 'general'] = mayorGasto(extracto);
 *     console.log(`Mayor gasto: ${fecha} ${concepto} ${monto} [${categoria}]`);
 * }
 *
 * // Salida esperada:
 * // Ingresos: 3880.00 | Egresos: 1427.80
 * // Arriendo (-1100), Supermercado (-245.5)
 * // [ 'Nómina', 'Freelance' ]
 * // Nómina
 * // Mayor gasto: 2026-10-03 Arriendo -1100 [vivienda]
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - RECIBE `readonly T[]` EN LOS PARÁMETROS: acepta tanto arreglos mutables
 *   como de solo lectura y prohíbe al compilador que la función los mute.
 * - `readonly` ES SUPERFICIAL Y SOLO DE COMPILACIÓN: los objetos dentro del
 *   arreglo siguen siendo mutables, y en runtime nada impide el `push`.
 *   Combina con `Readonly<T>` en los elementos o `Object.freeze` si hace falta.
 * - `sort()` y `reverse()` MUTAN: sobre un `readonly T[]` ni siquiera
 *   compilan. Usa `toSorted()`/`toReversed()` (requieren `lib` ES2023+).
 * - NO ABUSES DEL `!`: `xs[0]!` apaga `noUncheckedIndexedAccess` y vuelve a
 *   esconder el bug del arreglo vacío. Usa `?.`, `??`, guardas o `NoVacio<T>`.
 * - TUPLAS SOLO PARA DATOS CORTOS Y POSICIONALES (2–4 elementos): más allá,
 *   un objeto con propiedades con nombre es más legible y extensible.
 * - CUIDADO: UNA TUPLA MUTABLE ADMITE `push`: `[number, number]` permite
 *   `par.push(3)` sin error. Declara las tuplas como `readonly [...]`.
 * - `const xs = []` SIN TIPO ES `any[]` IMPLÍCITO EVOLUTIVO: anota el tipo.
 * - `filter(Boolean)` NO SIEMPRE ESTRECHA EL TIPO: usa un predicado explícito
 *   `(x): x is T => x !== undefined` (TS 5.5+ lo infiere en casos simples).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Carrito de solo lectura: `calcularTotal(precios: readonly number[]):
 *    number` y comprueba que dentro de la función `precios.push(1)` no compila.
 * 2. Acceso seguro: `ultimo<T>(xs: readonly T[]): T | undefined` usando
 *    `.at(-1)` y una versión con valor por defecto `ultimoO<T>(xs, porDefecto)`.
 * 3. Tupla de coordenadas: tipa `type Punto = readonly [lat: number, lng:
 *    number]` y escribe `distanciaKm(a: Punto, b: Punto): number` (Haversine).
 *
 * [Intermedio]
 * 4. Roles derivados: crea `ROLES` con `as const`, deriva `type Rol` y escribe
 *    `esRol(x: string): x is Rol` usando `ROLES.includes` sin `as any`.
 * 5. Paginación inmutable: `paginar<T>(xs: readonly T[], pagina: number,
 *    tamano: number): readonly T[]` y una función que reemplace un ítem por id
 *    con `.with()` sin mutar el original.
 * 6. Tupla de resultado: `parsearEntero(texto: string): readonly [ok: true,
 *    valor: number] | readonly [ok: false, error: string]` y estrecha el tipo
 *    leyendo la posición 0.
 * 7. Matriz tipada: `transponer(m: readonly (readonly number[])[]): number[][]`
 *    manejando filas de distinta longitud con `noUncheckedIndexedAccess`.
 *
 * [Senior / Producción]
 * 8. Arreglo no vacío: `type NoVacio<T>`; escribe `maximoPor<T>(xs:
 *    NoVacio<T>, clave: (x: T) => number): T` y un guard `esNoVacio`.
 * 9. Tuplas variádicas: implementa `concatenar<A extends unknown[], B extends
 *    unknown[]>(a: [...A], b: [...B]): [...A, ...B]` y `aplicarParcial` que
 *    fije los primeros argumentos de una función preservando los tipos.
 * 10. Lotes para una API: `enLotes<T>(xs: readonly T[], tamano: number):
 *     NoVacio<T>[]` que divida 10 000 registros en lotes de 500 y una función
 *     `zip` tipada que combine dos arreglos en tuplas `[A, B]` del largo menor.
 */

// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.

export {}; // Convierte el archivo en módulo para evitar choques de nombres entre temas.
