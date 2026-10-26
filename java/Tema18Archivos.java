import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

/*
 * ============================================================================
 * TEMA 18: LECTURA, ESCRITURA Y PROCESAMIENTO SEGURO DE ARCHIVOS (JAVA NIO.2)
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * La API moderna `java.nio.file` (NIO.2: `Path`, `Files`, `Paths`) introducida
 * en Java 7+ reemplaza a la antigua clase `java.io.File` (que ocultaba errores
 * devolviendo booleanos y tenia problemas entre sistemas operativos).
 *
 * Modelo Mental en Memoria y Sistema Operativo:
 * - `Path`: Es un objeto INMUTABLE que representa una ruta logica en el sistema
 *   de archivos; crear un `Path` no toca el disco duro.
 * - Lectura en Memoria vs Streaming (Flujo perezoso):
 *   1) Archivos pequenos (< 10 MB, ej. configuracion): `Files.readString(ruta)`
 *      o `Files.readAllLines(ruta)` cargan todo el archivo en el Heap de una vez.
 *   2) Archivos grandes (100 MB - 50 GB, ej. logs de produccion o CSV masivos):
 *      Usar `readAllLines` provocara un `OutOfMemoryError`! En su lugar se usa
 *      `Files.lines(ruta)` o `Files.newBufferedReader(ruta)` dentro de un bloque
 *      `try-with-resources`, que lee linea por linea usando un buffer pequeno
 *      (~8 KB) y cierra el descriptor de archivo del sistema operativo al salir.
 * - Codificacion explicita: Siempre especifica `StandardCharsets.UTF_8` (aunque
 *   desde Java 18+ UTF-8 es el charset por defecto).
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Procesamiento de lotes (Batch ETL): Leer millones de lineas de un CSV de
 *   conciliacion bancaria con `try (Stream<String> lineas = Files.lines(ruta))`.
 * - Escritura atomica y segura de reportes: Escribir primero en un archivo
 *   temporal (`.tmp`) y luego moverlo atomicamente con `Files.move(..., ATOMIC_MOVE)`
 *   para que ningun otro proceso lea un archivo a medio escribir.
 * - Prevencion de vulnerabilidad Path Traversal (OWASP): Normalizar rutas con
 *   `rutaBase.resolve(nombreUsuario).normalize()` y verificar con `.startsWith(rutaBase)`
 *   que el usuario no haya enviado `"../../etc/passwd"`.
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // 1. Escritura y agregado seguro de texto en UTF-8:
 * Path ruta = Path.of("reporte.txt");
 * Files.writeString(ruta, "Encabezado\n", StandardCharsets.UTF_8);
 * Files.writeString(ruta, "Linea adicional\n", StandardCharsets.UTF_8,
 *         StandardOpenOption.CREATE, StandardOpenOption.APPEND);
 *
 * // 2. Lectura completa (solo archivos pequenos):
 * if (Files.exists(ruta)) {
 *     String texto = Files.readString(ruta, StandardCharsets.UTF_8);
 * }
 *
 * // 3. Lectura en streaming para archivos grandes (O(1) en memoria RAM):
 * try (var flujo = Files.lines(ruta, StandardCharsets.UTF_8)) {
 *     long totalErrores = flujo.filter(l -> l.contains("[ERROR]")).count();
 * }
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un procesador de auditoria crea un archivo temporal de transacciones,
 * escribe 3 registros, los procesa en streaming sumando los montos validos y
 * elimina el archivo temporal al finalizar.
 *
 * static void procesarTransaccionesDemo() throws IOException {
 *     Path archivoTemp = Files.createTempFile("transacciones_", ".csv");
 *     try {
 *         String datosCsv = "TX-01,150.50\nTX-02,49.50\nTX-03,300.00\n";
 *         Files.writeString(archivoTemp, datosCsv, StandardCharsets.UTF_8);
 *
 *         try (var lineas = Files.lines(archivoTemp, StandardCharsets.UTF_8)) {
 *             double total = lineas
 *                 .filter(l -> !l.isBlank())
 *                 .mapToDouble(l -> Double.parseDouble(l.split(",")[1]))
 *                 .sum();
 *             System.out.printf("Total procesado: %.2f%n", total);
 *         }
 *     } finally {
 *         Files.deleteIfExists(archivoTemp);
 *     }
 * }
 * // Salida esperada:
 * // Total procesado: 500.00
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - CUIDADO CON FUGAS DE DESCRIPTORES DE ARCHIVO (`Files.lines` y `Files.list`):
 *   A diferencia de `Collection.stream()`, los streams devueltos por `Files.lines(path)`,
 *   `Files.list(dir)` y `Files.walk(dir)` mantienen abierto un recurso de I/O
 *   del sistema operativo. DEBEN ir siempre dentro de `try (var s = Files.lines(p))`.
 * - NUNCA CONCATENES RUTAS CON `"/"` O `"\\"` MANUALMENTE: Usa `Path.of("carpeta", "sub", "archivo.txt")`
 *   o `rutaBase.resolve("archivo.txt")` para que funcione igual en Windows, Linux y macOS.
 * - PROTECCION CONTRA PATH TRAVERSAL: Si recibes un nombre de archivo externo,
 *   valida `Path destino = base.resolve(entrada).normalize(); if (!destino.startsWith(base)) throw new SecurityException();`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Basico]
 * 1. Escritura y lectura basica: Crea un archivo temporal o en memoria local,
 *    escribe 3 lineas con `Files.writeString`, leelo de vuelta y muestralo.
 * 2. Conteo de lineas y caracteres: Lee un archivo de texto y muestra cuantas
 *    lineas tiene y el total de caracteres (sin contar saltos de linea).
 * 3. Registro de bitacora incremental (`APPEND`): Crea un metodo `registrarEvento(Path ruta, String mensaje)`
 *    que agregue una nueva linea al final del archivo sin borrar el contenido previo.
 *
 * [Intermedio]
 * 4. Procesamiento de CSV de gastos en Streaming: Escribe un archivo con lineas
 *    `"CONCEPTO,MONTO"`, leelo con `try (var s = Files.lines(...))` y calcula la
 *    suma total, el gasto promedio y el gasto maximo.
 * 5. Copia y respaldo verificando existencia: Implementa `hacerBackup(Path origen, Path destino)`
 *    que verifique si `origen` existe (`Files.exists`) y lo copie usando
 *    `Files.copy(..., StandardCopyOption.REPLACE_EXISTING)`.
 * 6. Filtrado de logs de error: Dado un archivo de log con lineas `[INFO]`,
 *    `[WARN]` y `[ERROR]`, extrae unicamente las lineas `[ERROR]` y guardalas
 *    en un segundo archivo `errores_filtrados.log`.
 * 7. Exploracion segura de directorio: Usa `try (var s = Files.list(directorio))`
 *    para listar solo los archivos `.java` del directorio actual junto con su
 *    tamano en bytes (`Files.size(p)`).
 *
 * [Senior / Produccion]
 * 8. Prevencion de Path Traversal (Seguridad OWASP): Implementa `resolverRutaSegura(Path directorioBase, String nombreArchivoUsuario)`
 *    que normalice la ruta y lance `SecurityException` si el archivo resuelto
 *    intenta escapar fuera de `directorioBase` (ej. `"../secreto.txt"`).
 * 9. Escritura Atomica Transaccional (Write-Temp-Then-Move): Implementa un
 *    metodo que escriba un reporte primero en un archivo temporal en el mismo
 *    directorio y luego lo renombre al archivo final con `StandardCopyOption.REPLACE_EXISTING`
 *    y `StandardCopyOption.ATOMIC_MOVE`.
 * 10. Analizador de frecuencia de palabras en archivos grandes: Usando
 *     `Files.lines`, `flatMap` y `Collectors.groupingBy`, encuentra las 5
 *     palabras mas repetidas en un archivo de texto sin cargar todo el archivo
 *     en una sola lista en memoria.
 */
public class Tema18Archivos {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
    }
}
