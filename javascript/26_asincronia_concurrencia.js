'use strict';

/*
 * ============================================================================
 * TEMA 26: ASINCRONÍA, EVENT LOOP (MICROTASKS VS MACROTASKS), PROMESAS Y ASYNC/AWAIT
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental del Event Loop en V8 / Node.js)
 * ----------------------------------------------------------------------------
 * JavaScript ejecuta tu código en un **único hilo principal** (*Single-Threaded*),
 * pero logra manejar miles de operaciones de red y disco concurrentes gracias al
 * **Event Loop** y sus colas de prioridades:
 *
 * Orden Exacto de Ejecución en el Event Loop:
 * 1) **Call Stack (Código Síncrono)**: Todo el código síncrono actual se ejecuta
 *    de principio a fin sin interrupción.
 * 2) **Cola de Microtareas (*Microtask Queue* — Prioridad Máxima)**:
 *    Apenas se vacía el Call Stack, el motor procesa **TODAS** las microtareas
 *    pendientes (`Promise.then / catch / finally`, continuaciones de `await`,
 *    `queueMicrotask()`) antes de pasar al siguiente paso!
 * 3) **Cola de Macrotareas (*Macrotask / Task Queue*)**:
 *    `setTimeout`, `setInterval`, `setImmediate`, callbacks de I/O de red/disco.
 *    Por eso un `Promise.resolve().then(...)` SIEMPRE se ejecuta antes que un
 *    `setTimeout(..., 0)`!
 *
 * Los 4 Combinadores de Concurrencia de `Promise` que un Senior domina:
 * - **`Promise.all([p1, p2, p3])`**: Ejecuta en paralelo; resuelve cuando TODAS
 *   tienen éxito, o **rechaza inmediatamente** (*fail-fast*) si UNA sola falla.
 * - **`Promise.allSettled([p1, p2, p3])` (ES2020+)**: Espera a que todas terminen
 *   sin importar si fallan, devolviendo `[{ status: 'fulfilled', value }, { status: 'rejected', reason }]`.
 * - **`Promise.race([p1, p2])`**: Gana la primera que termine (éxito o error;
 *   ideal para implementar timeouts).
 * - **`Promise.any([p1, p2])` (ES2021+)**: Gana la primera que tenga **éxito**;
 *   solo rechaza con `AggregateError` si TODAS fallan.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Paralelización de Consultas Independientes (`Promise.all`): Cargar perfil,
 *   pedidos y notificaciones en paralelo en vez de hacer 3 `await` en serie.
 * - Procesamiento de Lotes Resiliente (`Promise.allSettled`): Enviar 50 correos
 *   sin que el fallo de 1 detenga ni oculte el resultado de los otros 49.
 * - Cancelación y Timeouts Estándar (`AbortController` y `AbortSignal.timeout`).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Utilidad asíncrona de pausa no bloqueante:
 * const esperarMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
 *
 * // 2. MAL (Secuencial lento: 100ms + 100ms = 200ms) vs BIEN (Paralelo: ~100ms):
 * // MAL:  const a = await pedirA(); const b = await pedirB();
 * // BIEN: const [a, b] = await Promise.all([pedirA(), pedirB()]);
 *
 * // 3. Promise.withResolvers() (ES2024+):
 * // const { promise, resolve, reject } = Promise.withResolvers();
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Consultar 3 pasarelas de cotización en paralelo usando
 * `Promise.allSettled` para reportar tanto las cotizaciones exitosas como las
 * que fallaron sin abortar el proceso.
 *
 * async function cotizarProveedores() {
 *     const tareas = [
 *         Promise.resolve({ proveedor: 'DHL', tarifa: 25 }),
 *         Promise.reject(new Error('FedEx Timeout')),
 *         Promise.resolve({ proveedor: 'UPS', tarifa: 22 }),
 *     ];
 *
 *     const resultados = await Promise.allSettled(tareas);
 *     const exitosas = resultados
 *         .filter((r) => r.status === 'fulfilled')
 *         .map((r) => r.value);
 *     const errores = resultados
 *         .filter((r) => r.status === 'rejected')
 *         .map((r) => r.reason.message);
 *
 *     console.log('Exitosas:', JSON.stringify(exitosas), '| Errores:', JSON.stringify(errores));
 * }
 * // cotizarProveedores();
 * // Salida esperada:
 * // Exitosas: [{"proveedor":"DHL","tarifa":25},{"proveedor":"UPS","tarifa":22}] | Errores: ["FedEx Timeout"]
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - ¡JAMÁS USES `async` DENTRO DE `.forEach()`!:
 *   `items.forEach(async (item) => { await guardar(item); });` **NO espera a que
 *   terminen las promesas**: dispara todas las funciones de golpe sin control y
 *   el `.forEach` termina inmediatamente devolviendo `undefined`!
 *   - Si quieres ejecución **secuencial**: usa `for (const item of items) { await guardar(item); }`.
 *   - Si quieres ejecución **paralela**: usa `await Promise.all(items.map((item) => guardar(item)))`.
 * - EL ERROR DE `return prom` VS `return await prom` DENTRO DE `try / catch`:
 *   Dentro de un bloque `try { return await fnAsincrona(); } catch (e) { ... }`,
 *   el **`await` es OBLIGATORIO**! Si escribes solo `return fnAsincrona();` sin
 *   `await`, si la promesa falla **NO entrará en tu bloque `catch` local**!
 * - EVITA EL ANTIPATRÓN DE LA CASCADA SECUENCIAL (*Async Waterfall*): No hagas
 *   `await a(); await b();` si `b()` no necesita el resultado de `a()`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Orden del Event Loop (Síncrono vs Microtask vs Macrotask): Escribe un
 *    bloque con `console.log('1')`, `setTimeout(..., 0)`, `Promise.resolve().then(...)`
 *    y `queueMicrotask(...)`, predice el orden exacto de salida y compruébalo.
 * 2. Paralelización con `Promise.all` vs Secuencial: Crea 3 funciones asíncronas
 *    que tarden `30ms` cada una; mide con `performance.now()` la diferencia entre
 *    ejecutarlas con 3 `await` seguidos (~90ms) frente a `Promise.all` (~30ms).
 * 3. Demostración de `return await` dentro de `try / catch`: Muestra cómo sin
 *    `await` en el `return` de un `try`, la excepción escapa del `catch` local.
 *
 * [Intermedio]
 * 4. Comparativa práctica de los 4 combinadores (`all`, `allSettled`, `race`, `any`):
 *    Dado un lote de promesas exitosas y fallidas, ejecuta los 4 métodos y
 *    documenta su comportamiento exacto.
 * 5. Envoltorio de Timeout con `Promise.race` y limpieza de timer (`clearTimeout`):
 *    Implementa `conTimeout(promesa, limiteMs)` que rechace si `promesa` tarda
 *    más de `limiteMs`, asegurándote en `finally` de limpiar el `setTimeout`
 *    para no dejar el proceso de Node.js colgado!
 * 6. Cancelación estándar con `AbortController` y `AbortSignal`: Crea una tarea
 *    asíncrona que escuche `signal.aborted` / evento `'abort'` y cancélala desde
 *    afuera con `controller.abort()`.
 * 7. Reintentos asíncronos con *Exponential Backoff*: Implementa
 *    `reintentarAsync(fn, { intentos = 3, baseMs = 20 })` que espere
 *    progresivamente entre fallos antes de rendirse.
 *
 * [Senior / Producción]
 * 8. Limitador de Concurrencia Asíncrona (`mapearConLimite(items, limiteSimultaneo, fnAsync)`):
 *    Si tienes 1,000 archivos o URLs, hacer `Promise.all` de los 1,000 a la vez
 *    satura los sockets o la base de datos. Implementa un pool de workers que
 *    ejecute máximo `limiteSimultaneo` promesas en vuelo a la vez!
 * 9. Generadores Asíncronos (`async function*`) y `for await...of`: Implementa
 *    un consumidor de API paginada `async function* obtenerTodasLasPaginas()`
 *    que pida la siguiente página bajo demanda con `yield` y se consuma con
 *    `for await (const registro of obtenerTodasLasPaginas())`.
 * 10. Deduplicación de Promesas en Vuelo (*Singleflight / In-Flight Request Coalescing*):
 *     Implementa un envoltorio que, si 5 clientes piden el mismo `obtenerProducto(10)`
 *     al mismo milisegundo mientras la primera promesa aún no ha terminado,
 *     comparta la **misma Promesa en vuelo** haciendo una sola llamada a la BD!
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
