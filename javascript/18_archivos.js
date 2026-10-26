'use strict';

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const readline = require('node:readline');

/*
 * ============================================================================
 * TEMA 18: LECTURA, ESCRITURA Y STREAMING SEGURO DE ARCHIVOS EN NODE.JS
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de I/O y Event Loop en Node.js)
 * ----------------------------------------------------------------------------
 * En Node.js, el módulo nativo `node:fs` ofrece tres formas de trabajar con el
 * sistema de archivos, y elegir la incorrecta puede congelar tu servidor o
 * derribarlo por falta de memoria RAM:
 *
 * 1) **APIs Síncronas (`fs.readFileSync`, `fs.writeFileSync`)**:
 *    **Bloquean por completo el hilo único del Event Loop** hasta que el disco
 *    responda. Solo son aceptables en scripts CLI cortos o al iniciar la
 *    aplicación antes de escuchar peticiones HTTP. ¡Prohibido usarlas dentro de
 *    rutas web concurrentes!
 * 2) **APIs Asíncronas basadas en Promesas (`node:fs/promises` - `fsp.readFile`, `fsp.writeFile`)**:
 *    No bloquean el Event Loop (delegan la lectura al pool de hilos de `libuv`),
 *    pero cargan **todo el archivo completo en la memoria RAM**. Ideales para
 *    archivos pequeños (< 5 MB).
 * 3) **Streams y `readline` Asíncrono (`fs.createReadStream` + `for await...of`)**:
 *    Procesan el archivo en fragmentos (*chunks* de ~64 KB) o línea por línea
 *    aplicando **Backpressure** (contrapresión automática). Permiten procesar un
 *    archivo de **20 GB consumiendo solo ~10 MB de RAM**!
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Construcción de Rutas Multiplataforma (`node:path`): Usar `path.join()` y
 *   `path.resolve()` en lugar de concatenar `'/'` o `'\\'` a mano.
 * - Procesamiento de Logs y CSV Gigantes (`readline.createInterface` + `for await`):
 *   Leer millones de líneas sin desbordar el Heap de V8.
 * - Defensa contra *Path Traversal* (OWASP): Verificar que la ruta resuelta
 *   comience estrictamente por el directorio base permitido.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (Node.js Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Rutas seguras multiplataforma con node:path y directorio temporal:
 * const rutaArchivo = path.join(os.tmpdir(), 'practica_js.txt');
 *
 * // 2. Escritura y lectura asíncrona con node:fs/promises (archivos pequeños):
 * // await fsp.writeFile(rutaArchivo, 'Línea 1\n', 'utf8');
 * // await fsp.appendFile(rutaArchivo, 'Línea 2\n', 'utf8');
 * // const contenido = await fsp.readFile(rutaArchivo, 'utf8');
 *
 * // 3. Lectura línea por línea en Streaming O(1) RAM con for await...of:
 * async function contarLineasStreaming(ruta) {
 *     const flujo = fs.createReadStream(ruta, { encoding: 'utf8' });
 *     const lector = readline.createInterface({ input: flujo, crlfDelay: Infinity });
 *     let total = 0;
 *     for await (const _linea of lector) {
 *         total++;
 *     }
 *     return total;
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Crear un archivo temporal de transacciones, procesarlo línea por
 * línea en streaming asíncrono sumando los montos y eliminar el archivo en
 * `finally`.
 *
 * async function demoProcesamientoArchivo() {
 *     const rutaTemp = path.join(os.tmpdir(), `tx_${Date.now()}.csv`);
 *     try {
 *         await fsp.writeFile(rutaTemp, 'TX-1,120.50\nTX-2,79.50\nTX-3,50.00\n', 'utf8');
 *
 *         const rl = readline.createInterface({
 *             input: fs.createReadStream(rutaTemp, { encoding: 'utf8' }),
 *             crlfDelay: Infinity,
 *         });
 *
 *         let suma = 0;
 *         for await (const linea of rl) {
 *             if (!linea.trim()) continue;
 *             const [, montoTxt] = linea.split(',');
 *             suma += Number(montoTxt);
 *         }
 *         console.log(`Total procesado en streaming: $${suma.toFixed(2)}`);
 *     } finally {
 *         await fsp.rm(rutaTemp, { force: true });
 *     }
 * }
 * // demoProcesamientoArchivo();
 * // Salida esperada:
 * // Total procesado en streaming: $250.00
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en Node.js)
 * ----------------------------------------------------------------------------
 * - NUNCA USES `fs.existsSync` ANTES DE ABRIR O LEER UN ARCHIVO (*TOCTOU Race Condition*):
 *   Entre el instante en que preguntas si existe y el instante en que lo lees,
 *   otro proceso puede borrarlo. Intenta directamente la operación (`readFile`,
 *   `open`) y maneja `error.code === 'ENOENT'` en el bloque `catch`.
 * - SIEMPRE ESPECIFICA `'utf8'` AL LEER TEXTO: Si omites la codificación en
 *   `fsp.readFile(ruta)`, devuelve un objeto binario `Buffer` en lugar de un `string`.
 * - PREVENCIÓN DE *PATH TRAVERSAL*: `path.join('/base', '../../etc/passwd')`
 *   resuelve fuera de `/base`! Siempre normaliza con `path.resolve(baseDir, input)`
 *   y verifica que `rutaResuelta.startsWith(path.resolve(baseDir) + path.sep)`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Escritura, lectura y limpieza con `node:fs/promises`: Escribe una nota en
 *    un archivo temporal dentro de `os.tmpdir()`, léela con `fsp.readFile`,
 *    consulta su tamaño en bytes con `fsp.stat` y bórrala en `finally`.
 * 2. Bitácora incremental con `fsp.appendFile`: Implementa `registrarLogDisco(ruta, mensaje)`
 *    que agregue una línea con timestamp ISO-8601 sin sobrescribir lo anterior.
 * 3. Manejo del código `'ENOENT'`: Intenta leer un archivo que no existe con
 *    `fsp.readFile` y captura específicamente `err.code === 'ENOENT'` para
 *    devolver un valor por defecto sin estallar.
 *
 * [Intermedio]
 * 4. Procesamiento en Streaming con `readline` y `for await...of`: Crea un
 *    archivo de 100 líneas de prueba y recórrelo en streaming contando cuántas
 *    líneas contienen la palabra `'ERROR'` y cuántas palabras hay en total.
 * 5. Copia y respaldo de archivos con `fsp.copyFile` y `fsp.mkdir`: Crea un
 *    subdirectorio temporal con `fsp.mkdir(dir, { recursive: true })` y copia
 *    allí un archivo de configuración.
 * 6. Listado y filtrado de directorio con `fsp.readdir(dir, { withFileTypes: true })`:
 *    Lista todos los archivos `.js` de `__dirname` distinguiendo archivos
 *    (`dirent.isFile()`) de carpetas (`dirent.isDirectory()`).
 * 7. Persistencia de estado en JSON: Implementa `guardarJson(ruta, datos)` y
 *    `cargarJson(ruta, porDefecto)` con formato indentado (`JSON.stringify(d, null, 2)`).
 *
 * [Senior / Producción]
 * 8. Defensa contra *Path Traversal* (Seguridad OWASP): Implementa
 *    `resolverRutaSegura(directorioBase, nombreSolicitado)` que use `path.resolve`
 *    y lance un `Error` de seguridad si el usuario intenta escapar del directorio
 *    con `"../01_variables.js"` o rutas absolutas.
 * 9. Escritura Atómica (*Write-Temp-Then-Rename*): Implementa
 *    `escribirArchivoAtomico(rutaDestino, contenido)` que escriba primero en un
 *    archivo `.tmp` en la misma carpeta y luego ejecute `await fsp.rename(rutaTmp, rutaDestino)`
 *    para evitar archivos corruptos si el proceso se apaga a mitad de escritura.
 * 10. Pipeline de Transformación con `stream/promises` (`pipeline`): Usa
 *     `stream.pipeline` y un `Transform` stream (o función generadora asíncrona
 *     `async function*`) para leer un archivo de entrada, transformar cada trozo
 *     a mayúsculas en vuelo y escribirlo en un archivo de salida con manejo
 *     automático de *backpressure*.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
