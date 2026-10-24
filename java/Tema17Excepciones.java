/*
 * ============================================================================
 * TEMA 17: EXCEPCIONES, MANEJO DE ERRORES Y RESILIENCIA
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * Una excepcion es un evento que interrumpe el flujo normal de instrucciones
 * cuando ocurre una condicion anomala o un error.
 *
 * Modelo Mental en la JVM (Jerarquia `Throwable` y Costo de Stack Trace):
 * - En Java, todo error o excepcion hereda de `java.lang.Throwable`, que se
 *   divide en dos grandes ramas:
 *   1) `Error`: Fallos graves de la JVM o del entorno (`OutOfMemoryError`,
 *      `StackOverflowError`). La aplicacion NO debe intentar capturarlos para
 *      seguir operando como si nada.
 *   2) `Exception`: Condiciones que una aplicacion puede prever y manejar. Se
 *      subdivide en:
 *      a) Checked Exceptions (Excepciones verificadas, heredan de `Exception`
 *         pero no de `RuntimeException`, ej. `IOException`, `SQLException`):
 *         El compilador obliga a capturarlas (`catch`) o declararlas (`throws`)
 *         porque representan contingencias externas recuperables.
 *      b) Unchecked Exceptions (No verificadas, heredan de `RuntimeException`,
 *         ej. `NullPointerException`, `IllegalArgumentException`,
 *         `IllegalStateException`): Representan errores de programacion o
 *         violaciones de precondiciones/contratos.
 * - Costo en la JVM: El bloque `try` tiene costo practicamente cero si no se
 *   lanza ninguna excepcion. Lo que es costoso en CPU es INSTANCIAR una
 *   excepcion (`new Exception()`), porque ejecuta `Throwable.fillInStackTrace()`,
 *   que recorre y fotografia toda la pila de llamadas actual del hilo.
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Validacion de contratos en constructores y APIs publicas (Fail-Fast):
 *   Lanzar `IllegalArgumentException` o `NullPointerException` (con
 *   `Objects.requireNonNull`) apenas entra un dato invalido.
 * - Comunicacion con sistemas externos: Bases de datos, llamadas HTTP, lectura
 *   de archivos o sockets, donde el fallo es parte natural del entorno.
 * - Liberacion determinista de recursos: Cerrar conexiones, streams o transacciones
 *   automaticamente mediante `try-with-resources` (`AutoCloseable`).
 * - Traduccion de excepciones entre capas (Exception Wrapping): Envolver una
 *   `SQLException` tecnica de bajo nivel en una excepcion de dominio como
 *   `RepositorioClientesException("No se pudo guardar el cliente", causa)`.
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // 1. Validacion Fail-Fast y Excepcion de Dominio con causa encadenada:
 * public class SaldoInsuficienteException extends RuntimeException {
 *     public SaldoInsuficienteException(String mensaje) {
 *         super(mensaje);
 *     }
 * }
 *
 * // 2. Multi-catch, encadenamiento de causa y finally:
 * try {
 *     int valor = Integer.parseInt(entrada);
 *     procesarPago(valor);
 * } catch (NumberFormatException | IllegalArgumentException e) {
 *     throw new IllegalStateException("Entrada de pago invalida: " + entrada, e);
 * } finally {
 *     // Se ejecuta siempre (exito o fallo)
 *     limpiarContextoTemporal();
 * }
 *
 * // 3. try-with-resources (Cierra recursos en orden inverso automaticamente):
 * try (var reader = java.nio.file.Files.newBufferedReader(ruta)) {
 *     return reader.readLine();
 * }
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Servicio de transferencia bancaria que valida entradas de forma
 * defensiva y usa una excepcion de negocio personalizada preservando el contexto.
 *
 * static void transferir(String cuentaOrigen, double saldoActual, double monto) {
 *     java.util.Objects.requireNonNull(cuentaOrigen, "cuentaOrigen no puede ser null");
 *     if (monto <= 0) {
 *         throw new IllegalArgumentException("El monto debe ser positivo: " + monto);
 *     }
 *     if (monto > saldoActual) {
 *         throw new IllegalStateException(
 *             String.format("Saldo insuficiente en %s: saldo=%.2f, solicitado=%.2f",
 *                 cuentaOrigen, saldoActual, monto)
 *         );
 *     }
 *     System.out.printf("Transferencia exitosa de %.2f desde %s%n", monto, cuentaOrigen);
 * }
 *
 * // Ejecucion en main:
 * // try {
 * //     transferir("CTA-900", 500.0, 150.0);
 * //     transferir("CTA-900", 350.0, 600.0);
 * // } catch (IllegalStateException ex) {
 * //     System.out.println("[ALERTA NEGOCIO] " + ex.getMessage());
 * // }
 * //
 * // Salida esperada:
 * // Transferencia exitosa de 150.00 desde CTA-900
 * // [ALERTA NEGOCIO] Saldo insuficiente en CTA-900: saldo=350.00, solicitado=600.00
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA tragues excepciones (Empty Catch Block): `catch (Exception e) {}`
 *   oculta fallos criticos y deja el sistema en estado corrupto.
 * - NUNCA uses excepciones para control de flujo ordinario: No recorras un
 *   arreglo hasta que lance `ArrayIndexOutOfBoundsException` ni uses `try/catch`
 *   para saber si una clave existe en un mapa.
 * - Preserva siempre la causa original (`cause`): Al relanzar otra excepcion,
 *   pasa la excepcion original al constructor `new MiExcepcion("Mensaje", e)`.
 *   Si solo haces `new MiExcepcion(e.getMessage())`, destruyes el stack trace
 *   original y haras imposible depurar en produccion (Effective Java Item 73).
 * - Incluye en el mensaje todos los parametros que contribuyeron al fallo
 *   (Effective Java Item 75): Ej. indice fuera de rango, limite y ID del registro.
 * - Nunca pongas `return` ni `throw` no controlado dentro de un bloque `finally`:
 *   Sobrescribira silenciosamente cualquier excepcion lanzada en el bloque `try`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Basico]
 * 1. Division segura e informativa: Implementa `dividirExacto(int numerador, int divisor)`
 *    que valide `divisor == 0` lanzando `IllegalArgumentException` con ambos
 *    valores en el mensaje; pruebalo en `main` con `try-catch`.
 * 2. Parseo robusto de enteros: Crea `parsearEnteroSeguro(String texto, int valorPorDefecto)`
 *    que convierta cadenas validas y ante `NumberFormatException` o `null`
 *    registre una advertencia clara y devuelva `valorPorDefecto`.
 * 3. Validacion Fail-Fast de precondiciones: Crea un metodo `registrarUsuario(String email, int edad)`
 *    que use `Objects.requireNonNull` para el email, verifique que contenga `'@'`
 *    y valide edad entre 18 y 120 con `IllegalArgumentException`.
 *
 * [Intermedio]
 * 4. Jerarquia de excepciones de dominio: Crea una excepcion base no verificada
 *    `InventarioException` y dos subclases: `ProductoNoEncontradoException` y
 *    `StockAgotadoException`, incluyendo constructores con mensaje y causa.
 * 5. Multi-catch y limpieza con `finally`: Simula el procesamiento de un lote
 *    de cadenas con formato `"PROD_ID:CANTIDAD"`; captura `NumberFormatException`
 *    e `IllegalArgumentException` en un multi-catch y asegura un resumen en `finally`.
 * 6. Recurso personalizado con `AutoCloseable`: Crea una clase `ConexionSimulada`
 *    que implemente `AutoCloseable`, imprima cuando se abre y cuando se cierra,
 *    y demuestra que `try-with-resources` la cierra incluso si ocurre una excepcion.
 * 7. Excepciones suprimidas (Suppressed Exceptions): Haz que tanto el cuerpo del
 *    `try` como el metodo `close()` de tu `AutoCloseable` lancen excepciones, y
 *    muestra por consola la excepcion principal junto con `e.getSuppressed()`.
 *
 * [Senior / Produccion]
 * 8. Traduccion de excepciones entre capas (Exception Chaining): Simula una capa
 *    de persistencia que lanza `java.io.IOException` y una capa de servicio que
 *    la captura y la envuelve en `RepositorioException("Error al leer cliente", e)`.
 *    Imprime la cadena completa recorriendo `getCause()`.
 * 9. Patron Result / Respuesta tipada sin excepciones para validacion masiva:
 *    Procesa una lista de 100 lineas de pedidos donde algunas tienen errores de
 *    formato; recolecta los pedidos validos y una lista detallada de errores por
 *    numero de linea sin detener todo el lote al primer error.
 * 10. Politica de Reintentos con Backoff (Retry Policy): Implementa un metodo
 *     ejecutor que intente invocar una operacion inestable hasta `maxIntentos`
 *     veces solo si lanza una excepcion transitoria (`IOException`), pero falle
 *     inmediatamente sin reintentar si lanza `IllegalArgumentException`.
 */
public class Tema17Excepciones {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
    }
}
