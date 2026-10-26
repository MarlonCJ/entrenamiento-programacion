/*
 * ============================================================================
 * TEMA 03: ENTRADA, SALIDA, CONSOLA, INTL Y READLINE EN NODE.JS
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: flujos de Node + event loop)
 * ----------------------------------------------------------------------------
 * TypeScript no tiene I/O propio: usa las APIs del entorno (Node.js o el
 * navegador), descritas por los tipos de `@types/node`. En Node:
 *
 * 1) **Tres flujos estándar**: `process.stdin` (Readable), `process.stdout` y
 *    `process.stderr` (Writable). `console.log`/`info` escriben en stdout;
 *    `console.error`/`warn` en stderr. Así `node app.js > reporte.txt` guarda
 *    solo los datos y los avisos siguen en pantalla.
 * 2) **`console.log` formatea con `util.inspect`**: los objetos se muestran
 *    como `{ id: 1, nombre: 'Ana' }` (strings con comillas simples) y admite
 *    especificadores `%s`, `%d`, `%i`, `%f`, `%j`, `%o`, `%O`.
 *    `process.stdout.write(texto)` escribe tal cual, sin salto de línea.
 * 3) **La entrada es ASÍNCRONA**: no existe un `input()` bloqueante. Se usa
 *    `node:readline/promises` (Node 17+) con `await rl.question(...)`, o se
 *    leen líneas con `for await (const linea of rl)`. Toda entrada llega como
 *    `string`: el tipo correcto se obtiene convirtiendo y validando (tema 04).
 * 4) **Argumentos y entorno**: `process.argv` (`string[]`: ruta de node, ruta
 *    del script y luego los argumentos), `util.parseArgs` (Node 18.3+) y
 *    `process.env` (`Record<string, string | undefined>`).
 * 5) **Formateo**: template literals, `padStart`/`padEnd`, `toFixed` y la API
 *    `Intl` (`NumberFormat`, `DateTimeFormat`, `ListFormat`,
 *    `RelativeTimeFormat`) incluida en Node con ICU completo.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - CLIs internas (migraciones, conciliaciones, seeds) que piden confirmación
 *   antes de operaciones destructivas y aceptan flags (`--dry-run`).
 * - Recibos y reportes de texto: nómina, cierre de caja, resúmenes enviados
 *   a Slack o por correo, con montos alineados y formateados por país.
 * - Logs estructurados JSON en una línea por evento para CloudWatch, Datadog
 *   o Loki (en producción se usan librerías como pino).
 * - Filtros de tubería: `type ventas.csv | node resumen.js` leyendo stdin línea
 *   a línea sin cargar el archivo completo en memoria.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * import { createInterface } from 'node:readline/promises';
 * import { stdin as input, stdout as output } from 'node:process';
 * import { parseArgs } from 'node:util';
 *
 * const rl = createInterface({ input, output });
 * const nombre = (await rl.question('Nombre: ')).trim();   // siempre string
 * const edad = Number(await rl.question('Edad: '));        // convertir + validar
 * rl.close();                                              // si no, el proceso no termina
 *
 * console.log('Pedido %s: %d unidades', 'PED-9', 3);       // Pedido PED-9: 3 unidades
 * console.table([{ sku: 'A1', stock: 4 }, { sku: 'B2', stock: 0 }]);
 * console.error('Fallo de conexión');                      // a stderr
 * process.stdout.write('Procesando...');                   // sin salto de línea
 *
 * 'SKU'.padEnd(8) + '|';                                    // 'SKU     |'
 * '42'.padStart(5, '0');                                    // '00042'
 * (1234.567).toFixed(2);                                    // '1234.57'
 * new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
 *     .format(1234.5);                                      // '$1,234.50'
 * new Intl.NumberFormat('es-CO').format(1250000);           // '1.250.000'
 * new Intl.ListFormat('es', { type: 'conjunction' })
 *     .format(['Ana', 'Luis', 'Eva']);                      // 'Ana, Luis y Eva'
 *
 * const { values } = parseArgs({
 *     options: { 'dry-run': { type: 'boolean', default: false } },
 * });                                                       // values['dry-run']: boolean
 *
 * for await (const linea of createInterface({ input })) { procesar(linea); }
 * // await en el nivel superior requiere módulo ESM y "module": "nodenext"
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: El módulo de RR. HH. genera el desprendible de pago de una
 * empleada en 36 columnas, con montos en dólares alineados a la derecha.
 *
 * interface LineaNomina {
 *     readonly concepto: string;
 *     readonly monto: number;
 * }
 *
 * const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
 * const ANCHO = 36;
 * const COL_CONCEPTO = 22;
 *
 * function fila(izquierda: string, derecha: string): string {
 *     return izquierda.padEnd(COL_CONCEPTO) + derecha.padStart(ANCHO - COL_CONCEPTO);
 * }
 *
 * function renderizarRecibo(empleado: string, lineas: readonly LineaNomina[]): string {
 *     const neto = lineas.reduce((acc, l) => acc + l.monto, 0);
 *     return [
 *         '='.repeat(ANCHO),
 *         `NÓMINA | ${empleado}`,
 *         '-'.repeat(ANCHO),
 *         ...lineas.map((l) => fila(l.concepto, usd.format(l.monto))),
 *         '-'.repeat(ANCHO),
 *         fila('NETO A PAGAR', usd.format(neto)),
 *         '='.repeat(ANCHO),
 *     ].join('\n');
 * }
 *
 * const recibo = renderizarRecibo('Valentina Ríos', [
 *     { concepto: 'Salario base', monto: 3200 },
 *     { concepto: 'Horas extra (6 h)', monto: 450.5 },
 *     { concepto: 'Salud (4%)', monto: -128 },
 *     { concepto: 'Pensión (4%)', monto: -128 },
 * ]);
 *
 * process.stdout.write(recibo + '\n');
 * console.log('Empleados procesados: %d de %d', 1, 1);
 * console.log({ empleado: 'Valentina Ríos', neto: 3394.5, aprobado: true });
 * console.error('[WARN] 2 empleados sin cuenta bancaria');     // va a stderr
 *
 * // Salida esperada (stdout y stderr en la terminal):
 * // ====================================
 * // NÓMINA | Valentina Ríos
 * // ------------------------------------
 * // Salario base               $3,200.00
 * // Horas extra (6 h)            $450.50
 * // Salud (4%)                  -$128.00
 * // Pensión (4%)                -$128.00
 * // ------------------------------------
 * // NETO A PAGAR               $3,394.50
 * // ====================================
 * // Empleados procesados: 1 de 1
 * // { empleado: 'Valentina Ríos', neto: 3394.5, aprobado: true }
 * // [WARN] 2 empleados sin cuenta bancaria
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - LA ENTRADA SIEMPRE ES `string`: `await rl.question('Cantidad: ') + 1`
 *   compila (concatenación de strings) y produce '51'. Convierte y valida.
 * - OLVIDAR `rl.close()` deja el proceso colgado: el stream de stdin mantiene
 *   vivo el event loop. Usa `try/finally`.
 * - `Intl` Y LOS ESPACIOS INVISIBLES: muchos locales (es-CO, fr-FR) insertan
 *   un espacio duro (U+00A0) o estrecho (U+202F) entre símbolo y número. Si
 *   comparas strings en tests, el `' '` normal no coincidirá. Reutiliza las
 *   instancias de `Intl.NumberFormat`: crearlas en cada llamada es costoso.
 * - NUNCA FORMATEES DINERO CON CONCATENACIÓN DE FLOATS: `'$' + 0.1 * 3` da
 *   '$0.30000000000000004'. Usa `toFixed` o `Intl` (y centavos enteros, tema 05).
 * - `padStart` CUENTA UNIDADES UTF-16: emojis y caracteres combinados rompen la
 *   alineación porque `'👍'.length === 2`.
 * - NO DEJES `console.log` DE DEPURACIÓN en producción: usa un logger con
 *   niveles y nunca imprimas tokens, contraseñas ni datos de tarjetas.
 * - stdout ES ASÍNCRONO EN TUBERÍAS: si llamas `process.exit()` justo después
 *   de escribir mucho texto, puedes perder salida. Prefiere fijar
 *   `process.exitCode = 1` y dejar que el proceso termine solo.
 * - TIPOS DE NODE: instala `@types/node` y usa imports con prefijo `node:`
 *   para dejar claro que el módulo es nativo.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Saludo interactivo: con `readline/promises` pide nombre y ciudad,
 *    límpialos con `trim()` y muestra "Bienvenida, Ana, desde Medellín".
 *    Cierra la interfaz en un bloque `finally`.
 * 2. Barra de progreso: con `process.stdout.write` imprime "Sincronizando" y
 *    5 puntos en la MISMA línea, terminando con " listo" y un salto de línea.
 * 3. Ficha de producto: formatea precio en USD y en COP (`es-CO`) con
 *    `Intl.NumberFormat` y un descuento como porcentaje (`style: 'percent'`).
 *
 * [Intermedio]
 * 4. `formatearBytes(bytes: number): string` que devuelva '512 B', '1.5 KB',
 *    '3.2 MB', '1.1 GB' con un decimal. Pruébala con 6 valores.
 * 5. Tabla de calificaciones: dado `readonly [string, number][]`, imprime una
 *    tabla con encabezado, nombres a la izquierda, notas a la derecha con un
 *    decimal y una fila final de promedio. Compárala con `console.table`.
 * 6. Flags de CLI con `util.parseArgs`: acepta `--archivo <ruta>`,
 *    `--limite <n>` y `--dry-run`, valida que `limite` sea un entero positivo
 *    y escribe errores en stderr con `process.exitCode = 1`.
 * 7. `preguntar(rl, texto: string, porDefecto: string): Promise<string>` que
 *    devuelva el valor por defecto si el usuario presiona Enter sin escribir.
 *
 * [Senior / Producción]
 * 8. Filtro de tubería: `resumen-ventas.ts` que lea un CSV por stdin con
 *    `for await` (`fecha,producto,monto`), ignore el encabezado y líneas
 *    vacías, acumule por producto en un `Map<string, number>` e imprima un
 *    reporte alineado. Las líneas inválidas van a stderr con su número.
 * 9. Logger estructurado: `crearLogger(servicio: string)` con métodos
 *    `info`, `warn` y `error` que escriban una línea JSON por evento
 *    (`nivel`, `servicio`, `mensaje`, `contexto`) y redacten automáticamente
 *    las claves `password`, `token` y `tarjeta` como '[REDACTADO]'.
 * 10. `renderizarTabla<T extends Record<string, string | number>>(filas:
 *     readonly T[]): string` que calcule el ancho de cada columna, alinee
 *     números a la derecha y texto a la izquierda, y dibuje bordes ASCII.
 *     Escribe pruebas con Vitest o `node:test` comparando la salida exacta.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
