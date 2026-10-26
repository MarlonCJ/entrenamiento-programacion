/*
 * ============================================================================
 * TEMA 18: ARCHIVOS CON NODE.JS TIPADO (FS/PROMISES, PATH Y VALIDACIÓN JSON)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: el disco es una frontera no confiable)
 * ----------------------------------------------------------------------------
 * TypeScript no tiene API de archivos propia: usa la de Node.js, tipada por el
 * paquete `@types/node` (`npm i -D @types/node`, `"types": ["node"]`). Lo que
 * TS aporta es saber exactamente QUÉ devuelve cada operación y obligarte a
 * tratar lo leído como dato externo:
 *
 * 1) `node:fs/promises`: API basada en promesas (`readFile`, `writeFile`,
 *    `appendFile`, `rename`, `rm`, `mkdir`, `readdir`, `stat`). Usa siempre
 *    `async/await`; la versión `*Sync` bloquea el event loop del servidor.
 * 2) Sobrecargas por codificación: `readFile(ruta)` devuelve `Buffer`, pero
 *    `readFile(ruta, 'utf8')` devuelve `string`. El tipo cambia según el
 *    argumento: TS te avisa si olvidas la codificación.
 * 3) `JSON.parse` devuelve `any`: es la puerta por donde los errores de tipos
 *    entran en silencio. Conviértelo de inmediato a `unknown` y valida con un
 *    predicado (`x is Producto`) o con Zod antes de usarlo.
 * 4) Errores de sistema: `NodeJS.ErrnoException` añade `code` (`'ENOENT'`,
 *    `'EACCES'`, `'EEXIST'`). En `catch (e: unknown)` estrecha antes de leerlo.
 * 5) `node:path`: `join`, `resolve`, `basename`, `extname`, `dirname`
 *    construyen rutas portables (Windows usa `\`, Linux `/`). Nunca
 *    concatenes rutas con `+`.
 * 6) Streams (`createReadStream` + `readline`): procesan archivos de GB línea
 *    a línea con memoria constante; `for await` itera las líneas tipadas
 *    como `string`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Leer configuración (`config.json`) y validarla al arrancar el servicio.
 * - Exportar reportes CSV/JSON y logs de auditoría (`appendFile`).
 * - Procesar archivos subidos o logs enormes por streaming.
 * - CLIs y scripts de build/migración que generan o transforman archivos.
 * - Persistencia simple (prototipos, colas locales) con escritura atómica.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * import { readFile, writeFile, appendFile, mkdir, rename, rm } from 'node:fs/promises';
 * import { createReadStream } from 'node:fs';
 * import { createInterface } from 'node:readline';
 * import { join, resolve, basename, extname } from 'node:path';
 *
 * const buffer = await readFile('logo.png');           // Buffer
 * const texto = await readFile('datos.txt', 'utf8');   // string
 * await writeFile('salida.json', JSON.stringify(obj, null, 2), 'utf8');
 * await appendFile('app.log', `${new Date().toISOString()} inicio\n`);
 * await mkdir(join('reportes', '2026'), { recursive: true });
 *
 * const datos: unknown = JSON.parse(texto);           // de `any` a `unknown`
 *
 * function esErrorDeSistema(e: unknown): e is NodeJS.ErrnoException {
 *     return e instanceof Error && 'code' in e;
 * }
 *
 * const lineas = createInterface({ input: createReadStream('ventas.csv'), crlfDelay: Infinity });
 * for await (const linea of lineas) { }                // linea: string
 *
 * // Con module commonjs no hay `await` de nivel superior: envuelve en
 * // `async function main(): Promise<void>` y llama `main().catch(...)`.
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un servicio de inventario persiste sus productos en un archivo
 * JSON dentro de una carpeta temporal. Escribe de forma atómica (archivo
 * temporal + `rename`), trata la ausencia del archivo (`ENOENT`) como "primer
 * arranque", valida cada registro leído con un predicado de tipo, deja un log
 * de auditoría y limpia todo en `finally`.
 *
 * import { mkdtemp, writeFile, readFile, rename, rm, appendFile, readdir } from 'node:fs/promises';
 * import { tmpdir } from 'node:os';
 * import { join, basename, extname } from 'node:path';
 *
 * interface Producto { readonly sku: string; readonly nombre: string; readonly stock: number; }
 * interface Carga { readonly productos: readonly Producto[]; readonly descartados: number; }
 *
 * function esProducto(x: unknown): x is Producto {
 *     if (typeof x !== 'object' || x === null) return false;
 *     const { sku, nombre, stock } = x as Record<string, unknown>;
 *     return typeof sku === 'string' && typeof nombre === 'string'
 *         && typeof stock === 'number' && Number.isInteger(stock) && stock >= 0;
 * }
 *
 * function esErrorDeSistema(e: unknown): e is NodeJS.ErrnoException {
 *     return e instanceof Error && 'code' in e;
 * }
 *
 * async function escribirJsonAtomico(ruta: string, datos: unknown): Promise<void> {
 *     const temporal = `${ruta}.tmp`;
 *     await writeFile(temporal, JSON.stringify(datos, null, 2), 'utf8');
 *     await rename(temporal, ruta);              // nadie lee un archivo a medias
 * }
 *
 * async function cargarInventario(ruta: string): Promise<Carga> {
 *     try {
 *         const datos: unknown = JSON.parse(await readFile(ruta, 'utf8'));
 *         if (!Array.isArray(datos)) throw new TypeError(`${ruta} no contiene un arreglo`);
 *         const lista: readonly unknown[] = datos;
 *         const productos = lista.filter(esProducto);
 *         return { productos, descartados: lista.length - productos.length };
 *     } catch (e: unknown) {
 *         if (esErrorDeSistema(e) && e.code === 'ENOENT') return { productos: [], descartados: 0 };
 *         throw e;                                 // JSON corrupto, permisos... se propagan
 *     }
 * }
 *
 * async function main(): Promise<void> {
 *     const dir = await mkdtemp(join(tmpdir(), 'inventario-'));
 *     const ruta = join(dir, 'inventario.json');
 *     try {
 *         console.log(`Primer arranque: ${(await cargarInventario(ruta)).productos.length} productos`);
 *         await escribirJsonAtomico(ruta, [
 *             { sku: 'TEC-001', nombre: 'Teclado mecánico', stock: 14 },
 *             { sku: 'MOU-002', nombre: 'Mouse inalámbrico', stock: -3 },   // inválido
 *             { sku: 'MON-003', nombre: 'Monitor 27"', stock: 5 },
 *             { nombre: 'Sin SKU', stock: 1 },                               // inválido
 *         ]);
 *         const { productos, descartados } = await cargarInventario(ruta);
 *         console.log(`Descartados: ${descartados}`);
 *         for (const p of productos) console.log(`${p.sku.padEnd(8)} ${p.nombre.padEnd(18)} ${p.stock}`);
 *         await appendFile(join(dir, 'auditoria.log'), `carga ok: ${productos.length}\n`, 'utf8');
 *         console.log((await readdir(dir)).sort().join(', '));
 *         console.log(basename(ruta), extname(ruta));
 *     } finally {
 *         await rm(dir, { recursive: true, force: true });   // limpieza garantizada
 *     }
 * }
 *
 * main().catch((e: unknown) => {
 *     console.error(e);
 *     process.exitCode = 1;
 * });
 *
 * // Salida esperada:
 * // Primer arranque: 0 productos
 * // Descartados: 2
 * // TEC-001  Teclado mecánico   14
 * // MON-003  Monitor 27"        5
 * // auditoria.log, inventario.json
 * // inventario.json .json
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA `JSON.parse(texto) as Config`: la aserción no valida nada. Recibe
 *   `unknown` y valida (predicado, Zod, Valibot). Un archivo editado a mano
 *   romperá tu app en el peor momento.
 * - NO USES `readFileSync`/`writeFileSync` EN SERVIDORES: bloquean el event
 *   loop para todas las peticiones. Solo en scripts de arranque o CLIs.
 * - ESPECIFICA LA CODIFICACIÓN (`'utf8'`): sin ella obtienes `Buffer` y
 *   `JSON.parse(buffer)` funciona "por casualidad" vía `toString()`.
 * - PREVIENE PATH TRAVERSAL: si el nombre viene del usuario, resuelve con
 *   `resolve(base, nombre)` y verifica que el resultado empiece por la base;
 *   rechaza `'../../etc/passwd'`.
 * - ESCRITURA ATÓMICA: escribir directamente sobre el archivo final deja un
 *   JSON truncado si el proceso muere a mitad. Escribe a `.tmp` y `rename`.
 * - EVITA "COMPROBAR Y LUEGO ABRIR" (`access` + `readFile`): hay condición de
 *   carrera. Intenta la operación y maneja `ENOENT` en el `catch`.
 * - ARCHIVOS GRANDES = STREAMS: `readFile` de un log de 4 GB agota la memoria.
 * - LIMPIA LOS TEMPORALES en `finally` con `rm(dir, { recursive: true,
 *   force: true })`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Notas rápidas: `agregarNota(ruta: string, texto: string): Promise<void>`
 *    con `appendFile` y marca de tiempo ISO, y `leerNotas` que devuelva
 *    `readonly string[]` (una por línea, sin líneas vacías).
 * 2. Buffer vs string: lee el mismo archivo con y sin `'utf8'`, inspecciona
 *    los tipos en el editor y muestra `buffer.length` frente a `texto.length`
 *    con un texto que tenga tildes.
 * 3. Rutas portables: con `node:path` obtén nombre, extensión y carpeta de
 *    `'reportes/2026/ventas-octubre.csv'` y construye la ruta de un `.json`
 *    hermano.
 *
 * [Intermedio]
 * 4. Config validada: `cargarConfig(ruta): Promise<Config>` que lea JSON,
 *    valide con un predicado `esConfig` y lance un error descriptivo con
 *    `cause` si el JSON está corrupto.
 * 5. Exportar CSV: `exportarCsv(ruta, filas: readonly Venta[])` que escape
 *    comas y comillas, y cree la carpeta destino con `mkdir({ recursive })`.
 * 6. Manejo de errores de sistema: distingue `ENOENT`, `EACCES` y `EISDIR`
 *    con `esErrorDeSistema` y devuelve un `Result<string, string>`.
 * 7. Listado recursivo: `listarArchivos(dir: string, ext: string):
 *    Promise<string[]>` usando `readdir(dir, { withFileTypes: true })`.
 *
 * [Senior / Producción]
 * 8. Streaming de logs: procesa un log de 1 000 000 de líneas con
 *    `createReadStream` + `readline` y cuenta errores por código HTTP en un
 *    `Map<number, number>` sin cargar el archivo en memoria.
 * 9. Repositorio JSON atómico: `class RepositorioJson<T>` con validador
 *    inyectado (`(x: unknown) => x is T`), escritura atómica y una cola que
 *    serialice escrituras concurrentes.
 * 10. Subida segura: `guardarSubida(base: string, nombreUsuario: string,
 *     datos: Buffer)` que bloquee path traversal, limite el tamaño, verifique
 *     la extensión contra una lista blanca y nunca sobrescriba (`flag: 'wx'`).
 */

// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.

export {}; // Convierte el archivo en módulo para evitar choques de nombres entre temas.
