/*
 * ============================================================================
 * TEMA 22: PRUEBAS AUTOMATIZADAS (NODE:TEST, ASSERT), DOBLES Y DEPURACIÓN
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: Compilador + Pruebas)
 * ----------------------------------------------------------------------------
 * En TypeScript la calidad se defiende en DOS capas complementarias:
 *
 * 1) **El compilador (`tsc --noEmit`)**: demuestra que el código es coherente
 *    con sus TIPOS (no llamas a `undefined`, no pasas un `string` donde va un
 *    `number`). Es una prueba estática gratuita en cada guardado.
 * 2) **Las pruebas automatizadas**: demuestran que el COMPORTAMIENTO es el
 *    correcto. El compilador no sabe que el IVA es 19 % ni que un descuento no
 *    puede superar el total; además los tipos se borran en runtime, así que
 *    datos externos (JSON, formularios) pueden violar cualquier tipo.
 *
 * Herramientas actuales:
 * - `node:test` + `node:assert/strict`: runner nativo de Node (sin dependencias).
 *   Node 22.6+ ejecuta `.ts` con `--experimental-strip-types` (sin flag desde
 *   Node 22.18 / 23.6): solo BORRA tipos, no comprueba nada; por eso se
 *   combina con `tsc --noEmit` en CI. No admite `enum` ni parameter properties
 *   sin `--experimental-transform-types`.
 * - Vitest / Jest (`ts-jest`): runners con mocks, cobertura y modo watch.
 *
 * Patrón AAA: **Arrange** (preparar datos y dobles), **Act** (ejecutar UNA
 * acción) y **Assert** (verificar UN comportamiento). Dobles de prueba:
 * STUB (devuelve datos fijos), SPY (registra llamadas), MOCK (spy con
 * expectativas), FAKE (implementación simplificada, ej. repositorio en memoria).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Reglas de negocio con límites: vencimientos, tarifas por tramos, cupones.
 * - Antes de refactorizar: las pruebas son la red de seguridad.
 * - Regresiones: cada bug corregido se acompaña de la prueba que lo reproduce.
 * - CI/CD: `tsc --noEmit && node --test` bloquea el merge si algo falla.
 * - Pruebas de TIPOS: `expectTypeOf` (Vitest) o `// @ts-expect-error` para
 *   asegurar que una API RECHAZA usos incorrectos.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (node:test + assert/strict)
 * ----------------------------------------------------------------------------
 * import { describe, it, mock, beforeEach } from 'node:test';
 * import assert from 'node:assert/strict';
 *
 * describe('calcularEnvio', () => {
 *     it('cobra tarifa plana bajo 5 kg', () => {
 *         assert.equal(calcularEnvio(3), 9000);              // ===
 *     });
 *     it('rechaza pesos negativos', () => {
 *         assert.throws(() => calcularEnvio(-1), RangeError);
 *     });
 *     it('resuelve la cotización remota', async () => {
 *         await assert.rejects(cotizar('XX'), /destino inválido/);
 *     });
 *     it('compara estructuras', () => {
 *         assert.deepEqual({ a: [1, 2] }, { a: [1, 2] });    // profundo y estricto
 *     });
 *     it('espía dependencias', () => {
 *         const enviar = mock.fn((correo: string) => true);
 *         notificar(enviar);
 *         assert.equal(enviar.mock.callCount(), 1);
 *     });
 * });
 *
 * // @ts-expect-error  -> la prueba de tipos falla si esta línea SÍ compila
 * calcularEnvio('3');
 *
 * // Ejecutar: node --test   |   node --test --experimental-test-coverage
 * // Depurar:  node --inspect-brk --experimental-strip-types src/app.ts
 * //           (Chrome: chrome://inspect, o "JavaScript Debug Terminal" de VS Code)
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un SaaS calcula el estado de una suscripción (activa, por vencer
 * o vencida). Para que las pruebas sean deterministas el reloj se INYECTA
 * como dependencia; se usa un stub de reloj fijo, un spy tipado y un mini
 * runner (para que la salida sea reproducible; en producción: `node:test`).
 * La última prueba falla a propósito para ver el mensaje de `assert`.
 *
 * import assert from 'node:assert/strict';
 *
 * interface Reloj {
 *     ahora(): Date;
 * }
 * type EstadoSuscripcion = 'activa' | 'por_vencer' | 'vencida';
 *
 * const MS_POR_DIA = 86_400_000;
 *
 * // Código bajo prueba: el reloj se INYECTA (nada de `new Date()` escondido).
 * function estadoSuscripcion(venceEl: Date, reloj: Reloj, diasAviso = 7): EstadoSuscripcion {
 *     const restante = venceEl.getTime() - reloj.ahora().getTime();
 *     if (restante < 0) return 'vencida';
 *     return restante <= diasAviso * MS_POR_DIA ? 'por_vencer' : 'activa';
 * }
 *
 * // Stub: reloj fijo => pruebas deterministas.
 * const relojFijo = (iso: string): Reloj => ({ ahora: () => new Date(iso) });
 *
 * // Spy tipado: registra los argumentos de cada llamada.
 * function crearEspia<A extends unknown[], R>(impl: (...args: A) => R) {
 *     const llamadas: A[] = [];
 *     const espia = (...args: A): R => {
 *         llamadas.push(args);
 *         return impl(...args);
 *     };
 *     return Object.assign(espia, { llamadas });
 * }
 *
 * // Mini runner (en un proyecto real: node:test o Vitest).
 * const resultados = { ok: 0, fallos: 0 };
 * function prueba(nombre: string, fn: () => void): void {
 *     try {
 *         fn();
 *         resultados.ok++;
 *         console.log(`✔ ${nombre}`);
 *     } catch (error) {
 *         resultados.fallos++;
 *         const detalle = error instanceof assert.AssertionError
 *             ? error.message.split('\n')[0]
 *             : String(error);
 *         console.log(`✖ ${nombre} -> ${detalle}`);
 *     }
 * }
 *
 * const vence = new Date('2026-03-31T00:00:00Z');
 *
 * prueba('activa si faltan más de 7 días', () => {
 *     const reloj = relojFijo('2026-03-01T00:00:00Z');        // Arrange
 *     const estado = estadoSuscripcion(vence, reloj);          // Act
 *     assert.equal(estado, 'activa');                          // Assert
 * });
 * prueba('por vencer justo en el límite de 7 días', () => {
 *     assert.equal(estadoSuscripcion(vence, relojFijo('2026-03-24T00:00:00Z')), 'por_vencer');
 * });
 * prueba('vencida un milisegundo después', () => {
 *     assert.equal(estadoSuscripcion(vence, relojFijo('2026-03-31T00:00:00.001Z')), 'vencida');
 * });
 * prueba('consulta el reloj exactamente una vez', () => {
 *     const ahora = crearEspia(() => new Date('2026-03-30T00:00:00Z'));
 *     estadoSuscripcion(vence, { ahora });
 *     assert.equal(ahora.llamadas.length, 1);
 * });
 * prueba('resumen del panel (falla a propósito)', () => {
 *     const resumen = { plan: 'pro', estado: estadoSuscripcion(vence, relojFijo('2026-04-02T00:00:00Z')) };
 *     assert.deepEqual(resumen, { plan: 'pro', estado: 'activa' });
 * });
 * console.log(resultados);
 *
 * // Salida esperada:
 * // ✔ activa si faltan más de 7 días
 * // ✔ por vencer justo en el límite de 7 días
 * // ✔ vencida un milisegundo después
 * // ✔ consulta el reloj exactamente una vez
 * // ✖ resumen del panel (falla a propósito) -> Expected values to be strictly deep-equal:
 * // { ok: 4, fallos: 1 }
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - USA SIEMPRE `node:assert/strict`: el `assert` "legacy" usa `==` y
 *   `deepEqual` laxo (`1 == '1'` pasa). En modo strict `equal` es `===`.
 * - INYECTA RELOJ, ALEATORIEDAD E I/O: `Date.now()`, `Math.random()` o `fetch`
 *   escondidos dentro de la función producen tests intermitentes (flaky).
 *   Alternativa nativa: `mock.timers.enable({ apis: ['Date'] })` de `node:test`.
 * - PRUEBA LOS LÍMITES: el valor exacto (7 días), uno antes y uno después.
 *   La mayoría de bugs viven en `<` vs `<=` (off-by-one).
 * - `async` SIN `await` = FALSO POSITIVO: `assert.rejects(promesa)` debe ir
 *   con `await`; si no, la prueba termina antes de verificar nada.
 * - NO ABUSES DE `as` NI DE `any` EN TESTS: `{} as Usuario` compila pero
 *   oculta campos faltantes; crea fábricas `crearUsuario(overrides?: Partial<Usuario>)`.
 * - LOS TIPOS NO VALIDAN DATOS EXTERNOS: prueba también entradas inválidas
 *   que llegan como `unknown` (JSON mal formado, campos nulos).
 * - DEPURACIÓN: usa `sourceMap: true` para que los breakpoints y stack traces
 *   apunten al `.ts`; `debugger;` pausa si hay inspector conectado; prefiere
 *   `console.table` / `console.dir(obj, { depth: null })` a `console.log` anidados.
 * - UNA PRUEBA = UN COMPORTAMIENTO, nombre descriptivo ("cobra recargo si...").
 *   Cobertura alta no garantiza buenas aserciones.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Escribe `calcularImc(pesoKg: number, alturaM: number): number` y tres
 *    pruebas AAA con `assert.equal` (redondeando a 1 decimal).
 * 2. Prueba con `assert.throws` que `calcularImc` lanza `RangeError` con
 *    altura 0 o peso negativo.
 * 3. Usa `assert.deepEqual` para verificar que `normalizarEtiquetas(['  Ofertas',
 *    'ofertas', 'NUEVO'])` devuelve `['nuevo', 'ofertas']` (sin duplicados, ordenado).
 *
 * [Intermedio]
 * 4. Convierte las pruebas del ejemplo a `describe`/`it` de `node:test` y
 *    ejecútalas con `node --test --experimental-strip-types`.
 * 5. Fake de repositorio: `interface RepositorioPedidos` con implementación
 *    en memoria para probar `ServicioPedidos.cancelar(id)` sin base de datos.
 * 6. Prueba asíncrona: `obtenerTasaCambio(cliente)` con un stub que rechaza la
 *    promesa; verifica con `await assert.rejects` el mensaje de error.
 * 7. Pruebas de tipos: usa `// @ts-expect-error` para demostrar que
 *    `estadoSuscripcion('2026-01-01', reloj)` no compila.
 *
 * [Senior / Producción]
 * 8. Pruebas parametrizadas: tabla `readonly [entrada, esperado][]` para una
 *    tarifa por tramos de energía (kWh) y un bucle que genere un `it` por fila.
 * 9. Temporizadores falsos: prueba un `reintentarConEspera(fn, intentos)` con
 *    backoff exponencial usando `mock.timers` sin esperar tiempo real.
 * 10. Depuración guiada: introduce un bug off-by-one en una paginación
 *     (`paginar(items, pagina, tamano)`), escribe la prueba que lo detecta,
 *     localízalo con `node --inspect-brk` y breakpoints, y corrígelo.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
