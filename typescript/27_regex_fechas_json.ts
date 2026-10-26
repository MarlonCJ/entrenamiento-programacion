/*
 * ============================================================================
 * TEMA 27: REGEX, FECHAS Y JSON TIPADO (VALIDAR `unknown` CON TYPE GUARDS)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: los tipos terminan en la frontera)
 * ----------------------------------------------------------------------------
 * Los tipos de TypeScript se BORRAN al compilar (type erasure). Todo dato que
 * entra desde fuera (HTTP, archivos, colas, `localStorage`) es texto sin tipo
 * real. La disciplina Senior es: parsear -> tratar como `unknown` -> validar
 * con *type guards* -> recién entonces usar el tipo del dominio.
 *
 * 1) **`JSON.parse` devuelve `any`**: `const p: Pedido = JSON.parse(txt)`
 *    compila aunque el JSON sea `"hola"`. Asigna a `unknown` y estrecha con:
 *    - `typeof v === 'string'`, `Array.isArray(v)`, `v !== null`, `'k' in v`;
 *    - predicados propios `(v: unknown): v is T` (reutilizables);
 *    - aserciones `asserts v is T` (lanzan si no cumple).
 *    En producción, librerías como Zod o Valibot generan el guard y el tipo
 *    a la vez (`z.infer<typeof Esquema>`).
 * 2) **`RegExp` es de JS, no de TS**: el compilador no valida patrones, pero sí
 *    tipa resultados: `exec()` devuelve `RegExpExecArray | null` y
 *    `match.groups` es `{ [k: string]: string } | undefined` (grupos con
 *    nombre `(?<anio>\d{4})`). Las banderas clave: `g` (global, con estado en
 *    `lastIndex`), `u`/`v` (Unicode, `\p{L}`), `i`, `m`, `s`, `d` (índices).
 * 3) **`Date` es un número**: milisegundos desde 1970-01-01 UTC. Mostrarlo en
 *    hora local depende de la zona del servidor; por eso se guarda en UTC
 *    (ISO-8601 con `Z`) y se formatea con `Intl.DateTimeFormat` + `timeZone`.
 *    El parser de V8 es permisivo: `new Date('2026-02-30T10:00:00Z')` NO falla,
 *    ¡se desborda al 2 de marzo! (La API `Temporal` llega para corregir esto.)
 * 4) **`JSON.stringify`** llama a `toJSON()` (una `Date` sale como ISO), omite
 *    `undefined` y funciones, y lanza con `BigInt` o referencias circulares.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - APIs de salud, banca o seguros que reciben JSON de terceros y deben
 *   rechazar payloads malformados ANTES de tocar la base de datos.
 * - Validar documentos, placas, códigos postales o IBAN con regex ancladas.
 * - Agendas multi-país (citas médicas, vuelos, SLA) guardadas en UTC y
 *   mostradas en la zona horaria de cada usuario.
 * - Parseo de logs y webhooks; serialización segura que oculta secretos.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // Type guard reutilizable y aserción:
 * const esObjeto = (v: unknown): v is Record<string, unknown> =>
 *     typeof v === 'object' && v !== null && !Array.isArray(v);
 *
 * function asegurarTexto(v: unknown, campo: string): asserts v is string {
 *     if (typeof v !== 'string') throw new TypeError(`${campo} debe ser texto`);
 * }
 *
 * // Uniones de literales derivadas de un arreglo `as const` (fuente única):
 * const MONEDAS = ['COP', 'USD', 'EUR'] as const;
 * type Moneda = (typeof MONEDAS)[number]; // 'COP' | 'USD' | 'EUR'
 *
 * // Regex con grupos con nombre (acceso tipado con `?.`):
 * const RE_PLACA = /^(?<letras>[A-Z]{3})-(?<numeros>\d{3})$/;
 * const letras = RE_PLACA.exec('ABC-123')?.groups?.['letras']; // string | undefined
 *
 * // Todas las coincidencias (requiere bandera g):
 * const montos = [...'Total $12.50 y $8.99'.matchAll(/\$(\d+\.\d{2})/g)].map((m) => Number(m[1]));
 *
 * // Fechas: crear en UTC y formatear en una zona concreta:
 * const cita = new Date(Date.UTC(2026, 2, 15, 14, 30)); // ¡mes base 0: 2 = marzo!
 * new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', timeStyle: 'short' }).format(cita);
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: El API de una red de clínicas recibe solicitudes de cita en JSON.
 * Se valida cada campo partiendo de `unknown`, se detectan fechas imposibles y
 * la cita aceptada se muestra en hora de Bogotá (el truco `sv-SE` produce el
 * formato `AAAA-MM-DD HH:mm`).
 *
 * const ESPECIALIDADES = ['GENERAL', 'PEDIATRIA', 'CARDIOLOGIA'] as const;
 * type Especialidad = (typeof ESPECIALIDADES)[number];
 *
 * interface Cita {
 *     readonly documento: string;
 *     readonly fecha: Date;
 *     readonly especialidad: Especialidad;
 * }
 *
 * type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };
 *
 * const RE_DOCUMENTO = /^(?<tipo>CC|TI|CE)-(?<numero>\d{6,10})$/;
 * const RE_ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
 *
 * const esObjeto = (v: unknown): v is Record<string, unknown> =>
 *     typeof v === 'object' && v !== null && !Array.isArray(v);
 *
 * const esEspecialidad = (v: unknown): v is Especialidad =>
 *     typeof v === 'string' && (ESPECIALIDADES as readonly string[]).includes(v);
 *
 * function parsearCita(json: string): Resultado<Cita> {
 *     let datos: unknown;
 *     try {
 *         datos = JSON.parse(json);
 *     } catch {
 *         return { ok: false, error: 'JSON mal formado' };
 *     }
 *     if (!esObjeto(datos)) return { ok: false, error: 'se esperaba un objeto' };
 *     const { documento, fecha, especialidad } = datos; // todos son unknown
 *     if (typeof documento !== 'string' || !RE_DOCUMENTO.test(documento)) {
 *         return { ok: false, error: 'documento inválido' };
 *     }
 *     if (typeof fecha !== 'string' || !RE_ISO_UTC.test(fecha)) {
 *         return { ok: false, error: 'fecha no es ISO-8601 UTC' };
 *     }
 *     const instante = new Date(fecha);
 *     if (instante.toISOString().slice(0, 19) !== fecha.slice(0, 19)) {
 *         return { ok: false, error: 'fecha inexistente en el calendario' };
 *     }
 *     if (!esEspecialidad(especialidad)) return { ok: false, error: 'especialidad inválida' };
 *     return { ok: true, valor: { documento, fecha: instante, especialidad } };
 * }
 *
 * const horaBogota = new Intl.DateTimeFormat('sv-SE', {
 *     timeZone: 'America/Bogota', year: 'numeric', month: '2-digit',
 *     day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
 * });
 *
 * const entradas = [
 *     '{"documento":"CC-1020304050","fecha":"2026-03-15T14:30:00Z","especialidad":"PEDIATRIA"}',
 *     '{"documento":"CC-12","fecha":"2026-03-15T14:30:00Z","especialidad":"GENERAL"}',
 *     '{"documento":"TI-998877","fecha":"2026-02-30T10:00:00Z","especialidad":"GENERAL"}',
 *     '{"documento":"CE-445566","fecha":"2026-04-01T13:00:00Z","especialidad":"ODONTOLOGIA"}',
 *     '{"documento": "CC-123456",}',
 * ];
 *
 * for (const json of entradas) {
 *     const r = parsearCita(json);
 *     if (r.ok) {
 *         const tipo = RE_DOCUMENTO.exec(r.valor.documento)?.groups?.['tipo'];
 *         console.log(`OK ${tipo} | Bogotá ${horaBogota.format(r.valor.fecha)} | ${JSON.stringify(r.valor)}`);
 *     } else {
 *         console.log('RECHAZADA:', r.error);
 *     }
 * }
 *
 * // Salida esperada:
 * // OK CC | Bogotá 2026-03-15 09:30 | {"documento":"CC-1020304050","fecha":"2026-03-15T14:30:00.000Z","especialidad":"PEDIATRIA"}
 * // RECHAZADA: documento inválido
 * // RECHAZADA: fecha inexistente en el calendario
 * // RECHAZADA: especialidad inválida
 * // RECHAZADA: JSON mal formado
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - `as Tipo` NO VALIDA NADA: `JSON.parse(txt) as Pedido` solo silencia al
 *   compilador. Si el campo `total` llega como `"100"`, sumarás textos en
 *   runtime. Valida en la frontera y deja el resto del código confiar en tipos.
 * - UN TYPE GUARD MENTIROSO ES PEOR QUE `any`: TS confía ciegamente en
 *   `v is T`; si tu predicado olvida comprobar un campo, el error aparecerá
 *   lejos y tarde. Cúbrelos con tests de casos inválidos.
 * - REGEX CON `g` TIENE ESTADO: `re.test()` avanza `re.lastIndex` y la segunda
 *   llamada sobre el mismo texto puede dar `false`. No uses `g` en regex de
 *   validación compartidas; ánclalas siempre con `^...$`.
 * - ReDoS: patrones con cuantificadores anidados como `(a+)+$` pueden tardar
 *   segundos con entradas maliciosas y bloquear el event loop. Limita la
 *   longitud de la entrada antes de evaluar la regex.
 * - `new Date('2026-03-15')` se interpreta como UTC, pero
 *   `new Date('2026-03-15T00:00')` como hora LOCAL: mismo texto aparente,
 *   instantes distintos. Usa siempre ISO completo con `Z` u offset.
 * - LOS MESES DE `Date.UTC` Y `getMonth()` EMPIEZAN EN 0, y `setDate()` muta
 *   la instancia: escribe funciones puras que devuelvan una `Date` nueva.
 * - `JSON.stringify` CON CLASES pierde métodos y campos `#privados`; define
 *   `toJSON()` y al leer reconstruye la instancia tras validar.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Bug de `lastIndex`: crea `const re = /CC-\d+/g`, llama dos veces a
 *    `re.test('CC-123')` imprimiendo `re.lastIndex` y corrígelo.
 * 2. `parsearFechaIso(texto: string): { anio: number; mes: number; dia: number } | null`
 *    con grupos con nombre y rechazo de meses o días fuera de rango.
 * 3. Type guards básicos: `esTexto`, `esNumeroFinito` (excluye `NaN` e
 *    `Infinity`) y `esArregloDe<T>(v: unknown, guard: (x: unknown) => x is T): v is T[]`.
 *
 * [Intermedio]
 * 4. `sumarMontos(texto)` que extraiga con `matchAll` todos los importes
 *    `$1.250,50` de una factura en formato latinoamericano y los sume en centavos.
 * 5. Validador de nombres Unicode con `/^\p{L}+(?:[ '-]\p{L}+)*$/u` que acepte
 *    "José Ñúñez" y "D'Angelo" y rechace dígitos.
 * 6. `asegurarProducto(v: unknown): asserts v is Producto` que acumule TODOS
 *    los errores de campo en un `AggregateError`.
 * 7. `reviver` para `JSON.parse` que convierta strings ISO-8601 con `Z` en
 *    `Date`, y una prueba que demuestre que `2026-02-30` no se convierte.
 *
 * [Senior / Producción]
 * 8. `calcularVencimientoHabil(inicioUtc: Date, diasHabiles: number, festivos: ReadonlySet<string>)`
 *    para un SLA de soporte, usando solo métodos UTC (inmune al horario de verano).
 * 9. `stringifySeguro(valor: unknown): string` con `replacer` que enmascare
 *    `password`, `cvv`, `token` y `authorization`, convierta `bigint` a texto
 *    y marque referencias circulares con un `WeakSet`.
 * 10. Mini-validador de esquemas al estilo Zod: combinadores `texto()`,
 *     `numero()`, `objeto({...})` y `arreglo(...)` y un tipo `Infer<typeof esquema>`
 *     que derive el tipo estático desde el esquema (tipos condicionales y mapeados).
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
