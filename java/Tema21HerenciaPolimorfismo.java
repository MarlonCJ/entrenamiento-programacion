import java.util.List;

/*
 * ============================================================================
 * TEMA 21: HERENCIA, INTERFACES, POLIMORFISMO Y COMPOSICION (SEALED CLASSES)
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Modelo Mental y Despacho Dinamico en la JVM)
 * ----------------------------------------------------------------------------
 * El **Polimorfismo** es la capacidad de tratar diferentes implementaciones
 * concretas a traves de un mismo contrato comun (una `interface` o clase base),
 * permitiendo que el sistema crezca agregando nuevas clases sin modificar el
 * codigo que las consume (Principio Abierto/Cerrado - *Open/Closed Principle*).
 *
 * Modelo Mental en la JVM:
 * - **Dynamic Dispatch (vtable / itable)**: Cuando invocas `medioPago.procesar(100)`,
 *   la JVM inspecciona en tiempo de ejecucion la clase real del objeto en el
 *   Heap (`PagoTarjeta` vs `PagoTransferencia`) y ejecuta el metodo sobrescrito
 *   (`@Override`) correspondiente.
 * - **Interfaces vs Clases Abstractas**:
 *   - `interface`: Define un CONTRATO de comportamiento ("que puede hacer").
 *     Una clase puede implementar multiples interfaces. Puede incluir metodos
 *     `default` y `static`.
 *   - `abstract class`: Comparte estado (atributos) y plantilla de codigo entre
 *     clases estrechamente relacionadas ("que es"). Java solo permite herencia
 *     simple de clases (`extends`).
 * - **Herencia Sellada (`sealed interface` / `sealed class`, Java 17+)**:
 *   Permite restringir exactamente que subclases estan autorizadas a extender o
 *   implementar un contrato (`permits`), habilitando *Pattern Matching* exhaustivo
 *   en expresiones `switch` (Java 21+).
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Pasarelas de Pago y Notificaciones (Interfaces + Polimorfismo): Una interfaz
 *   `PasarelaPago` con implementaciones `StripePasarela`, `PayPalPasarela` y
 *   `SimuladorPasarelaTest` para pruebas unitarias.
 * - Reglas de Envio o Impuestos (Polimorfismo en lugar de `if/else` gigantes):
 *   Cada estrategia de envio calcula su propia tarifa cumpliendo un contrato.
 * - Jerarquias Cerradas de Dominio (`sealed interface`): Modelar el resultado de
 *   una operacion bancaria (`Exito`, `FondosInsuficientes`, `CuentaBloqueada`).
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // 1. Contrato con Interface y multiples implementaciones polimorficas:
 * public interface MedioPago {
 *     String procesarCobro(double monto);
 * }
 *
 * public final class PagoTarjeta implements MedioPago {
 *     @Override
 *     public String procesarCobro(double monto) {
 *         return "Cobrado con tarjeta: $" + monto;
 *     }
 * }
 *
 * // 2. Jerarquia cerrada con sealed interface y records (Java 17+):
 * public sealed interface ResultadoPago permits PagoAprobado, PagoRechazado {}
 * public record PagoAprobado(String codigoAutorizacion) implements ResultadoPago {}
 * public record PagoRechazado(String motivo) implements ResultadoPago {}
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un motor de checkout procesa una lista polimorfica de reglas de
 * descuento sin usar un solo `if/else` por tipo de descuento.
 *
 * interface ReglaDescuento {
 *     double aplicar(double subtotal);
 * }
 *
 * record DescuentoPorcentaje(double porcentaje) implements ReglaDescuento {
 *     @Override
 *     public double aplicar(double subtotal) {
 *         return subtotal * (1.0 - porcentaje / 100.0);
 *     }
 * }
 *
 * record DescuentoBonoFijo(double bono) implements ReglaDescuento {
 *     @Override
 *     public double aplicar(double subtotal) {
 *         return Math.max(0.0, subtotal - bono);
 *     }
 * }
 *
 * // Ejecucion en main:
 * // List<ReglaDescuento> reglas = List.of(new DescuentoPorcentaje(10), new DescuentoBonoFijo(15));
 * // double total = 200.0;
 * // for (ReglaDescuento regla : reglas) {
 * //     total = regla.aplicar(total);
 * // }
 * // System.out.println("Total final: " + total);
 * // Salida esperada:
 * // Total final: 165.0
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - PREFIERE LA COMPOSICION SOBRE LA HERENCIA (Effective Java Item 18):
 *   La herencia (`extends`) rompe la encapsulacion porque acopla la subclase a
 *   los detalles internos de la superclase. Usa herencia solo cuando exista una
 *   relacion genuina "es-un" (*is-a*) que cumpla el Principio de Sustitucion de
 *   Liskov (LSP); en los demas casos, inyecta un colaborador por constructor.
 * - USA SIEMPRE LA ANOTACION `@Override`: Hace que el compilador verifique que
 *   realmente estas sobrescribiendo un metodo de la superclase/interfaz y no
 *   escribiendo mal el nombre por accidente.
 * - DISENA Y DOCUMENTA PARA LA HERENCIA O PROHIBELA CON `final` (Effective Java Item 19):
 *   Si una clase concreta no fue disenada expresamente para ser extendida,
 *   declarala `final class`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Basico]
 * 1. Contrato de figuras geometricas: Crea una interfaz `Figura` con los metodos
 *    `calcularArea()` y `calcularPerimetro()`, e implementala en `Circulo` y
 *    `Rectangulo`. Recorre una `List<Figura>` imprimiendo el area de cada una.
 * 2. Clase base abstracta `Empleado`: Crea una clase abstracta con `nombre` y
 *    `salarioBase` y un metodo abstracto `calcularSalarioNeto()`. Implementa
 *    `EmpleadoTiempoCompleto` (bono fijo) y `EmpleadoPorHoras` (horas * tarifa).
 * 3. Uso de `super` y constructores: Crea una jerarquia `Vehiculo` -> `VehiculoElectrico`
 *    donde el hijo invoque `super(marca, modelo)` y anada `capacidadBateriaKwh`.
 *
 * [Intermedio]
 * 4. Polimorfismo en notificaciones: Define la interfaz `CanalNotificacion` con
 *    `enviar(String destinatario, String mensaje)` y un metodo `default` para
 *    formatear el mensaje. Implementa `CanalEmail`, `CanalSms` y `CanalPush`.
 * 5. Principio de Sustitucion de Liskov (El problema del Rectangulo y Cuadrado):
 *    Demuestra por que hacer que `Cuadrado extends Rectangulo` con setters mutables
 *    rompe las expectativas del cliente, y corrigelo haciendo ambas clases
 *    inmutables implementando la interfaz `FormaGeometrica`.
 * 6. Composicion sobre Herencia: En lugar de crear `PedidoConEnvioAereoPorTarjeta`,
 *    disena la clase `Pedido` componiendo dos interfaces inyectadas en su
 *    constructor: `CalculadoraEnvio` y `ProcesadorPago`.
 * 7. Pattern Matching para `instanceof` (Java 16+): Procesa una lista de objetos
 *    `EventoSistema` usando `if (evento instanceof EventoLogin login)` sin hacer
 *    casting manual explicito.
 *
 * [Senior / Produccion]
 * 8. Jerarquia cerrada con `sealed interface` (Modelado Algebraico de Datos):
 *    Disena `sealed interface EstadoEnvio permits EnPreparacion, EnTransito, Entregado, Fallido`
 *    usando `record` para cada estado con sus propios datos especificos, y
 *    procesalos exhaustivamente.
 * 9. Patron *Template Method* en Procesador de Reportes: Crea una clase abstracta
 *    `GeneradorReporte` con un metodo `final generar()` que ejecute los pasos
 *    `extraerDatos()`, `formatearContenido()` y `exportar()`, permitiendo a las
 *    subclases (`ReporteCsv`, `ReporteJson`) personalizar solo el formateo.
 * 10. Cadena de Filtros Polimorfica (Pipeline de Validacion de Fraude): Crea una
 *     interfaz `ReglaAntifraude` y haz que un `MotorAntifraude` evalue una lista
 *     de reglas (`ReglaMontoMaximo`, `ReglaPaisRiesgo`, `ReglaHorarioInusual`)
 *     sobre una transaccion, devolviendo el primer rechazo o aprobacion total.
 */
public class Tema21HerenciaPolimorfismo {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
    }
}
