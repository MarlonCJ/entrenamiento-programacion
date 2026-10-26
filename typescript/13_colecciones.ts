/*
 * ============================================================================
 * TEMA 13: COLECCIONES TIPADAS (MAP, SET, RECORD, FIRMAS DE ÍNDICE Y KEYOF)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: diccionarios con contrato)
 * ----------------------------------------------------------------------------
 * Un diccionario permite buscar por clave en tiempo O(1) promedio. En
 * TypeScript hay dos familias, y elegir bien cambia lo que el compilador puede
 * comprobar:
 *
 * 1) Objetos como diccionario:
 *    - `Record<K, V>`: si `K` es una unión finita (`'admin' | 'editor'`), TS
 *      EXIGE que existan todas las claves. Ideal para tablas de configuración.
 *    - Firma de índice `{ [sku: string]: number }` o `Record<string, number>`:
 *      claves abiertas. Con `noUncheckedIndexedAccess`, leer `stock['X']` da
 *      `number | undefined`, igual que en runtime.
 * 2) `Map<K, V>` y `Set<T>`: colecciones reales de ES2015. Claves de cualquier
 *    tipo (objetos incluidos), orden de inserción garantizado, `size` en O(1)
 *    y sin herencia de `Object.prototype` (adiós al riesgo `__proto__`).
 *    `map.get(k)` SIEMPRE devuelve `V | undefined`: `has()` previo NO estrecha
 *    el tipo de `get()`, así que usa `?? valorPorDefecto`.
 * 3) `ReadonlyMap<K, V>` y `ReadonlySet<T>`: vistas sin `set`/`add`/`delete`
 *    para exponer colecciones sin permitir que el consumidor las mute.
 * 4) `keyof` y `typeof`: `keyof typeof CONFIG` deriva la unión de claves de un
 *    objeto real; `(typeof CONFIG)[keyof typeof CONFIG]` deriva sus valores.
 *    Con `as const satisfies Record<...>` validas la forma SIN perder los
 *    tipos literales.
 * 5) `WeakMap<object, V>`: claves débiles para metadatos o cachés que no
 *    deben impedir la recolección de basura.
 * 6) `Object.keys(obj)` devuelve `string[]`, no `(keyof T)[]`: TS es
 *    estructural y un objeto puede tener claves extra en runtime.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Control de acceso (RBAC): `Map<Rol, ReadonlySet<Permiso>>`.
 * - Índices en memoria por id/SKU para cruzar listas sin bucles anidados
 *   (O(n + m) en lugar de O(n · m)).
 * - Deduplicación de correos, etiquetas o ids con `Set<string>`.
 * - Tablas exhaustivas de traducciones, precios o límites por plan con
 *   `Record<Plan, Limites>`: añadir un plan nuevo rompe la compilación hasta
 *   que completes la tabla.
 * - Contadores y agrupaciones (`Map.groupBy`, `Object.groupBy`, ES2024).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * type Plan = 'gratis' | 'pro' | 'empresa';
 * const limites: Record<Plan, number> = { gratis: 1, pro: 10, empresa: 100 };
 * // Si falta 'empresa' ❌ error: Property 'empresa' is missing
 *
 * const stock: Record<string, number> = { 'SKU-1': 4 };   // claves abiertas
 * const s = stock['SKU-9'];                // number | undefined
 * interface Cabeceras { [nombre: string]: string; 'content-type': string; }
 *
 * const precios = new Map<string, number>([['cafe', 2.5], ['te', 1.8]]);
 * const p = precios.get('cafe') ?? 0;      // get(): number | undefined
 * precios.set('jugo', 3).delete('te');     // set() es encadenable
 * for (const [producto, precio] of precios) { }   // tuplas [K, V] tipadas
 *
 * const etiquetas = new Set<string>(['ts', 'node', 'ts']);  // size === 2
 * const soloLectura: ReadonlySet<string> = etiquetas;       // sin add/delete
 *
 * const CONFIG = { host: 'localhost', puerto: 5432 } as const;
 * type ClaveConfig = keyof typeof CONFIG;                  // 'host' | 'puerto'
 * function leer<K extends ClaveConfig>(k: K): (typeof CONFIG)[K] { return CONFIG[k]; }
 *
 * const porPais = Map.groupBy(clientes, (c) => c.pais);    // Map<string, Cliente[]>
 * const cache = new WeakMap<object, string>();            // claves débiles
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un panel administrativo SaaS define sus permisos en una tabla
 * `as const`, deriva de ella los tipos `Rol` y `Permiso`, construye un índice
 * `Map<Rol, ReadonlySet<Permiso>>` para autorizar en O(1) y audita las
 * solicitudes contando denegaciones por usuario.
 *
 * const PERMISOS_POR_ROL = {
 *     admin: ['leer', 'escribir', 'borrar', 'facturar'],
 *     editor: ['leer', 'escribir'],
 *     contador: ['leer', 'facturar'],
 * } as const satisfies Record<string, readonly string[]>;
 *
 * type Rol = keyof typeof PERMISOS_POR_ROL;               // 'admin' | 'editor' | 'contador'
 * type Permiso = (typeof PERMISOS_POR_ROL)[Rol][number];  // 'leer' | 'escribir' | ...
 *
 * const indice = new Map<Rol, ReadonlySet<Permiso>>();
 * for (const rol of Object.keys(PERMISOS_POR_ROL) as Rol[]) {
 *     indice.set(rol, new Set<Permiso>(PERMISOS_POR_ROL[rol]));
 * }
 *
 * function puede(rol: Rol, accion: Permiso): boolean {
 *     return indice.get(rol)?.has(accion) ?? false;     // get() puede ser undefined
 * }
 *
 * interface Solicitud { readonly usuario: string; readonly rol: Rol; readonly accion: Permiso; }
 * const solicitudes: readonly Solicitud[] = [
 *     { usuario: 'ana', rol: 'editor', accion: 'escribir' },
 *     { usuario: 'luis', rol: 'contador', accion: 'borrar' },
 *     { usuario: 'ana', rol: 'editor', accion: 'borrar' },
 *     { usuario: 'sofia', rol: 'admin', accion: 'facturar' },
 *     { usuario: 'luis', rol: 'contador', accion: 'escribir' },
 * ];
 *
 * const denegadas = new Map<string, number>();
 * const activos = new Set<string>();
 * const porRol: Record<Rol, number> = { admin: 0, editor: 0, contador: 0 };
 * for (const s of solicitudes) {
 *     activos.add(s.usuario);
 *     porRol[s.rol] += 1;
 *     if (!puede(s.rol, s.accion)) denegadas.set(s.usuario, (denegadas.get(s.usuario) ?? 0) + 1);
 * }
 *
 * console.log(denegadas);
 * console.log([...activos].join(', '));
 * console.log(porRol);
 * const comunes = [...(indice.get('editor') ?? [])].filter((p) => indice.get('contador')?.has(p));
 * console.log(comunes);
 *
 * // Salida esperada:
 * // Map(2) { 'luis' => 2, 'ana' => 1 }
 * // ana, luis, sofia
 * // { admin: 1, editor: 2, contador: 2 }
 * // [ 'leer' ]
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - `has()` NO ESTRECHA `get()`: `if (m.has(k)) m.get(k).toFixed()` falla en
 *   `strict`. Lee una vez (`const v = m.get(k); if (v !== undefined) ...`).
 * - EVITA `map.get(k)!`: el `!` oculta el caso real de clave inexistente.
 * - `Record<string, V>` SIN `noUncheckedIndexedAccess` MIENTE: dice que
 *   `obj['cualquiera']` es `V`. Activa la opción o usa `Map`.
 * - USA `Map` PARA CLAVES DINÁMICAS DE USUARIO: un objeto plano con claves
 *   como `'__proto__'` o `'constructor'` puede corromperse (prototype
 *   pollution). Si usas objeto, créalo con `Object.create(null)`.
 * - `Set` Y `Map` COMPARAN OBJETOS POR REFERENCIA: dos `{ id: 1 }` distintos
 *   son claves diferentes. Usa una clave primitiva (`id`, `JSON` estable).
 * - `Object.keys(obj) as (keyof T)[]` ES UNA ASERCIÓN: solo es segura con
 *   objetos que tú controlas (literales `as const`), no con datos externos.
 * - `JSON.stringify(new Map())` DA `'{}'`: serializa con
 *   `Object.fromEntries(map)` y reconstruye con `new Map(Object.entries(obj))`.
 * - EXPÓN `ReadonlyMap`/`ReadonlySet` desde clases y módulos para que nadie
 *   altere tu estado interno desde fuera.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Lista de invitados: con `Set<string>` elimina correos duplicados
 *    (normalizados a minúsculas) y muestra cuántos únicos hay.
 * 2. Tabla exhaustiva: `type Plan = 'gratis' | 'pro'` y `Record<Plan, {
 *    usuarios: number; precio: number }>`; añade `'empresa'` a la unión y
 *    observa el error hasta completar la tabla.
 * 3. Inventario por SKU: `Map<string, number>` con funciones `agregar(sku,
 *    cantidad)` y `retirar(sku, cantidad)` que nunca dejen stock negativo.
 *
 * [Intermedio]
 * 4. Frecuencia de palabras: `contarPalabras(texto: string): Map<string,
 *    number>` y devuelve el top 3 como `readonly [palabra: string, n:
 *    number][]` ordenado.
 * 5. Cruce eficiente: dadas `readonly Pedido[]` y `readonly Cliente[]`, crea
 *    un índice `Map<number, Cliente>` y une ambos en O(n + m).
 * 6. Configuración tipada: `const CONFIG = {...} as const` y una función
 *    `obtener<K extends keyof typeof CONFIG>(clave: K)` que devuelva el tipo
 *    exacto de cada valor.
 * 7. Operaciones de conjuntos: `union`, `interseccion` y `diferencia`
 *    genéricas sobre `ReadonlySet<T>` (o los métodos nativos de ES2025 si tu
 *    `lib` los incluye).
 *
 * [Senior / Producción]
 * 8. Caché LRU genérica: `class CacheLru<K, V>` sobre `Map` (aprovechando el
 *    orden de inserción) con capacidad máxima y `get` que refresque la clave.
 * 9. Multimapa: `class MultiMapa<K, V>` (`Map<K, Set<V>>`) con `agregar`,
 *    `quitar` y `obtener(k): ReadonlySet<V>`, usada para suscripciones a
 *    eventos por tema.
 * 10. Serialización segura: funciones `mapaAJson` y `jsonAMapa` que validen
 *     con un predicado de tipo cada entrada leída antes de reconstruir un
 *     `Map<string, Producto>`, rechazando claves `'__proto__'`.
 */

// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.

export {}; // Convierte el archivo en módulo para evitar choques de nombres entre temas.
