/*
 * ============================================================================
 * TEMA 16: RECURSIÓN, TIPOS RECURSIVOS (ÁRBOLES Y JSON) Y CALL STACK
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: datos recursivos, código recursivo)
 * ----------------------------------------------------------------------------
 * Una función recursiva se llama a sí misma sobre un problema más pequeño
 * hasta llegar a un CASO BASE que se resuelve directamente. Cada llamada
 * apila un marco (frame) en el call stack de V8; si el caso base nunca llega,
 * obtienes `RangeError: Maximum call stack size exceeded` (unos 10 000 niveles
 * por defecto). V8 NO implementa la optimización de llamada de cola (TCO),
 * aunque esté en el estándar.
 *
 * Lo que TypeScript aporta es tipar la FORMA recursiva de los datos:
 *
 * 1) Tipos recursivos: una interfaz puede referenciarse a sí misma
 *    (`interface Nodo { hijos: readonly Nodo[] }`). Así se modelan árboles de
 *    categorías, organigramas, comentarios anidados, ASTs o menús.
 * 2) Tipo `Json`: `string | number | boolean | null | Json[] | { [k: string]:
 *    Json }` describe cualquier valor serializable, mucho más preciso que `any`.
 * 3) Tipos condicionales recursivos (TS 4.1+): `DeepReadonly<T>`,
 *    `DeepPartial<T>` o `Aplanar<T>` recorren tipos anidados en compilación.
 *    El compilador tiene un límite de profundidad (~50 / 1000 niveles con
 *    recursión de cola en tipos).
 * 4) Anota el retorno de las funciones recursivas: si el retorno depende de
 *    la propia llamada, TS puede no inferirlo ("implicitly has return type
 *    'any' because it is referenced directly or indirectly...").
 * 5) Uniones discriminadas + recursión = recorridos exhaustivos: un
 *    `switch (nodo.tipo)` sobre `'archivo' | 'carpeta'` garantiza que
 *    contemplas cada clase de nodo.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Menús y categorías de e-commerce, organigramas, hilos de comentarios.
 * - Recorrer el sistema de archivos o un JSON de configuración anidado.
 * - Intérpretes y validadores: ASTs, expresiones, esquemas (Zod es recursivo).
 * - Algoritmos divide y vencerás: merge sort, quick sort, búsqueda binaria.
 * - Tipos utilitarios profundos para estados inmutables (`DeepReadonly`).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * function factorial(n: number): number {
 *     if (n < 0 || !Number.isInteger(n)) throw new RangeError('n inválido');
 *     return n <= 1 ? 1 : n * factorial(n - 1);   // caso base: n <= 1
 * }
 *
 * interface Comentario {                          // tipo recursivo
 *     readonly autor: string;
 *     readonly respuestas: readonly Comentario[];
 * }
 *
 * type Json = string | number | boolean | null | readonly Json[] | { readonly [k: string]: Json };
 *
 * type DeepReadonly<T> = T extends (...args: never[]) => unknown ? T
 *     : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;
 *
 * type Aplanar<T> = T extends readonly (infer U)[] ? Aplanar<U> : T;
 * type X = Aplanar<number[][][]>;                 // number
 *
 * type Nodo =                                      // unión discriminada recursiva
 *     | { readonly tipo: 'archivo'; readonly bytes: number }
 *     | { readonly tipo: 'carpeta'; readonly hijos: readonly Nodo[] };
 *
 * const memo = new Map<number, bigint>();          // memoización
 * function fib(n: number): bigint {
 *     if (n < 2) return BigInt(n);
 *     const guardado = memo.get(n);
 *     if (guardado !== undefined) return guardado;
 *     const r = fib(n - 1) + fib(n - 2);
 *     memo.set(n, r);
 *     return r;
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: El menú de categorías de una tienda online es un árbol de
 * profundidad variable. Necesitamos contar los productos de toda una rama,
 * construir las migas de pan (breadcrumbs) hasta una categoría, dibujar el
 * árbol indentado y medir la profundidad de un payload JSON tipado.
 *
 * interface Categoria {
 *     readonly nombre: string;
 *     readonly productos: number;
 *     readonly hijas?: readonly Categoria[];
 * }
 *
 * const catalogo: Categoria = {
 *     nombre: 'Tienda', productos: 0, hijas: [
 *         { nombre: 'Tecnología', productos: 3, hijas: [
 *             { nombre: 'Portátiles', productos: 12 },
 *             { nombre: 'Celulares', productos: 20, hijas: [{ nombre: 'Accesorios', productos: 45 }] },
 *         ] },
 *         { nombre: 'Hogar', productos: 8, hijas: [{ nombre: 'Cocina', productos: 15 }] },
 *     ],
 * };
 *
 * function contarProductos(c: Categoria): number {
 *     return c.productos + (c.hijas ?? []).reduce((acc, h) => acc + contarProductos(h), 0);
 * }
 *
 * function rutaHasta(c: Categoria, objetivo: string): readonly string[] | null {
 *     if (c.nombre === objetivo) return [c.nombre];         // caso base: encontrado
 *     for (const hija of c.hijas ?? []) {
 *         const ruta = rutaHasta(hija, objetivo);
 *         if (ruta) return [c.nombre, ...ruta];
 *     }
 *     return null;                                          // caso base: hoja sin éxito
 * }
 *
 * function dibujar(c: Categoria, nivel = 0): string[] {
 *     const linea = `${'  '.repeat(nivel)}- ${c.nombre} (${c.productos})`;
 *     return [linea, ...(c.hijas ?? []).flatMap((h) => dibujar(h, nivel + 1))];
 * }
 *
 * type Json = string | number | boolean | null | readonly Json[] | { readonly [k: string]: Json };
 * function profundidad(valor: Json): number {
 *     if (valor === null || typeof valor !== 'object') return 0;   // primitivo
 *     const hijos: readonly Json[] = Array.isArray(valor) ? valor : Object.values(valor);
 *     return 1 + Math.max(0, ...hijos.map(profundidad));
 * }
 *
 * console.log(`Productos totales: ${contarProductos(catalogo)}`);
 * console.log(rutaHasta(catalogo, 'Accesorios')?.join(' > ') ?? 'no existe');
 * console.log(rutaHasta(catalogo, 'Juguetes')?.join(' > ') ?? 'no existe');
 * console.log(dibujar(catalogo).join('\n'));
 * console.log(`Profundidad JSON: ${profundidad({ pedido: { items: [{ sku: 'A1' }] } })}`);
 *
 * // Salida esperada:
 * // Productos totales: 103
 * // Tienda > Tecnología > Celulares > Accesorios
 * // no existe
 * // - Tienda (0)
 * //   - Tecnología (3)
 * //     - Portátiles (12)
 * //     - Celulares (20)
 * //       - Accesorios (45)
 * //   - Hogar (8)
 * //     - Cocina (15)
 * // Profundidad JSON: 4
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - ESCRIBE PRIMERO EL CASO BASE y asegúrate de que cada llamada se acerque a
 *   él. Valida entradas (negativos, decimales) antes de recursar.
 * - ANOTA EL TIPO DE RETORNO en toda función recursiva para evitar `any`
 *   implícito y errores de inferencia circular.
 * - NO CONFÍES EN LA PROFUNDIDAD DE DATOS EXTERNOS: un JSON malicioso con
 *   100 000 niveles revienta la pila. Limita la profundidad o usa una pila
 *   explícita (`const pila: Nodo[] = [raiz]`) en un bucle `while`.
 * - EVITA EL TRABAJO REPETIDO: `fib` ingenuo es O(2^n). Memoiza con un `Map`
 *   o reescribe de forma iterativa.
 * - NO MUTES EL ÁRBOL MIENTRAS LO RECORRES: devuelve estructuras nuevas
 *   (`readonly` en los tipos te protege en compilación).
 * - CUIDADO CON LOS CICLOS: un grafo con referencias circulares produce
 *   recursión infinita. Lleva un `Set` de visitados.
 * - TIPOS RECURSIVOS DEMASIADO PROFUNDOS ralentizan el editor y producen
 *   "Type instantiation is excessively deep". Simplifica o limita niveles.
 * - `Math.max(...arreglo)` con arreglos enormes también desborda la pila:
 *   usa `reduce` para listas grandes.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Suma de dígitos: `sumarDigitos(n: number): number` recursiva que
 *    rechace negativos y decimales con `RangeError`.
 * 2. Potencia rápida: `potencia(base: number, exp: number): number` en
 *    O(log n) dividiendo el exponente a la mitad.
 * 3. Palíndromo: `esPalindromo(texto: string): boolean` recursivo que ignore
 *    espacios, mayúsculas y tildes.
 *
 * [Intermedio]
 * 4. Organigrama: `interface Empleado { nombre: string; salario: number;
 *    equipo: readonly Empleado[] }` y calcula la nómina total de una rama.
 * 5. Aplanar categorías: `aplanar(c: Categoria): readonly string[]` que
 *    devuelva todas las rutas completas (`'Tienda/Hogar/Cocina'`).
 * 6. Sistema de archivos: con la unión discriminada `Nodo` (archivo/carpeta)
 *    calcula el tamaño total con un `switch` exhaustivo y `never`.
 * 7. Tipo profundo: implementa `DeepPartial<T>` y úsalo para una función
 *    `fusionarConfig(base: Config, cambios: DeepPartial<Config>): Config`.
 *
 * [Senior / Producción]
 * 8. Validador JSON: `esJson(x: unknown, profundidadMax = 20): x is Json`
 *    que rechace funciones, `undefined`, `NaN` y estructuras demasiado
 *    profundas.
 * 9. Recursivo a iterativo: reescribe `contarProductos` con una pila
 *    explícita y compáralo con la versión recursiva en un árbol de 50 000
 *    niveles (observa el `RangeError` de la recursiva).
 * 10. Evaluador de expresiones: tipa un AST (`{ tipo: 'num' } | { tipo:
 *     'suma'; izq: Expr; der: Expr } | ...`) y escribe `evaluar(e: Expr):
 *     number` e `imprimir(e: Expr): string` exhaustivos.
 */

// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.

export {}; // Convierte el archivo en módulo para evitar choques de nombres entre temas.
