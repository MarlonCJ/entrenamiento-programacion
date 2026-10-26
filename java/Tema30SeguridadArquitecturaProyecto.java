import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Objects;

/*
 * ============================================================================
 * TEMA 30: SEGURIDAD (OWASP), ARQUITECTURA EN CAPAS Y PROYECTO INTEGRADOR FINAL
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Mentalidad de Ingenieria en Produccion)
 * ----------------------------------------------------------------------------
 * ¡Felicidades por llegar al tema final de la ruta de Java! Un ingeniero Senior
 * disena software bajo dos principios innegociables:
 * 1) **Seguridad por Diseno (*Security by Design* - OWASP Top 10)**:
 *    Toda entrada externa es hostil hasta que sea validada. Nunca concatenes SQL
 *    (usa siempre `PreparedStatement`), nunca guardes contrasenas en texto plano
 *    (usa hashes con *Salt* criptografico y compara en tiempo constante con
 *    `MessageDigest.isEqual` para evitar *Timing Attacks*), usa `SecureRandom` en
 *    lugar de `java.util.Random` para tokens, y nunca expongas trazas internas ni
 *    datos sensibles (PII) en los logs.
 * 2) **Arquitectura en Capas / Hexagonal (Puertos y Adaptadores)**:
 *    - **Capa de Dominio (El Corazon)**: Entidades, Value Objects (`record`),
 *      excepciones de negocio y puertos (interfaces de repositorio). ¡Cero
 *      dependencias de bases de datos, HTTP o frameworks!
 *    - **Capa de Aplicacion (Casos de Uso / Servicios)**: Orquesta las entidades
 *      y los puertos para cumplir un flujo de negocio (ej. `ProcesarOrdenUseCase`).
 *    - **Capa de Infraestructura / Adaptadores**: Implementaciones concretas en
 *      memoria, archivos NIO.2, SQL/JDBC o clientes HTTP.
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Autenticacion, generacion de tokens de sesion y firma de webhooks (HMAC/SHA-256).
 * - Diseno de microservicios y monolitos modulares mantenibles durante anos.
 * - Proteccion de APIs mediante validacion de esquemas, limites de tasa (*Rate
 *   Limiting*) e idempotencia.
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // 1. Generacion de token seguro y Hash SHA-256 con Salt en Java estandar:
 * static String generarTokenSeguro(int numBytes) {
 *     byte[] bytes = new byte[numBytes];
 *     new SecureRandom().nextBytes(bytes);
 *     return HexFormat.of().formatHex(bytes); // Java 17+
 * }
 *
 * static byte[] calcularSha256(String texto, byte[] salt) throws NoSuchAlgorithmException {
 *     MessageDigest md = MessageDigest.getInstance("SHA-256");
 *     md.update(salt);
 *     return md.digest(texto.getBytes(StandardCharsets.UTF_8));
 * }
 *
 * // 2. Comparacion en tiempo constante (Previene ataques de temporizacion / Timing Attack):
 * // boolean coincide = MessageDigest.isEqual(hashEsperado, hashCalculado);
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un verificador de credenciales genera un *Salt* aleatorio con
 * `SecureRandom`, calcula el hash SHA-256 de una clave secreta y la verifica en
 * tiempo constante usando `MessageDigest.isEqual`.
 *
 * static void demoVerificacionSegura() throws NoSuchAlgorithmException {
 *     byte[] salt = new byte[16];
 *     new SecureRandom().nextBytes(salt);
 *
 *     byte[] hashGuardado = calcularSha256("ClaveSecreta#2026", salt);
 *     byte[] intentoCorrecto = calcularSha256("ClaveSecreta#2026", salt);
 *     byte[] intentoFalso = calcularSha256("OtraClave", salt);
 *
 *     System.out.println("Intento correcto: " + MessageDigest.isEqual(hashGuardado, intentoCorrecto));
 *     System.out.println("Intento falso:    " + MessageDigest.isEqual(hashGuardado, intentoFalso));
 * }
 * // Salida esperada:
 * // Intento correcto: true
 * // Intento falso:    false
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA USES `java.util.Random` PARA SEGURIDAD: `Random` usa una semilla
 *   predecible; un atacante que observe unos pocos codigos generados puede
 *   predecir todos los futuros tokens de recuperacion de contrasena. Usa siempre
 *   `java.security.SecureRandom`.
 * - NUNCA COMPARES HASHES O TOKENS SECRETOS CON `Arrays.equals` O `String.equals`:
 *   Esos metodos se detienen en el primer byte diferente (cortocircuito),
 *   filtrando informacion por el tiempo de respuesta (*Timing Attack*). Usa
 *   `MessageDigest.isEqual(a, b)`.
 * - NO USES `double` PARA CONTABILIDAD EN ARQUITECTURAS REALES: En tu proyecto
 *   integrador usa `long` (centavos) o `java.math.BigDecimal` con `RoundingMode.HALF_UP`.
 *
 * 6. PROYECTO INTEGRADOR FINAL: 10 RETOS PARA CONSTRUIR UN MOTOR E-COMMERCE SENIOR
 * ----------------------------------------------------------------------------
 * Construiras paso a paso un mini-sistema empresarial completo en memoria y disco
 * aplicando absolutamente todo lo aprendido del Tema 01 al Tema 30:
 *
 * [Fase 1: Seguridad y Dominio Inmutable]
 * 1. **Value Objects Blindados (`Dinero`, `Email`, `Sku`)**:
 *    Crea `records` inmutables con constructores compactos que validen formato
 *    con Regex precompilado, prohiban nulos y operen montos monetarios en
 *    centavos (`long`) o `BigDecimal` sin errores de punto flotante.
 * 2. **Servicio de Seguridad y Hashing (`GestorCredenciales`)**:
 *    Implementa generacion de *Salt* con `SecureRandom`, hash SHA-256, comparacion
 *    en tiempo constante con `MessageDigest.isEqual` y sanitizacion contra XSS
 *    basica escapando `<`, `>`, `&`, `"` y `'`.
 * 3. **Entidades de Dominio Ricas (`Producto`, `Orden`, `LineaOrden`)**:
 *    Modela el ciclo de vida de una `Orden` (`CREADA -> PAGADA -> DESPACHADA` o
 *    `CANCELADA`) protegiendo sus invariantes (no permitir pagar una orden vacia,
 *    ni modificar lineas una vez pagada).
 *
 * [Fase 2: Puertos, Repositorios y Resiliencia]
 * 4. **Puertos de Repositorio y Adaptador Concurrente en Memoria**:
 *    Define las interfaces `RepositorioProductos` y `RepositorioOrdenes` (devolviendo
 *    `Optional<T>`) e implementalas de forma *thread-safe* usando `ConcurrentHashMap`.
 * 5. **Limitador de Tasa por Cliente (*Rate Limiter* contra abuso de API)**:
 *    Implementa un filtro que permita maximo $N$ peticiones por minuto por cada
 *    `clienteId`, rechazando los excesos con una excepcion de dominio `LimiteTasaExcedidoException`.
 *
 * [Fase 3: Caso de Uso Transaccional, Patrones e Idempotencia]
 * 6. **Estrategias de Impuestos y Descuentos Polimorficas (Strategy Pattern)**:
 *    Disena una interfaz `PoliticaPrecios` que calcule descuentos escalonados e
 *    impuestos aplicables a la `Orden`.
 * 7. **Caso de Uso `ProcesarCheckoutUseCase` con Clave de Idempotencia**:
 *    Orquesta el flujo completo: verifica idempotencia (`idempotencyKey`), valida
 *    y descuenta stock atomicamente, calcula totales, registra el pago y publica
 *    un evento de dominio a los observadores registrados.
 *
 * [Fase 4: Analitica Funcional, Persistencia NIO.2 y Suite de Pruebas AAA]
 * 8. **Motor de Reportes Ejecutivos con Streams**:
 *    Sobre el repositorio de ordenes, implementa consultas con `Stream` y
 *    `Collectors` para obtener: ingresos totales pagados, Top 3 productos mas
 *    vendidos, ticket promedio y ventas agrupadas por estado.
 * 9. **Exportador e Importador de Auditoria en Disco (Java NIO.2 + JSON)**:
 *    Exporta las ordenes confirmadas a un archivo temporal en formato JSON (una
 *    por linea - *JSON Lines*) de forma atomica y leelas en streaming con
 *    `try (var lines = Files.lines(...))`.
 * 10. **Suite de Pruebas Automatizadas End-to-End (Patron AAA)**:
 *     Escribe una bateria de pruebas automatizadas en `main` que verifique:
 *     checkout exitoso, rechazo por stock insuficiente, rechazo por reintento
 *     idempotente duplicado y exactitud del reporte financiero final.
 */
public class Tema30SeguridadArquitecturaProyecto {
    public static void main(String[] args) {
        // Zona de trabajo: construye y prueba aqui tu Proyecto Integrador Final de Java.
    }
}
