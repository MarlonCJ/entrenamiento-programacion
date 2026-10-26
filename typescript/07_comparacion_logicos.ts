/*
 * ============================================================================
 * TEMA 07: COMPARACIÓN ESTRICTA, OPERADORES LÓGICOS, ?? Y NARROWING
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: el compilador vigila, el runtime decide)
 * ----------------------------------------------------------------------------
 * TypeScript compila a JavaScript y BORRA los tipos (type erasure): en runtime
 * las comparaciones se ejecutan con las reglas de JS. Lo que aporta TS es que
 * analiza cada comparación ANTES de ejecutarla:
 *
 * 1) **`===` / `!==` (igualdad estricta)**: sin coerción. Objetos y arreglos se
 *    comparan por REFERENCIA (misma instancia en el heap), no por contenido.
 *    Casos IEEE 754: `NaN === NaN` es `false` y `+0 === -0` es `true`.
 *    `Object.is(a, b)` corrige ambos (SameValue).
 * 2) **`==` sigue existiendo y sigue coercionando**. TS reduce el daño porque
 *    rechaza comparar tipos sin solapamiento: `if (edad === '18')` con
 *    `edad: number` da el error TS2367 "This comparison appears to be
 *    unintentional because the types 'number' and 'string' have no overlap".
 *    Desde TS 4.9, `x === NaN` también es error (usa `Number.isNaN(x)`).
 * 3) **`&&`, `||` y `??` devuelven un OPERANDO, no un boolean**, y TS lo tipa
 *    así: `const r = nombre || 0;` con `nombre: string` es `string | number`.
 *    - `||` cae al valor por defecto con CUALQUIER falsy: `0`, `''`, `NaN`,
 *      `false`, `null`, `undefined`, `0n`.
 *    - `??` (nullish) SOLO cae con `null` o `undefined`: respeta `0` y `''`.
 * 4) **Narrowing (estrechamiento)**: cada comparación es también información de
 *    tipos. Tras `if (valor !== null)`, `typeof x === 'string'`, `'campo' in obj`
 *    o `if (usuario)`, TS reduce la unión dentro de esa rama. La idiomática
 *    `x != null` (con `!=`) es la ÚNICA excepción aceptada a la regla de no usar
 *    `==`: descarta `null` y `undefined` a la vez.
 * 5) **Cortocircuito**: `a && f()` no ejecuta `f` si `a` es falsy; TS lo sabe y
 *    estrecha: en `u && u.email`, `u` ya no es `undefined` a la derecha.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Control de acceso en SaaS: combinar plan, verificación de email y bloqueo
 *   por intentos en booleanos con nombre (`planDePago`, `cuentaSegura`).
 * - Configuración con valores por defecto: `config.timeoutMs ?? 5000` sin
 *   pisar un `0` intencional (por ejemplo, "sin timeout").
 * - Validar respuestas de APIs (`unknown`) con guards antes de usarlas.
 * - Detección de cambios en estados de UI/Redux con `Object.is` o `===` por
 *   referencia (inmutabilidad).
 * - Ordenar nombres de pacientes o productos con `localeCompare` (tildes y ñ).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * const esAdulto: boolean = edad >= 18;
 * const enRango = temperatura >= 2 && temperatura <= 8; // cadena de frío
 * const fueraDeRango = !enRango;
 *
 * // || vs ?? (el tipo resultante incluye ambos operandos)
 * const reintentos = config.reintentos ?? 3;   // 0 se respeta
 * const titulo = entrada.trim() || 'Sin título'; // '' cae al defecto
 * config.cache ??= new Map();                    // asignación lógica (ES2021)
 *
 * // Narrowing con comparaciones
 * function largo(valor: string | number | null): number {
 *     if (valor == null) return 0;             // null | undefined fuera
 *     if (typeof valor === 'string') return valor.length; // string aquí
 *     return String(valor).length;             // number aquí
 * }
 *
 * // Igualdad de referencia vs contenido
 * [1, 2] === [1, 2];                 // false: dos instancias distintas
 * Object.is(NaN, Number('x'));       // true
 * Number.isNaN(Number('x'));         // true (preferible a x === NaN)
 *
 * // Comparar strings: < usa unidades UTF-16, no el alfabeto español
 * 'ñandú'.localeCompare('nube', 'es'); // > 0, ñ va después de n
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Una plataforma SaaS decide qué usuarios pueden exportar reportes y
 * cuál es su límite de proyectos, mostrando la diferencia real entre ?? y ||.
 *
 * type Plan = 'free' | 'pro' | 'enterprise';
 *
 * interface Usuario {
 *     nombre: string;
 *     plan: Plan;
 *     emailVerificado: boolean;
 *     intentosFallidos: number;
 *     limiteProyectos?: number | null;
 *     apodo?: string;
 * }
 *
 * function puedeExportar(u: Usuario): boolean {
 *     const planDePago = u.plan === 'pro' || u.plan === 'enterprise';
 *     const cuentaSegura = u.emailVerificado && u.intentosFallidos < 5;
 *     return planDePago && cuentaSegura;
 * }
 *
 * const limiteEfectivo = (u: Usuario): number => u.limiteProyectos ?? 3;
 *
 * const usuarios: Usuario[] = [
 *     { nombre: 'Ana', plan: 'pro', emailVerificado: true, intentosFallidos: 0, limiteProyectos: 0 },
 *     { nombre: 'Luis', plan: 'free', emailVerificado: true, intentosFallidos: 1, apodo: '' },
 *     { nombre: 'Marta', plan: 'enterprise', emailVerificado: false, intentosFallidos: 6, limiteProyectos: null },
 * ];
 *
 * for (const u of usuarios) {
 *     const etiqueta = u.apodo || u.nombre; // '' es falsy: se usa el nombre
 *     console.log(`${etiqueta}: exportar=${puedeExportar(u)} | ?? -> ${limiteEfectivo(u)} | || -> ${u.limiteProyectos || 3}`);
 * }
 *
 * console.log(Object.is(-0, 0), -0 === 0, Object.is(NaN, 0 / 0));
 * console.log('9' > '100', Number('9') > Number('100'));
 *
 * // Salida esperada:
 * // Ana: exportar=true | ?? -> 0 | || -> 3
 * // Luis: exportar=false | ?? -> 3 | || -> 3
 * // Marta: exportar=false | ?? -> 3 | || -> 3
 * // false true true
 * // true false
 *
 * (Ana tiene límite 0 a propósito, por ejemplo "cuenta congelada": con || se le
 * asignarían 3 proyectos por error. Por eso `??` es el defecto correcto para
 * números y strings que pueden ser 0 o vacíos.)
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - ACTIVA `eqeqeq` EN ESLINT (con la opción `null: 'ignore'` si aceptas el
 *   idioma `x != null`). TS no prohíbe `==` entre tipos compatibles.
 * - LOS TIPOS NO EXISTEN EN RUNTIME: si un JSON trae `"edad": "18"` y lo
 *   tipaste como `number` con `as`, TS no te avisará y `edad >= 18` comparará
 *   con coerción. Valida en la frontera (guards o Zod) en vez de usar `as`.
 * - `'9' > '100'` ES `true`: entre strings, `<`/`>` comparan unidades UTF-16.
 *   Convierte a número antes de comparar rangos; para texto usa `localeCompare`.
 * - NO COMPARES OBJETOS, ARREGLOS NI `Date` CON `===` esperando igualdad de
 *   contenido: compara `fecha.getTime()` o escribe un comparador.
 * - NO MEZCLES `??` CON `||` O `&&` SIN PARÉNTESIS: `a ?? b || c` es un
 *   SyntaxError en JS. Escribe `(a ?? b) || c`.
 * - PRECEDENCIA: `!` > `&&` > `||`. Aunque la sepas, pon paréntesis al mezclar
 *   `&&` y `||` y extrae subcondiciones a constantes con nombre.
 * - EVITA LA DOBLE NEGACIÓN COMO DOCUMENTACIÓN: `!!valor` funciona, pero
 *   `valor !== undefined` o `Boolean(valor)` explican mejor la intención.
 * - CUIDADO CON `if (cantidad)` PARA NARROWING: también descarta el `0`
 *   legítimo. Usa `cantidad !== undefined`.
 * - LEYES DE DE MORGAN: `!(a || b)` equivale a `!a && !b`; prefiere la forma
 *   positiva y legible.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Tabla de igualdades: imprime con `console.table` la comparación con `==`,
 *    `===` y `Object.is` de los pares `(0, -0)`, `(NaN, NaN)`, `(null,
 *    undefined)` y `('', 0)`. Para el último par, comprueba qué error da TS y
 *    rodéalo tipando los operandos como `unknown`.
 * 2. `estaEnRango(valor: number, min: number, max: number): boolean`
 *    inclusivo, que lance `RangeError` si `min > max` y devuelva `false` con NaN.
 * 3. `aNumeroSeguro(texto: string): number | null` y úsala para corregir una
 *    función `esMayorDeEdad(edadTexto: string)` que comparaba strings.
 *
 * [Intermedio]
 * 4. Predicción de cortocircuito: anota el TIPO que infiere TS y el VALOR de
 *    `0 || null || 'OK'`, `'paso' && 42 && ''` y `0 ?? 'defecto'`; compruébalo.
 * 5. Configuración con defaults: `resolverConfig(parcial: Partial<Config>)`
 *    usando `??` para `timeoutMs`, `reintentos` y `prefijo`, con un test que
 *    demuestre que `0` y `''` se respetan.
 * 6. Guard de tipo: `esUsuario(valor: unknown): valor is Usuario` que valide
 *    cada propiedad con `typeof` e `in`, y úsala sobre un `JSON.parse`.
 * 7. De Morgan: refactoriza `!(!u.emailVerificado || u.suspendido ||
 *    u.intentosFallidos >= 5)` a su forma positiva y prueba ambas con 8 casos.
 *
 * [Senior / Producción]
 * 8. `sonIgualesProfundo(a: unknown, b: unknown): boolean` recursiva para
 *    primitivos, arreglos, objetos planos, `Date` y `Map`, usando `Object.is`
 *    en las hojas. Escribe pruebas con Vitest o `node:test`.
 * 9. `camposModificados<T extends object>(antes: T, despues: T): (keyof T)[]`
 *    con comparación superficial `Object.is`, pensada para auditoría de
 *    cambios en un CRM.
 * 10. Motor de reglas antifraude: define `type Regla = { nombre: string;
 *     rechaza: (t: Transaccion) => boolean }` y una función que evalúe una
 *     lista con cortocircuito (`Array.prototype.find`) y devuelva la primera
 *     regla que rechazó la operación o `null`, con su tipo exacto.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
