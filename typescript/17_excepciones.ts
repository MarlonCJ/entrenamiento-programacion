/*
 * ============================================================================
 * TEMA 17: ERRORES TIPADOS, CATCH UNKNOWN, ERRORES PROPIOS Y PATRÓN RESULT
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: los fallos también tienen tipo)
 * ----------------------------------------------------------------------------
 * En runtime TypeScript usa el mecanismo de JavaScript: `throw` interrumpe el
 * flujo y la excepción sube por el call stack hasta un `try/catch`; `finally`
 * se ejecuta siempre. Pero hay un detalle que TS hace explícito: en JS se
 * puede lanzar CUALQUIER valor (`throw 'texto'`, `throw 404`), así que:
 *
 * 1) `catch (e)` es `unknown` en modo `strict` (`useUnknownInCatchVariables`).
 *    Debes estrechar antes de usarlo: `e instanceof Error`, `instanceof
 *    ErrorValidacion` o un predicado propio. Nunca asumas que es `Error`.
 * 2) TS NO tiene excepciones comprobadas (no hay `throws` en las firmas): el
 *    tipo de una función no dice qué puede lanzar. Documenta con `@throws` o
 *    haz el error visible en el tipo de retorno.
 * 3) Clases de error propias: `class ErrorValidacion extends Error` con
 *    `override readonly name` y propiedades tipadas (`campo`, `codigo`,
 *    `estadoHttp`). Permiten ramificar con `instanceof` y mapear a respuestas
 *    HTTP. Con `target` ES2015+ `instanceof` funciona sin trucos.
 * 4) `cause` (ES2022): `new Error('mensaje', { cause: errorOriginal })`
 *    encadena el error de bajo nivel sin perder el stack. Requiere `lib`
 *    ES2022+ (tipo `ErrorOptions`).
 * 5) Patrón `Result<T, E>`: una unión discriminada `{ ok: true; valor: T } |
 *    { ok: false; error: E }` convierte los errores ESPERADOS (validación,
 *    "no encontrado") en valores que el compilador obliga a revisar. Reserva
 *    `throw` para lo excepcional (BD caída, bug, invariante rota).
 * 6) `never` y `asserts`: `function fallar(msg): never` y `asserts x is T`
 *    ayudan al análisis de flujo tras lanzar.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - APIs REST: un middleware traduce `ErrorValidacion` → 400,
 *   `ErrorNoEncontrado` → 404 y cualquier otro → 500 sin filtrar detalles.
 * - Importaciones masivas (CSV, Excel): `Result` por fila para reportar
 *   todas las filas inválidas sin abortar el lote.
 * - Integraciones con pasarelas de pago o BD: envolver errores técnicos en
 *   errores de dominio con `cause` para el log y un mensaje limpio al usuario.
 * - `finally` para liberar recursos: conexiones, archivos, locks, spinners.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * try {
 *     JSON.parse('{mal json');
 * } catch (e: unknown) {                          // nunca `any`
 *     const mensaje = e instanceof Error ? e.message : String(e);
 *     console.error(mensaje);
 * } finally {
 *     console.log('siempre se ejecuta');
 * }
 *
 * class ErrorNoEncontrado extends Error {
 *     override readonly name = 'ErrorNoEncontrado';
 *     constructor(readonly recurso: string, readonly id: string, options?: ErrorOptions) {
 *         super(`${recurso} ${id} no existe`, options);
 *     }
 * }
 *
 * throw new Error('Fallo al cobrar', { cause: errorDeRed });   // ES2022
 *
 * type Result<T, E = Error> =
 *     | { readonly ok: true; readonly valor: T }
 *     | { readonly ok: false; readonly error: E };
 *
 * function esErrorConCodigo(e: unknown): e is Error & { code: string } {
 *     return e instanceof Error && typeof (e as { code?: unknown }).code === 'string';
 * }
 * // Útil con errores de Node: if (esErrorConCodigo(e) && e.code === 'ENOENT') ...
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un CRM importa usuarios por lote. Las filas inválidas son errores
 * ESPERADOS y se modelan con `Result` (no abortan el lote). Un fallo de base de
 * datos es EXCEPCIONAL: se envuelve en un error de dominio con `cause`, se
 * captura como `unknown`, se estrecha con `instanceof` y `finally` siempre
 * imprime el resumen.
 *
 * class ErrorDominio extends Error {
 *     override readonly name: string = 'ErrorDominio';
 * }
 * class ErrorValidacion extends ErrorDominio {
 *     override readonly name = 'ErrorValidacion';
 *     constructor(readonly campo: string, mensaje: string) { super(mensaje); }
 * }
 * class ErrorPersistencia extends ErrorDominio {
 *     override readonly name = 'ErrorPersistencia';
 * }
 *
 * type Result<T, E> = { readonly ok: true; readonly valor: T } | { readonly ok: false; readonly error: E };
 * const ok = <T>(valor: T): Result<T, never> => ({ ok: true, valor });
 * const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
 *
 * interface Usuario { readonly correo: string; readonly edad: number; }
 *
 * function parsearUsuario(linea: string): Result<Usuario, ErrorValidacion> {
 *     const [correo = '', edadTexto = ''] = linea.split(';').map((s) => s.trim());
 *     if (!correo.includes('@')) return err(new ErrorValidacion('correo', `correo inválido "${correo}"`));
 *     const edad = Number(edadTexto);
 *     if (!Number.isInteger(edad) || edad < 18) return err(new ErrorValidacion('edad', `edad inválida "${edadTexto}"`));
 *     return ok({ correo: correo.toLowerCase(), edad });
 * }
 *
 * function guardarEnBd(u: Usuario): void {                    // simula la BD
 *     if (u.correo.endsWith('@caido.com')) throw new Error('ECONNRESET: conexión reiniciada');
 * }
 *
 * function describirError(e: unknown): string {
 *     if (e instanceof ErrorDominio) {
 *         const causa = e.cause instanceof Error ? ` (causa: ${e.cause.message})` : '';
 *         return `${e.name}: ${e.message}${causa}`;
 *     }
 *     if (e instanceof Error) return `Error inesperado: ${e.message}`;
 *     return `Valor lanzado que no es Error: ${String(e)}`;
 * }
 *
 * function importar(lineas: readonly string[]): void {
 *     let guardados = 0;
 *     try {
 *         for (const linea of lineas) {
 *             const r = parsearUsuario(linea);
 *             if (!r.ok) {                                     // estrecha a la rama de error
 *                 console.log(`Fila rechazada -> ${r.error.campo}: ${r.error.message}`);
 *                 continue;
 *             }
 *             try {
 *                 guardarEnBd(r.valor);
 *                 guardados++;
 *             } catch (e: unknown) {
 *                 throw new ErrorPersistencia(`no se pudo guardar ${r.valor.correo}`, { cause: e });
 *             }
 *         }
 *     } catch (e: unknown) {
 *         console.log(describirError(e));
 *     } finally {
 *         console.log(`Resumen: ${guardados} guardado(s)`);
 *     }
 * }
 *
 * importar(['Ana@Correo.com; 34', 'luis-sin-arroba; 40', 'sofia@correo.com; 15',
 *     'pepe@caido.com; 50', 'eva@correo.com; 28']);
 * console.log(describirError('timeout'));
 *
 * // Salida esperada:
 * // Fila rechazada -> correo: correo inválido "luis-sin-arroba"
 * // Fila rechazada -> edad: edad inválida "15"
 * // ErrorPersistencia: no se pudo guardar pepe@caido.com (causa: ECONNRESET: conexión reiniciada)
 * // Resumen: 1 guardado(s)
 * // Valor lanzado que no es Error: timeout
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA `catch (e: any)` NI `(e as Error).message` SIN COMPROBAR: si alguien
 *   lanzó un string, `e.message` es `undefined`. Estrecha con `instanceof`.
 * - NO TRAGUES ERRORES: un `catch {}` vacío esconde bugs. Registra, relanza o
 *   transforma; si ignoras a propósito, deja un comentario explicando por qué.
 * - CONSERVA LA CAUSA: al relanzar usa `{ cause: e }`; perder el error
 *   original hace imposible depurar en producción.
 * - `Result` PARA LO ESPERADO, `throw` PARA LO EXCEPCIONAL: no uses
 *   excepciones como control de flujo normal (son lentas y ocultas en el tipo).
 * - `instanceof` FALLA CON `target: ES5`: las clases que extienden `Error`
 *   necesitan `Object.setPrototypeOf(this, new.target.prototype)` en targets
 *   antiguos. Con ES2015+ funciona de forma nativa.
 * - `return` DENTRO DE `finally` SOBRESCRIBE el `return` o el `throw` del
 *   `try`: evita retornar desde `finally`.
 * - NO EXPONGAS DETALLES INTERNOS: el stack, el SQL o el `cause` van al log;
 *   al cliente solo un mensaje y un código de error estables.
 * - EN CÓDIGO ASÍNCRONO usa `try/catch` con `await`: una promesa rechazada
 *   sin capturar termina el proceso de Node (`unhandledRejection`).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. División segura: `dividir(a: number, b: number): number` que lance
 *    `RangeError` si `b === 0`; captúralo como `unknown` e imprime el mensaje.
 * 2. JSON seguro: `parsearJson(texto: string): unknown | null` con
 *    `try/catch` y un `finally` que registre la duración.
 * 3. Mensaje universal: `mensajeDeError(e: unknown): string` que maneje
 *    `Error`, strings, números y objetos con propiedad `message`.
 *
 * [Intermedio]
 * 4. Jerarquía de errores: `ErrorApp` (con `codigo` y `estadoHttp`),
 *    `ErrorValidacion`, `ErrorNoAutorizado` y `ErrorNoEncontrado`; escribe
 *    `aRespuestaHttp(e: unknown): { estado: number; cuerpo: string }`.
 * 5. Result genérico: implementa `Result<T, E>`, `ok`, `err`, `mapear` y
 *    `desenvolverO(r, porDefecto)` sin usar `as`.
 * 6. Errores de Node: lee un archivo inexistente y distingue `ENOENT` de
 *    `EACCES` con un predicado `esErrorDeSistema(e): e is NodeJS.ErrnoException`.
 * 7. Validación acumulada: valida un formulario de registro devolviendo
 *    TODOS los errores (`readonly ErrorValidacion[]`) en lugar del primero.
 *
 * [Senior / Producción]
 * 8. Envoltura con causa: un `RepositorioPedidos` que capture errores del
 *    driver y lance `ErrorPersistencia` con `cause`; escribe una función que
 *    recorra la cadena de causas e imprima cada nivel.
 * 9. Reintentos selectivos: `reintentar<T>(op: () => Promise<T>, esReintentable:
 *    (e: unknown) => boolean)` que solo reintente errores transitorios.
 * 10. `tryCatch` tipado: `aResult<T>(fn: () => Promise<T>): Promise<Result<T,
 *     Error>>` que normalice cualquier valor lanzado a `Error` (con `cause`)
 *     y úsalo para eliminar los `try/catch` anidados de un caso de uso.
 */

// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.

export {}; // Convierte el archivo en módulo para evitar choques de nombres entre temas.
