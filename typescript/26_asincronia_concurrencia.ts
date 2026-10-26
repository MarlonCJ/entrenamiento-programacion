/*
 * ============================================================================
 * TEMA 26: ASINCRONÍA Y CONCURRENCIA TIPADA (PROMISE<T>, ASYNC/AWAIT, EVENT LOOP)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: un hilo, colas y Promise<T>)
 * ----------------------------------------------------------------------------
 * TypeScript NO añade concurrencia: compila a JavaScript y el runtime sigue
 * siendo el *event loop* de Node.js (libuv) o del navegador. Lo que TS aporta
 * es TIPAR el resultado futuro y detectar errores de uso antes de ejecutar.
 *
 * 1) **Un solo hilo de JS + colas**: el código síncrono corre en la pila de
 *    llamadas; al vaciarse se procesan TODAS las microtareas (callbacks de
 *    promesas, `queueMicrotask`, `await`) y después UNA macrotarea (timers,
 *    I/O, `setImmediate`). Por eso una microtarea siempre gana a un
 *    `setTimeout(fn, 0)`.
 * 2) **`Promise<T>` y `async`**: una función `async` SIEMPRE devuelve
 *    `Promise<T>`; `await` desenvuelve el tipo (`Awaited<T>`). El tipo del
 *    error NO se tipa: `catch (e)` recibe `unknown` (con
 *    `useUnknownInCatchVariables`, activo en `strict`) y `.catch((e) => ...)`
 *    recibe `any`, así que anótalo como `unknown` y estréchalo con
 *    `instanceof Error`.
 * 3) **Concurrencia no es paralelismo**: `Promise.all` lanza varias esperas de
 *    I/O a la vez en un hilo. Para CPU intensiva necesitas `worker_threads`
 *    (paralelismo real) o dividir el trabajo para no bloquear el loop.
 * 4) **Combinadores con tipos de tupla**: `Promise.all([p1, p2])` infiere
 *    `[A, B]`; `Promise.allSettled` devuelve `PromiseSettledResult<T>[]`, una
 *    unión discriminada por `status: 'fulfilled' | 'rejected'`; `race` y `any`
 *    devuelven la primera en resolverse (o en cumplirse).
 * 5) **Cancelación**: no existe `promise.cancel()`. El estándar es
 *    `AbortController` / `AbortSignal` (`AbortSignal.timeout(ms)`), aceptado
 *    por `fetch`, `node:timers/promises`, `node:fs/promises` y `events.once`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Agregadores que consultan varias APIs (precios, inventario, envíos) en
 *   paralelo con `Promise.all` y degradación elegante con `allSettled`.
 * - Plataformas IoT que leen cientos de sensores con límite de concurrencia
 *   y *timeouts* para no colgarse esperando a un dispositivo caído.
 * - Reintentos con *backoff* exponencial ante errores 429/503 de pasarelas.
 * - Streams y colas de mensajes (Kafka, SQS) consumidos con `for await...of`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // Función async tipada y desenvolvimiento con Awaited:
 * async function obtenerSaldo(cuenta: string): Promise<number> { return 1500; }
 * type Saldo = Awaited<ReturnType<typeof obtenerSaldo>>; // number
 *
 * // Paralelo con tupla tipada (no uses await en serie si son independientes):
 * const [usuario, pedidos] = await Promise.all([buscarUsuario(id), listarPedidos(id)]);
 *
 * // Estrechar el error unknown:
 * try { await pagar(); } catch (error: unknown) {
 *     const mensaje = error instanceof Error ? error.message : String(error);
 * }
 *
 * // Timers como promesas y cancelación estándar:
 * import { setTimeout as dormir } from 'node:timers/promises';
 * await dormir(100, undefined, { signal: AbortSignal.timeout(50) }); // AbortError
 *
 * // Iteración asíncrona tipada:
 * async function* paginas(): AsyncGenerator<readonly string[]> { yield ['a']; }
 * for await (const pagina of paginas()) console.log(pagina.length);
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un concentrador IoT demuestra el orden del event loop y luego lee
 * tres sensores en paralelo: uno responde, otro falla y otro excede el
 * *timeout*. `allSettled` permite continuar con los datos disponibles.
 *
 * interface Lectura {
 *     readonly sensor: string;
 *     readonly celsius: number;
 * }
 *
 * const esperar = (ms: number): Promise<void> =>
 *     new Promise((resolver) => setTimeout(resolver, ms));
 *
 * async function leerSensor(sensor: string, ms: number, falla = false): Promise<Lectura> {
 *     await esperar(ms);
 *     if (falla) throw new Error(`Sensor ${sensor} sin respuesta`);
 *     return { sensor, celsius: 20 + ms / 10 };
 * }
 *
 * async function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<T> {
 *     let id: ReturnType<typeof setTimeout> | undefined;
 *     const limite = new Promise<never>((_, rechazar) => {
 *         id = setTimeout(() => rechazar(new Error(`Timeout de ${ms} ms`)), ms);
 *     });
 *     try {
 *         return await Promise.race([promesa, limite]);
 *     } finally {
 *         clearTimeout(id); // sin esto, el timer mantiene vivo el proceso
 *     }
 * }
 *
 * async function main(): Promise<void> {
 *     console.log('1. código síncrono');
 *     setTimeout(() => console.log('4. macrotarea (timer 0 ms)'), 0);
 *     queueMicrotask(() => console.log('3. microtarea'));
 *     console.log('2. fin del código síncrono');
 *     await esperar(5);
 *
 *     const resultados = await Promise.allSettled([
 *         leerSensor('S1', 30),
 *         leerSensor('S2', 10, true),
 *         conTimeout(leerSensor('S3', 200), 50),
 *     ]);
 *     for (const r of resultados) {
 *         if (r.status === 'fulfilled') console.log('OK   ', r.value);
 *         else console.log('FALLO', r.reason instanceof Error ? r.reason.message : r.reason);
 *     }
 * }
 *
 * main().catch((error: unknown) => console.error(error));
 *
 * // Salida esperada:
 * // 1. código síncrono
 * // 2. fin del código síncrono
 * // 3. microtarea
 * // 4. macrotarea (timer 0 ms)
 * // OK    { sensor: 'S1', celsius: 23 }
 * // FALLO Sensor S2 sin respuesta
 * // FALLO Timeout de 50 ms
 *
 * Observa que `Promise.race` NO cancela la lectura de S3: sigue en curso hasta
 * los 200 ms. Para cancelar de verdad, pasa un `AbortSignal` a la operación.
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - PROMESAS FLOTANTES: llamar a `guardarAuditoria()` sin `await` compila sin
 *   error y su rechazo puede terminar el proceso (`unhandledRejection`).
 *   Activa la regla de ESLint `@typescript-eslint/no-floating-promises` y usa
 *   `void tarea()` solo cuando ignorarla sea intencional.
 * - `forEach(async ...)` NO ESPERA: TS lo acepta (el callback devuelve una
 *   promesa que se descarta). Usa `for...of` con `await` (serie) o
 *   `Promise.all(lista.map(async ...))` (paralelo); regla `no-misused-promises`.
 * - `await` EN SERIE PARA TAREAS INDEPENDIENTES multiplica la latencia; lanza
 *   primero las promesas y espera después con `Promise.all`.
 * - `Promise.all` CON 10 000 ELEMENTOS satura la base de datos o la API:
 *   limita la concurrencia (pool de N trabajadores) o procesa por lotes.
 * - NO TIPES EL CATCH COMO `any` ni asumas `error.message`: un `throw 'texto'`
 *   es legal en JS. Estrecha con `instanceof Error` y usa `new Error(msg,
 *   { cause })` para encadenar causas.
 * - EL TIPO NO VALIDA LA RESPUESTA: `await res.json() as Pedido` es una
 *   mentira al compilador; los datos externos llegan como `unknown` y deben
 *   validarse (tema 27).
 * - LIMPIA TIMERS E INTERVALOS (`clearTimeout`, `unref()`) o el proceso no
 *   termina y los tests de Vitest/Jest quedan colgados.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Orden del event loop: predice y luego verifica el orden de impresión de
 *    `console.log`, `setTimeout(0)`, `setImmediate`, `queueMicrotask` y
 *    `Promise.resolve().then`, explicando cada posición.
 * 2. `esperar(ms): Promise<void>` y una función `async` que simule cobrar un
 *    pedido devolviendo `Promise<Recibo>`; usa `Awaited<ReturnType<...>>`.
 * 3. Serie vs paralelo: mide con `performance.now()` tres consultas de 100 ms
 *    hechas con `await` en serie y con `Promise.all` (tupla tipada).
 *
 * [Intermedio]
 * 4. `reintentar<T>(fn: () => Promise<T>, intentos, baseMs)` con backoff
 *    exponencial que relance el último error con `{ cause }`.
 * 5. `conTimeout<T>` usando `AbortSignal.timeout(ms)` y `node:timers/promises`,
 *    distinguiendo el `AbortError` de otros errores.
 * 6. Dashboard de salud: consulta 5 microservicios con `Promise.allSettled` y
 *    construye `{ sanos: string[]; caidos: { nombre: string; motivo: string }[] }`.
 * 7. Generador asíncrono `paginarClientes(): AsyncGenerator<Cliente[]>` que pida
 *    páginas simuladas hasta que `siguiente` sea `null`, consumido con
 *    `for await...of`.
 *
 * [Senior / Producción]
 * 8. `mapConLimite<T, R>(items, limite, fn)` que procese como máximo N tareas
 *    simultáneas preservando el orden de los resultados.
 * 9. Exclusión mutua: implementa una clase `Mutex` con `adquirir(): Promise<() => void>`
 *    y demuestra cómo evita la condición de carrera de dos retiros simultáneos
 *    sobre el mismo saldo bancario.
 * 10. Cortocircuito de fallos (*Circuit Breaker*) tipado con estados
 *     `'CERRADO' | 'ABIERTO' | 'SEMIABIERTO'`, umbral de fallos y tiempo de
 *     enfriamiento, más un `worker_threads` que calcule hashes sin bloquear el
 *     event loop.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
