/*
 * ============================================================================
 * TEMA 02: CONSTANTES, READONLY, AS CONST, SATISFIES E INMUTABILIDAD REAL
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: inmutabilidad en compilación
 *    vs en runtime)
 * ----------------------------------------------------------------------------
 * En TypeScript existen DOS niveles de "constante" y confundirlos es la fuente
 * de muchos bugs:
 *
 * 1) **`const` (JavaScript, runtime)**: impide REASIGNAR el enlace, no mutar el
 *    valor. `const carrito = []; carrito.push(x)` es válido. El objeto sigue
 *    siendo mutable en el heap.
 * 2) **`readonly`, `Readonly<T>`, `ReadonlyArray<T>` (TypeScript, compilación)**:
 *    el compilador prohíbe escribir propiedades o llamar `push`/`splice`. Por
 *    el borrado de tipos, en runtime NO hay ninguna protección: cualquier
 *    código JS (o un `as`) puede mutarlo. Además son SUPERFICIALES.
 * 3) **`as const` (aserción constante)**: convierte un literal en su versión
 *    más estrecha y de solo lectura: strings y números pasan a tipos literales,
 *    arrays a tuplas `readonly`, y objetos a propiedades `readonly` en TODOS
 *    los niveles (a nivel de tipos). Base de las "enums" modernas.
 * 4) **`satisfies` (TS 4.9+)**: verifica que un valor cumple un tipo SIN
 *    ensanchar su tipo inferido. `as const satisfies T` (TS 5.0+) da a la vez
 *    validación y tipos literales.
 * 5) **`Object.freeze` (runtime)**: congela el objeto de verdad (en modo
 *    estricto, escribir lanza `TypeError`), pero solo el primer nivel. TS lo
 *    refleja devolviendo `Readonly<T>`.
 * 6) **`enum`**: genera un objeto real en runtime (no se borra). Hoy se
 *    prefieren uniones de literales u objetos `as const`; `const enum` choca
 *    con `isolatedModules` y los transpiladores rápidos.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Catálogos de planes SaaS, tasas de impuestos o códigos de error: objetos
 *   `as const` de los que se derivan los tipos (`keyof typeof PLANES`).
 * - Estado en Redux / Zustand / NgRx: `Readonly<Estado>` para obligar a crear
 *   copias en lugar de mutar (requisito para detectar cambios).
 * - Configuración cargada al arrancar un microservicio: congelada con
 *   `Object.freeze` (o un `deepFreeze`) para que ningún módulo la altere.
 * - Parámetros de funciones: `readonly Producto[]` documenta y garantiza que
 *   la función no reordenará ni modificará el arreglo del llamador.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * const IVA = 0.19;                              // tipo literal 0.19
 * const MAX_REINTENTOS = 3 as const;             // ya era literal; explícito
 *
 * const ESTADOS = ['pendiente', 'pagado', 'enviado'] as const;
 * type EstadoPedido = (typeof ESTADOS)[number];  // 'pendiente' | 'pagado' | 'enviado'
 *
 * interface Factura {
 *     readonly numero: string;                   // no reasignable tras crear
 *     lineas: readonly number[];                 // sin push/pop/sort
 * }
 * type FacturaCongelada = Readonly<Factura>;     // readonly superficial
 *
 * class Cuenta {
 *     readonly iban: string;                     // asignable solo en el constructor
 *     static readonly COMISION = 1.5;
 *     constructor(iban: string) { this.iban = iban; }
 * }
 *
 * const RUTAS = {
 *     inicio: '/',
 *     perfil: '/perfil',
 * } satisfies Record<string, `/${string}`>;      // valida sin perder literales
 *
 * const precios: readonly number[] = [30, 10, 20];
 * const ordenados = precios.toSorted((a, b) => a - b);   // ES2023: copia
 * // precios.sort();                             // Error: no existe en readonly
 *
 * type ProfundoReadonly<T> = {
 *     readonly [K in keyof T]: T[K] extends object ? ProfundoReadonly<T[K]> : T[K];
 * };
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un SaaS de facturación cotiza suscripciones anuales a partir de
 * un catálogo de planes inmutable, y demuestra los límites de `Object.freeze`.
 *
 * const PLANES = {
 *     basico: { precioMensual: 9, usuarios: 3 },
 *     pro: { precioMensual: 29, usuarios: 10 },
 *     empresa: { precioMensual: 99, usuarios: 50 },
 * } as const satisfies Record<string, { precioMensual: number; usuarios: number }>;
 *
 * type NombrePlan = keyof typeof PLANES;          // 'basico' | 'pro' | 'empresa'
 *
 * const DESCUENTO_ANUAL = 0.2;
 * const PRECIO_ASIENTO_EXTRA = 5;
 *
 * function cotizarAnual(plan: NombrePlan, asientosExtra: number): string {
 *     const { precioMensual, usuarios } = PLANES[plan];
 *     const bruto = (precioMensual + asientosExtra * PRECIO_ASIENTO_EXTRA) * 12;
 *     const total = bruto * (1 - DESCUENTO_ANUAL);
 *     return `${plan}: ${usuarios + asientosExtra} usuarios -> ${total.toFixed(2)} USD/año`;
 * }
 *
 * const pedidos: ReadonlyArray<readonly [NombrePlan, number]> = [
 *     ['basico', 0],
 *     ['pro', 2],
 *     ['empresa', 5],
 * ];
 * for (const [plan, extra] of pedidos) console.log(cotizarAnual(plan, extra));
 * // cotizarAnual('premium', 1);   // Error de compilación: no es NombrePlan
 *
 * const CONFIG = Object.freeze({ region: 'us-east-1', limites: { rps: 100 } });
 * CONFIG.limites.rps = 500;        // compila y funciona: freeze es superficial
 * console.log(CONFIG.limites.rps, Object.isFrozen(CONFIG), Object.isFrozen(CONFIG.limites));
 * try {
 *     (CONFIG as { region: string }).region = 'eu-west-1';  // 'as' engaña a TS...
 * } catch (e) {
 *     console.log((e as Error).constructor.name, CONFIG.region); // ...no al runtime
 * }
 *
 * // Salida esperada (módulo ESM, modo estricto):
 * // basico: 3 usuarios -> 86.40 USD/año
 * // pro: 12 usuarios -> 374.40 USD/año
 * // empresa: 55 usuarios -> 1190.40 USD/año
 * // 500 true false
 * // TypeError us-east-1
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - `const` NO ES INMUTABILIDAD: solo protege el enlace. Para datos usa
 *   `readonly` en los tipos y, si debe garantizarse en runtime, `Object.freeze`.
 * - `readonly` SE PUEDE ESQUIVAR: TS permite asignar un `Readonly<T>` a una
 *   variable de tipo `T` mutable (la compatibilidad ignora `readonly` en
 *   propiedades). No lo uses como frontera de seguridad.
 * - `Object.freeze` ES SUPERFICIAL y en código no estricto (scripts CommonJS
 *   sin `'use strict'`) falla EN SILENCIO. Los módulos ESM siempre son
 *   estrictos. Para objetos anidados implementa un `deepFreeze` recursivo.
 * - PREFIERE UNIONES O `as const` A `enum`: los `enum` numéricos aceptan
 *   cualquier número en versiones antiguas y generan código extra; las uniones
 *   de literales se borran por completo y se autocompletan igual de bien.
 * - NO ABUSES DE `as const` EN DATOS DINÁMICOS: úsalo en catálogos y
 *   configuración fijos; para estructuras que cambian te encierra en literales.
 * - USA `satisfies` EN VEZ DE ANOTAR: `const x: Record<string, Ruta> = {...}`
 *   pierde las claves concretas; `satisfies` valida y las conserva.
 * - CONVENCIÓN: `UPPER_SNAKE_CASE` para constantes globales de configuración;
 *   `camelCase` para `const` locales que simplemente no se reasignan.
 * - MÉTODOS INMUTABLES ES2023 (`toSorted`, `toReversed`, `toSpliced`, `with`)
 *   requieren `lib: ["ES2023"]` y Node 20+; combinan perfecto con `readonly`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Constantes de nómina: declara `SALARIO_MINIMO`, `AUXILIO_TRANSPORTE` y
 *    `HORAS_SEMANALES` y calcula el costo mensual de un empleado. Intenta
 *    reasignar una y anota el mensaje de error del compilador.
 * 2. `const` vs mutación: crea `const carrito: string[] = []`, añade 3
 *    productos con `push` y explica por qué compila. Luego cambia el tipo a
 *    `readonly string[]` y observa qué deja de compilar.
 * 3. Estados de envío con `as const`: crea `ESTADOS_ENVIO` como arreglo
 *    `as const`, deriva el tipo `EstadoEnvio` y escribe
 *    `describirEstado(e: EstadoEnvio): string`.
 *
 * [Intermedio]
 * 4. Clase `Transferencia` con `readonly id`, `readonly monto` y
 *    `readonly fecha`, más un método `conMonto(nuevo: number): Transferencia`
 *    que devuelva una copia en lugar de mutar.
 * 5. `enum` vs unión: implementa los roles de un sistema de RR. HH. con un
 *    `enum Rol` y con una unión de literales. Compara el JavaScript generado
 *    (usa el playground de TS) y anota las diferencias.
 * 6. Catálogo con `satisfies`: define `CODIGOS_ERROR` (`'E001': { http: 404,
 *    mensaje: '...' }`, etc.) validado con `satisfies Record<string, {...}>` y
 *    deriva `type CodigoError = keyof typeof CODIGOS_ERROR`.
 * 7. Arreglos inmutables: dado `readonly Pedido[]`, obtén una versión ordenada
 *    por fecha con `toSorted` y otra con el tercer elemento reemplazado con
 *    `with`, demostrando que el original no cambia.
 *
 * [Senior / Producción]
 * 8. `deepFreeze<T>(obj: T): ProfundoReadonly<T>` recursivo que congele
 *    objetos y arreglos anidados. Demuestra en modo estricto que mutar un
 *    nivel profundo lanza `TypeError` y que el tipo también lo impide.
 * 9. Reductor de estado inmutable: tipa `Readonly<EstadoCarrito>` y un
 *    `reducer(estado, accion)` con acciones `agregar`, `quitar` y `vaciar`
 *    que siempre devuelva un objeto nuevo. Verifica con `Object.is` que una
 *    acción sin efecto devuelve la MISMA referencia.
 * 10. Configuración blindada: escribe `cargarConfig(env: NodeJS.ProcessEnv)`
 *     que valide, convierta y devuelva un objeto `deepFreeze` tipado como
 *     `ProfundoReadonly<Config>`; incluye un `Proxy` que lance un error
 *     descriptivo al leer una clave inexistente.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
