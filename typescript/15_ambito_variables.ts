/*
 * ============================================================================
 * TEMA 15: ÁMBITO LÉXICO, CLOSURES TIPADOS Y ESTADO ENCAPSULADO
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: cajas anidadas que recuerdan)
 * ----------------------------------------------------------------------------
 * El ámbito (scope) decide dónde existe un nombre. TypeScript usa EXACTAMENTE
 * las reglas de JavaScript (es un superconjunto): ámbito léxico, decidido por
 * dónde está escrito el código, no por dónde se llama. Lo que TS añade es
 * verificación estática de esas reglas y tipos para lo que se captura:
 *
 * 1) Niveles: módulo (cada archivo con `import`/`export` tiene su propio
 *    ámbito; por eso cada tema termina en `export {}`), función y bloque
 *    (`let`/`const` dentro de `{ }`, `if`, `for`). `var` ignora los bloques:
 *    no lo uses.
 * 2) TDZ (zona muerta temporal): usar un `let`/`const` antes de su
 *    declaración lanza `ReferenceError`; TS lo detecta en compilación
 *    ("Block-scoped variable used before its declaration").
 * 3) Closure: una función recuerda las variables del ámbito donde nació,
 *    aunque ese ámbito ya haya terminado. Es la forma más simple de tener
 *    ESTADO PRIVADO real en runtime (los `private` de TS se borran).
 * 4) Closures tipados: la fábrica declara un tipo de retorno (interfaz o tipo
 *    de función) y TS infiere los parámetros de los métodos devueltos. Los
 *    genéricos (`crearStore<S>`) se capturan igual que los valores.
 * 5) Estrechamiento y closures: una variable `const` estrechada conserva su
 *    tipo dentro del callback; con `let` reasignada TS no puede garantizarlo
 *    (desde TS 5.4 lo conserva si no hay asignaciones posteriores).
 * 6) Global: `globalThis` y `declare global { ... }` para ampliar tipos
 *    globales. Contaminar el global es una mala práctica; usa módulos.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Stores y estado de UI (Zustand, Redux) construidos con closures.
 * - Fábricas de middlewares y validadores configurables
 *   (`crearLimitador({ maxPorMinuto: 60 })`).
 * - Memoización, `debounce` y `throttle`, que guardan estado entre llamadas.
 * - Funciones para desuscribirse (`const cancelar = bus.on(...)`), patrón de
 *   `useEffect`, Node `EventEmitter` y RxJS.
 * - Configuración por petición sin variables globales mutables.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * const IVA = 0.19;                          // ámbito de módulo (no global)
 * function precioFinal(base: number): number {
 *     const total = base * (1 + IVA);         // ámbito de función
 *     if (total > 100) {
 *         const descuento = 5;                // ámbito de bloque
 *         return total - descuento;
 *     }
 *     return total;                           // `descuento` no existe aquí
 * }
 *
 * function crearContador(inicio = 0): { siguiente(): number; reiniciar(): void } {
 *     let cuenta = inicio;                    // privado de verdad (closure)
 *     return {
 *         siguiente: () => ++cuenta,
 *         reiniciar: () => { cuenta = inicio; },
 *     };
 * }
 *
 * type Formateador = (monto: number) => string;
 * const crearFormateador = (moneda: 'USD' | 'COP'): Formateador =>
 *     (monto) => `${moneda} ${monto.toFixed(2)}`;    // `monto` inferido
 *
 * declare global { interface Window { __VERSION__: string } }  // ampliar globales
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: El carrito de un e-commerce usa un mini store genérico (estilo
 * Zustand). El estado vive en un closure, por lo que nadie puede modificarlo
 * sin pasar por `actualizar`; los oyentes reciben el estado nuevo y el
 * anterior, y `suscribir` devuelve otro closure para cancelar la suscripción.
 *
 * type Oyente<S> = (estado: Readonly<S>, anterior: Readonly<S>) => void;
 * interface Store<S> {
 *     obtener(): Readonly<S>;
 *     actualizar(cambio: (actual: Readonly<S>) => S): void;
 *     suscribir(oyente: Oyente<S>): () => void;
 * }
 *
 * function crearStore<S>(inicial: S): Store<S> {
 *     let estado = inicial;                       // solo existe en este closure
 *     const oyentes = new Set<Oyente<S>>();
 *     return {
 *         obtener: () => estado,
 *         actualizar(cambio) {                    // `cambio` se infiere de Store<S>
 *             const anterior = estado;
 *             estado = cambio(estado);
 *             oyentes.forEach((o) => o(estado, anterior));
 *         },
 *         suscribir(oyente) {
 *             oyentes.add(oyente);
 *             return () => { oyentes.delete(oyente); };
 *         },
 *     };
 * }
 *
 * interface Carrito { readonly items: number; readonly total: number; }
 * const carrito = crearStore<Carrito>({ items: 0, total: 0 });
 *
 * const cancelar = carrito.suscribir((e, a) =>
 *     console.log(`items ${a.items} -> ${e.items} | total ${e.total}`));
 * carrito.actualizar((c) => ({ items: c.items + 1, total: c.total + 25 }));
 * carrito.actualizar((c) => ({ items: c.items + 2, total: c.total + 40 }));
 * cancelar();
 * carrito.actualizar((c) => ({ ...c, total: c.total * 0.9 }));   // ya nadie escucha
 * console.log(carrito.obtener());
 * // console.log(estado);   // ❌ Cannot find name 'estado'
 *
 * const lectores: Array<() => number> = [];
 * for (let i = 0; i < 3; i++) lectores.push(() => i);  // `let`: un `i` por vuelta
 * console.log(lectores.map((f) => f()));
 *
 * function prepararSaludo(nombre: string | null): () => string {
 *     const n = nombre ?? 'invitado';             // `const`: el tipo string se conserva
 *     return () => `Hola, ${n.toUpperCase()}`;
 * }
 * console.log(prepararSaludo(null)());
 *
 * // Salida esperada:
 * // items 0 -> 1 | total 25
 * // items 1 -> 3 | total 65
 * // { items: 3, total: 58.5 }
 * // [ 0, 1, 2 ]
 * // Hola, INVITADO
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA `var`: con `var` en el bucle anterior, los tres lectores devolverían
 *   `3`, porque comparten una sola variable de función.
 * - `private` DE TS NO ES PRIVACIDAD EN RUNTIME: se borra al compilar y se
 *   puede leer con `obj['campo']`. Para secretos usa closures o `#campos`.
 * - EVITA EL ESTADO MUTABLE A NIVEL DE MÓDULO: un `let contador` exportado
 *   se comparte entre todas las peticiones de un servidor Node (fugas de
 *   datos entre usuarios). Crea el estado por petición con fábricas.
 * - CUIDADO CON LAS FUGAS DE MEMORIA: un closure mantiene vivo todo lo que
 *   captura. Ofrece siempre una función de cancelación y llámala (listeners,
 *   intervalos, suscripciones).
 * - SHADOWING CONFUSO: declarar `const total` dentro de un bloque cuando
 *   ya existe otro `total` fuera compila, pero confunde. Usa nombres
 *   distintos (ESLint: `no-shadow`).
 * - ESTRECHAMIENTO PERDIDO EN CALLBACKS: si estrechas un `let` y luego lo
 *   reasignas, dentro del callback vuelve a su tipo amplio. Copia el valor
 *   estrechado a una `const` antes de crear el closure.
 * - ANOTA EL TIPO DE RETORNO DE LAS FÁBRICAS: una interfaz explícita
 *   (`Store<S>`) documenta la API pública y oculta los detalles internos.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Mapa de ámbitos: escribe una función con variables de módulo, función y
 *    bloque, e intenta usar una variable fuera de su bloque; anota el error de
 *    TS en un comentario.
 * 2. Contador privado: `crearContador(paso = 1)` que devuelva `{ incrementar,
 *    valor }` tipados; comprueba que dos contadores no comparten estado.
 * 3. TDZ: provoca el error "used before its declaration" y explica por qué
 *    `var` en el mismo caso imprimiría `undefined`.
 *
 * [Intermedio]
 * 4. Formateador configurable: `crearFormateador(locale: string, moneda:
 *    string): (monto: number) => string` usando `Intl.NumberFormat` creado
 *    una sola vez en el closure.
 * 5. Generador de ids: `` crearGeneradorIds<P extends string>(prefijo: P):
 *    () => `${P}-${number}` `` que produzca `'FAC-1'`, `'FAC-2'`...
 * 6. Una sola vez: `unaVez<A extends unknown[], R>(fn: (...args: A) => R)`
 *    que ejecute `fn` solo la primera vez y devuelva el resultado cacheado.
 * 7. Bus de eventos: `crearBus<Eventos extends Record<string, unknown>>()`
 *    con `on(nombre, handler)` que devuelva la función de cancelación y
 *    `emit(nombre, payload)` con payload tipado según el evento.
 *
 * [Senior / Producción]
 * 8. Limitador de tasa: `crearLimitador({ max, ventanaMs })` que devuelva
 *    `(clave: string) => boolean`, guardando marcas de tiempo en un
 *    `Map<string, number[]>` dentro del closure.
 * 9. `debounce` tipado: `debounce<A extends unknown[]>(fn: (...args: A) =>
 *    void, ms: number)` con método `cancelar()` y sin `any`.
 * 10. Contexto por petición: simula un servidor que atiende 3 peticiones
 *     concurrentes y demuestra la fuga de datos con un `let` de módulo;
 *     corrígelo con una fábrica de contexto (o `AsyncLocalStorage` de Node).
 */

// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.

export {}; // Convierte el archivo en módulo para evitar choques de nombres entre temas.
