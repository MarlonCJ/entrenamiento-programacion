<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 03: ENTRADA, SALIDA, FORMATEO ESTRICTO Y FLUJOS ESTÁNDAR (CLI STREAMS)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Streams en PHP CLI)
 * ----------------------------------------------------------------------------
 * En herramientas de consola (Artisan en Laravel, Symfony Console, scripts ETL,
 * cronjobs y contenedores Docker), un programa se comunica con el sistema
 * operativo a través de tres descriptores de flujo estándar (*Standard Streams*):
 * - **`STDIN` (`php://stdin`, descriptor 0)**: Flujo de entrada estándar.
 * - **`STDOUT` (`php://stdout`, descriptor 1)**: Flujo de salida normal (`echo`,
 *   `print`, `printf`, `fwrite(STDOUT, ...)`).
 * - **`STDERR` (`php://stderr`, descriptor 2)**: Flujo exclusivo para errores y
 *   diagnósticos (`fwrite(STDERR, ...)`).
 *
 * ¿Por qué importa separar `STDOUT` de `STDERR` en Producción?
 * Cuando un script se ejecuta en un pipeline de Linux o Docker (`php reporte.php > salida.csv`),
 * todo lo que envíes por `STDOUT` (`echo`) irá a parar dentro del archivo CSV.
 * Si ocurre una advertencia y la imprimes con `echo`, corromperás el archivo CSV!
 * Los errores siempre deben escribirse en `STDERR`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Comandos CLI y Tareas Programadas (Cronjobs): Procesar argumentos de línea
 *   de comandos (`$argv`, `getopt()`) y emitir reportes alineados en consola.
 * - Generación de Extractos y Tablas Financieras (`sprintf` / `printf`):
 *   Formatear columnas con relleno a la izquierda/derecha, signos y decimales
 *   exactos.
 * - Plantillas Multilínea Limpias (Heredoc `<<<TXT` y Nowdoc `<<<'TXT'`):
 *   Construir bloques de texto, correos o reportes con indentación limpia.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Salida formateada con sprintf / printf:
 * // %s = string, %d = entero, %.2f = float con 2 decimales, %-15s = alineado izq 15 chars
 * $linea = sprintf("| %-15s | %6d | %10.2f |", "Teclado", 3, 25.5);
 * echo $linea . PHP_EOL;
 *
 * // 2. Escribir errores en el flujo correcto (STDERR):
 * fwrite(STDERR, "[ERROR] No se pudo conectar al servidor." . PHP_EOL);
 *
 * // 3. Lectura interactiva no vacía con valores por defecto (en modo CLI):
 * // $entrada = trim((string) fgets(STDIN));
 *
 * // 4. Heredoc con indentación moderna (PHP 7.3+):
 * $resumen = <<<REPORTE
 *     =============================
 *     Resumen de Ejecución
 *     Estado: OK
 *     =============================
 *     REPORTE;
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un generador de recibos de caja por consola formatea una tabla
 * perfectamente alineada con `sprintf` sin importar la longitud del nombre del
 * producto.
 *
 * $items = [
 *     ['nombre' => 'Licencia Anual IDE', 'cant' => 1, 'precio' => 149.00],
 *     ['nombre' => 'Soporte Prioritario', 'cant' => 2, 'precio' => 45.50],
 * ];
 *
 * $separador = str_repeat('-', 48);
 * echo $separador . PHP_EOL;
 * echo sprintf("| %-22s | %4s | %12s |", "CONCEPTO", "CANT", "SUBTOTAL") . PHP_EOL;
 * echo $separador . PHP_EOL;
 *
 * $granTotal = 0.0;
 * foreach ($items as $item) {
 *     $sub = $item['cant'] * $item['precio'];
 *     $granTotal += $sub;
 *     echo sprintf("| %-22s | %4d | $%11.2f |", $item['nombre'], $item['cant'], $sub) . PHP_EOL;
 * }
 * echo $separador . PHP_EOL;
 * echo sprintf("| %-29s | $%11.2f |", "TOTAL A PAGAR", $granTotal) . PHP_EOL;
 * echo $separador . PHP_EOL;
 *
 * // Salida esperada:
 * // ------------------------------------------------
 * // | CONCEPTO               | CANT |     SUBTOTAL |
 * // ------------------------------------------------
 * // | Licencia Anual IDE     |    1 | $     149.00 |
 * // | Soporte Prioritario    |    2 | $      91.00 |
 * // ------------------------------------------------
 * // | TOTAL A PAGAR                 | $     240.00 |
 * // ------------------------------------------------
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - PREFIERE `sprintf()` SOBRE `printf()` O `echo` DIRECTO DENTRO DE LA LÓGICA:
 *   Si una función devuelve el `string` formateado con `sprintf()` en lugar de
 *   imprimirlo con `echo`, puedes probarla fácilmente en tests unitarios y
 *   reutilizarla para enviar el texto por correo o guardarlo en un archivo.
 * - USA SIEMPRE `PHP_EOL` PARA SALTOS DE LÍNEA EN CONSOLA: Garantiza compatibilidad
 *   nativa entre Linux/macOS (`\n`) y Windows (`\r\n`).
 * - CUIDADO CON CARACTERES MULTIBYTE (UTF-8 / Tildes) EN `sprintf("%-20s")`:
 *   `sprintf` cuenta **bytes**, no caracteres visuales. En UTF-8, `'á'` ocupa
 *   2 bytes, lo que puede desalinear tablas por 1 espacio. En reportes con
 *   acentos se compensa con `mb_strlen()`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Formateo con `sprintf`: Crea una función `formatearCredencial(string $nombre, string $cargo, int $id): string`
 *    que devuelva el ID rellenado con ceros a 5 dígitos (`%05d`), ej.
 *    `"[#00042] Ana Pérez - Ingeniera Backend"`.
 * 2. Uso de Heredoc y Nowdoc: Genera una plantilla de notificación usando Heredoc
 *    (interpolando variables) y un bloque de consulta SQL literal usando Nowdoc
 *    (sin interpolar símbolos `$`).
 * 3. Formateo monetario internacional: Usa `number_format()` y `sprintf()` para
 *    mostrar un mismo monto float (`1234567.891`) en formato estadounidense
 *    (`1,234,567.89`) y en formato europeo/latinoamericano (`1.234.567,89`).
 *
 * [Intermedio]
 * 4. Función de lectura segura con fallback: Crea `leerEntradaConsola(string $prompt, string $porDefecto, ?string $entradaSimulada = null): string`
 *    que permita pasar una entrada simulada para pruebas o leer de `STDIN`
 *    limpiando espacios con `trim()`.
 * 5. Separación de `STDOUT` y `STDERR`: Crea un pequeño logger de consola con
 *    funciones `logInfo(string $msg)` (escribe en `STDOUT`) y `logError(string $msg)`
 *    (escribe en `STDERR` con timestamp ISO-8601).
 * 6. Parseo de cadena con `sscanf()`: Dada una línea de registro con formato fijo
 *    `"ORD-2026-0098 | CANT:4 | TOTAL:199.95"`, extrae el código, la cantidad
 *    entera y el total flotante usando `sscanf()`.
 * 7. Barra de progreso en consola: Crea una función `renderizarBarraProgreso(int $actual, int $total, int $ancho = 20): string`
 *    que devuelva por ejemplo `"[##########..........]  50.0%"`.
 *
 * [Senior / Producción]
 * 8. Alineador de tablas compatible con UTF-8 (`padMultibyte`): Implementa una
 *    función auxiliar que rellene cadenas con espacios teniendo en cuenta
 *    `mb_strlen($texto, 'UTF-8')` para que palabras con tildes (`"Bogotá"`,
 *    `"Crédito"`) nunca desalineen las columnas de una tabla CLI.
 * 9. Procesador de argumentos CLI (`$argv` / banderas): Implementa una función
 *    `parsearArgumentosCli(array $argv): array` que convierta argumentos como
 *    `['script.php', '--env=prod', '--limit=50', '--dry-run']` en un arreglo
 *    asociativo estructurado `['env' => 'prod', 'limit' => '50', 'dry-run' => true]`.
 * 10. Captura de buffer de salida (`ob_start` / `ob_get_clean`): Envuelve una
 *     función legada que usa `echo` directamente usando el control de buffer de
 *     salida de PHP (`ob_start()` y `ob_get_clean()`) para capturar su salida
 *     como un `string` sin que se imprima en pantalla.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
