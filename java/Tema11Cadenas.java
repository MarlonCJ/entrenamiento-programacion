/*
 * ============================================================================
 * TEMA 11: CADENAS DE TEXTO (`String`, Text Blocks y `StringBuilder`)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * `java.lang.String` representa secuencias inmutables de caracteres Unicode.
 * Una vez creado un objeto `String` en memoria, su contenido JAMÁS puede cambiar:
 * cualquier método como `.toUpperCase()`, `.replace()` o `.strip()` fabrica y
 * devuelve un NUEVO objeto `String` en el Heap.
 *
 * Modelo Mental en la JVM:
 * - String Pool (String Interning): Los literales entre comillas (`"Hola"`) se
 *   almacenan en un caché especial del Heap para ahorrar memoria reutilizando
 *   instancias idénticas.
 * - Compact Strings (Java 9+): Internamente, `String` ya no usa siempre `char[]`
 *   (2 bytes por carácter), sino `byte[]` con codificación LATIN-1 (1 byte por
 *   carácter) cuando el texto no contiene caracteres especiales, reduciendo a la
 *   mitad el consumo de RAM de las aplicaciones Java.
 * - `StringBuilder`: Cuando necesitas concatenar texto dentro de un bucle, usar
 *   `+` crea cientos de objetos temporales descartables ($O(n^2)$). `StringBuilder`
 *   mantiene un arreglo mutable redimensionable en memoria ($O(n)$).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Limpieza y normalización de entradas de usuario (correos, nombres, teléfonos).
 * - Construcción dinámica de consultas, reportes CSV, logs o respuestas con
 *   `StringBuilder`.
 * - Escritura limpia de plantillas JSON, SQL o HTML multilínea usando Text Blocks
 *   (`""" ... """`, estándar desde Java 15 / 17 LTS).
 * - Extracción de tokens, prefijos, extensiones de archivos y validación de formatos.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * String raw = "  Ana.Gomez@Empresa.COM  ";
 * String limpio = raw.strip().toLowerCase();        // "ana.gomez@empresa.com" (Java 11+)
 * boolean vacio = raw.isBlank();                    // false (Java 11+: verifica espacios)
 * boolean esCorreo = limpio.contains("@") && limpio.endsWith(".com");
 * String usuario = limpio.substring(0, limpio.indexOf('@')); // "ana.gomez"
 *
 * // Construcción eficiente en bucles con StringBuilder
 * StringBuilder sb = new StringBuilder();
 * for (int i = 1; i <= 3; i++) {
 *     sb.append("Item-").append(i).append(" ");
 * }
 * String resultado = sb.toString().strip();         // "Item-1 Item-2 Item-3"
 *
 * // Text Blocks (Java 15+): cadenas multilínea sin escapar comillas ni \n
 * String json = """
 *         {
 *             "estado": "OK",
 *             "codigo": 200
 *         }
 *         """;
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Normalizador de correo corporativo y enmascaramiento de datos sensibles (PII).
 *
 * String nombre = "  Carlos  ";
 * String apellido = " Pérez ";
 * String dominio = "acmecorp.com";
 *
 * String email = (nombre.strip() + "." + apellido.strip() + "@" + dominio)
 *         .toLowerCase()
 *         .replace('é', 'e');
 *
 * String tarjeta = "4532015112830366";
 * String enmascarada = "*".repeat(12) + tarjeta.substring(12);
 *
 * System.out.println("Email: " + email + " | Tarjeta: " + enmascarada);
 *
 * Salida esperada:
 * Email: carlos.perez@acmecorp.com | Tarjeta: ************0366
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - Effective Java (Item 63): ¡Cuidado con el rendimiento de la concatenación de
 *   cadenas! Nunca uses `resultado += linea;` dentro de un bucle grande; usa
 *   siempre `StringBuilder`.
 * - Error común 1: Llamar a `texto.replace("a", "b");` sin guardar el retorno.
 *   Como `String` es inmutable, si no reasignas (`texto = texto.replace(...)`),
 *   el cambio se pierde.
 * - Error común 2: Confundir `.replace(CharSequence, CharSequence)` (texto literal)
 *   con `.replaceAll(String regex, String replacement)` (expresión regular).
 *   ` "a.b".replaceAll(".", "-") ` reemplaza TODOS los caracteres porque `.` en
 *   regex significa "cualquier carácter". Usa `.replace(".", "-")` para literales.
 * - Prefiere `.strip()` y `.isBlank()` (Java 11+, conscientes de espacios Unicode)
 *   sobre el antiguo `.trim()` e `.isEmpty()`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Recibe el nombre completo de una persona con espacios sobrantes a los lados,
 *    límpialo con `.strip()` y muestra su longitud real, su primera letra y su
 *    última letra.
 * 2. Recibe una frase y muéstrala en mayúsculas, en minúsculas y verifica si
 *    contiene una palabra clave ignorando mayúsculas/minúsculas.
 * 3. Cuenta cuántas vocales (mayúsculas o minúsculas, con o sin tilde) contiene
 *    una cadena de texto.
 *
 * [Intermedio]
 * 4. Cuenta cuántas veces aparece un carácter objetivo dentro de un texto sin
 *    distinguir entre mayúsculas y minúsculas.
 * 5. Invierte una cadena carácter por carácter usando un bucle y `StringBuilder`,
 *    y compáralo con `new StringBuilder(texto).reverse().toString()`.
 * 6. Determina si una frase es un palíndromo (ej. `"Anita lava la tina"`)
 *    ignorando espacios y diferencias entre mayúsculas y minúsculas.
 * 7. Convierte el título de un artículo (ej. `"  Curso de JAVA Moderno 21  "`)
 *    en un "slug" amigable para URL (`"curso-de-java-moderno-21"`).
 *
 * [Senior / Producción]
 * 8. Recibe una línea CSV (`"PROD-01, Teclado Mecánico , 89.99, 15"`), sepárala
 *    con `.split(",")`, limpia cada campo y construye un resumen formateado.
 * 9. Construye un generador de reporte CSV de 1,000 filas usando `StringBuilder`
 *    con capacidad inicial preasignada (`new StringBuilder(32_000)`) y mide su
 *    longitud total generada.
 * 10. Utiliza un Text Block (`"""`) con `.formatted(...)` (Java 15+) para generar
 *     un payload JSON limpio de notificación de pedido listo para enviarse a una API.
 */
public class Tema11Cadenas {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
