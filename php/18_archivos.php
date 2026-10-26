<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 18: LECTURA, ESCRITURA Y STREAMING SEGURO DE ARCHIVOS (SPL Y FLOCK)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de I/O y Memoria en PHP)
 * ----------------------------------------------------------------------------
 * Al trabajar con el sistema de archivos en PHP existen dos enfoques con un
 * impacto radicalmente distinto en la memoria RAM del servidor:
 *
 * 1) **Operaciones en Memoria Completa (`file_get_contents`, `file_put_contents`, `file`)**:
 *    Cargan o escriben todo el archivo de golpe. Son ideales y muy cómodas para
 *    archivos pequeños (< 5 MB, como archivos de configuración JSON o plantillas),
 *    usando banderas como `LOCK_EX` (bloqueo exclusivo de escritura) y `FILE_APPEND`.
 * 2) **Operaciones en Streaming Línea por Línea (`fopen`/`fgets`, `SplFileObject` + `yield`)**:
 *    Si intentas leer un archivo CSV o un log de producción de 1 GB con
 *    `file_get_contents()` o `file()`, PHP agotará inmediatamente su `memory_limit`
 *    (habitualmente 128MB) y morirá con un *Fatal Error: Allowed memory size
 *    exhausted*. Usando `fopen()` / `fgets()` o `SplFileObject` combinado con un
 *    generador (`yield`), puedes procesar un archivo de **50 GB consumiendo menos
 *    de 1 MB de RAM**!
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Importación y Exportación de CSV Masivos (`fgetcsv` / `fputcsv` / `SplFileObject`):
 *   Procesar catálogos de cientos de miles de productos en streaming.
 * - Registro de Logs Concurrentes (`file_put_contents` con `FILE_APPEND | LOCK_EX`):
 *   Evitar que dos peticiones web simultáneas mezclen sus bytes al escribir en
 *   el mismo archivo de bitácora.
 * - Prevención de Vulnerabilidad *Path Traversal* (`basename`, `realpath`):
 *   Bloquear ataques donde el usuario solicita descargar `"../../.env"`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Escritura atómica/segura con bloqueo exclusivo y lectura rápida:
 * $ruta = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'notas_practica.txt';
 * file_put_contents($ruta, "Primera línea" . PHP_EOL, LOCK_EX);
 * file_put_contents($ruta, "Segunda línea" . PHP_EOL, FILE_APPEND | LOCK_EX);
 *
 * // 2. Streaming con cierre garantizado en finally (O(1) memoria RAM):
 * function leerLineasEnStreaming(string $ruta): Generator {
 *     if (!is_readable($ruta)) {
 *         throw new RuntimeException("No se puede leer el archivo: {$ruta}");
 *     }
 *     $handle = fopen($ruta, 'rb');
 *     if ($handle === false) {
 *         throw new RuntimeException("Fallo al abrir: {$ruta}");
 *     }
 *     try {
 *         while (($linea = fgets($handle)) !== false) {
 *             yield rtrim($linea, "\r\n");
 *         }
 *     } finally {
 *         fclose($handle); // Se cierra incluso si el consumidor rompe el bucle con break!
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Escribir un archivo CSV temporal de ventas usando `fputcsv`,
 * procesarlo en streaming con `fgetcsv` sumando los totales y limpiar el archivo
 * temporal en `finally`.
 *
 * $archivoCsv = tempnam(sys_get_temp_dir(), 'ventas_');
 * try {
 *     $fp = fopen($archivoCsv, 'wb');
 *     fputcsv($fp, ['ID', 'CONCEPTO', 'MONTO']);
 *     fputcsv($fp, ['1', 'Suscripción Pro', '49.90']);
 *     fputcsv($fp, ['2', 'Soporte Extra', '20.10']);
 *     fclose($fp);
 *
 *     $lectura = fopen($archivoCsv, 'rb');
 *     $encabezado = fgetcsv($lectura);
 *     $suma = 0.0;
 *     while (($fila = fgetcsv($lectura)) !== false) {
 *         $suma += (float) $fila[2];
 *     }
 *     fclose($lectura);
 *
 *     echo sprintf("CSV procesado con éxito. Total: $%.2f", $suma) . PHP_EOL;
 * } finally {
 *     if (is_file($archivoCsv)) {
 *         unlink($archivoCsv);
 *     }
 * }
 * // Salida esperada:
 * // CSV procesado con éxito. Total: $70.00
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - USA SIEMPRE `try / finally` AL ABRIR PUNTEROS CON `fopen()`: Si ocurre una
 *   excepción mientras procesas una línea o si usas un `Generator` (`yield`) y
 *   el llamador hace `break` a mitad del archivo, solo el bloque `finally`
 *   garantiza que `fclose($handle)` se ejecute sin fugas de descriptores.
 * - NUNCA CONSTRUYAS UN CSV CONCATENANDO COMAS MANUALMENTE (`"$a,$b\n"`):
 *   Si un nombre o descripción contiene una coma `,` o comillas `"`, romperás
 *   todas las columnas del CSV! Usa siempre `fputcsv()` y `fgetcsv()`.
 * - PREVENCIÓN DE *CSV INJECTION* (Formula Injection en Excel): Si exportas un
 *   CSV que se abrirá en Excel y un usuario malicioso guardó como nombre
 *   `=CMD|'/C calc'!A0` (empieza con `=`, `+`, `-` o `@`), Excel puede ejecutarlo
 *   como fórmula. Prefija una comilla simple `'` si el texto empieza con esos signos.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Creación, lectura y borrado en directorio temporal: Crea un archivo dentro
 *    de `sys_get_temp_dir()`, escribe 3 frases con `file_put_contents(..., LOCK_EX)`,
 *    léelo con `file_get_contents()`, verifica su tamaño con `filesize()` y
 *    elimínalo con `unlink()`.
 * 2. Bitácora incremental (`FILE_APPEND | LOCK_EX`): Crea una función
 *    `escribirLog(string $ruta, string $nivel, string $mensaje): void` que agregue
 *    eventos al final del archivo sin borrar el historial anterior.
 * 3. Conteo de líneas, palabras y caracteres en streaming: Recorre un archivo
 *    línea por línea con `fopen` / `fgets` y calcula cuántas líneas no vacías tiene.
 *
 * [Intermedio]
 * 4. Generador de lectura perezosa (`yield`): Implementa `leerArchivoPerezoso(string $ruta): Generator`
 *    con `try / finally` y úsalo para encontrar las primeras 3 líneas que
 *    contengan `"[ERROR]"` deteniendo la lectura inmediatamente con `break`.
 * 5. Exportador e Importador CSV con `fputcsv` y `fgetcsv`: Guarda un arreglo
 *    de productos (incluyendo uno cuyo nombre tenga comas, ej. `"Cable HDMI, 2m"`)
 *    y vuélvelo a leer convirtiendo cada fila en un arreglo asociativo usando
 *    los encabezados con `array_combine($headers, $fila)`.
 * 6. Uso orientado a objetos con `SplFileObject`: Abre un archivo temporal usando
 *    `new SplFileObject($ruta, 'r')` con las banderas `SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY`
 *    y recórrelo con `foreach`.
 * 7. Exploración segura de directorios con `DirectoryIterator` o `FilesystemIterator`:
 *    Lista todos los archivos `.php` del directorio actual (`__DIR__`) mostrando
 *    su nombre y tamaño en KB.
 *
 * [Senior / Producción]
 * 8. Defensa contra *Path Traversal* (Seguridad OWASP): Implementa
 *    `obtenerRutaSeguraDentroDeBase(string $directorioBase, string $rutaSolicitada): string`
 *    usando `realpath()` y `str_starts_with()` para rechazar con `SecurityException`
 *    (o `DomainException`) cualquier intento de salir del directorio como `"../01_variables.php"`.
 * 9. Escritura Atómica (*Write-Temp-Then-Rename*): Implementa `guardarArchivoAtomico(string $rutaDestino, string $contenido): void`
 *    que escriba primero en un archivo temporal en el mismo directorio y luego
 *    ejecute `rename($temp, $rutaDestino)` para garantizar que ningún lector vea
 *    jamás el archivo a medio escribir.
 * 10. Sanitizador contra *CSV Formula Injection*: Implementa un exportador CSV
 *     corporativo que neutralice valores que comiencen por `=`, `+`, `-` o `@`
 *     antes de pasarlos a `fputcsv()`, garantizando seguridad al abrir en Excel.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
