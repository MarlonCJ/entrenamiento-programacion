import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/*
 * ============================================================================
 * TEMA 29: CLEAN CODE, PRINCIPIOS SOLID Y PATRONES DE DISENO EN PRODUCCION
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Modelo Mental de Arquitectura Limpia)
 * ----------------------------------------------------------------------------
 * El codigo se lee 10 veces mas de lo que se escribe. El objetivo de **Clean Code**,
 * los **Principios SOLID** y los **Patrones de Diseno** no es "hacer el codigo
 * mas complejo con decenas de interfaces inutiles", sino **reducir el costo del
 * cambio**: lograr que agregar una nueva regla de negocio no rompa el codigo
 * existente y que cada pieza pueda probarse en aislamiento.
 *
 * Los 5 Principios SOLID aplicados en Java Moderno:
 * - **S - Single Responsibility Principle (SRP)**: Una clase debe tener una
 *   unica razon para cambiar (ej. separa la logica de calculo de nomina de la
 *   generacion del PDF y del guardado en base de datos).
 * - **O - Open/Closed Principle (OCP)**: Abierto a la extension, cerrado a la
 *   modificacion (agrega un nuevo medio de pago creando una nueva clase que
 *   implementa `PasarelaPago`, no editando un `if/else` de 300 lineas).
 * - **L - Liskov Substitution Principle (LSP)**: Toda implementacion de una
 *   interfaz debe cumplir el contrato prometido sin sorpresas ni lanzar
 *   `UnsupportedOperationException`.
 * - **I - Interface Segregation Principle (ISP)**: Muchas interfaces pequenas y
 *   especificas (`LectorInventario`, `EscritorInventario`) son mejores que una
 *   interfaz gigante que obligue a implementar metodos vacios.
 * - **D - Dependency Inversion Principle (DIP)**: Los servicios de alto nivel
 *   no deben instanciar directamente detalles de bajo nivel (`new MySqlRepo()`);
 *   ambos deben depender de abstracciones (interfaces) inyectadas por constructor.
 *
 * Los 4 Patrones de Diseno mas usados en el Mundo Real:
 * 1) **Strategy**: Encapsular algoritmos intercambiables (impuestos, envios).
 * 2) **Factory**: Centralizar la creacion polimorfica de objetos.
 * 3) **Observer / Event Listener**: Desacoplar la accion principal de sus efectos
 *    secundarios (al confirmar un pedido -> notificar por email, actualizar puntos).
 * 4) **Decorator**: Envolver un servicio para agregar capacidades transversales
 *    (logging, cache, reintentos) respetando la misma interfaz.
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Refactorizacion de `switch` / `if-else` gigantes hacia **Strategy + Factory**.
 * - Desacoplar el dominio de la base de datos mediante el patron **Repository**
 *   e **Inyeccion de Dependencias por Constructor**.
 * - Agregar metricas, auditoria o cache a un servicio existente sin tocar su
 *   codigo interno mediante el patron **Decorator**.
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // 1. Dependency Inversion (DIP) + Constructor Injection:
 * public interface RepositorioPedidos {
 *     void guardar(String idPedido, double total);
 * }
 *
 * public final class ServicioCheckout {
 *     private final RepositorioPedidos repositorio;
 *
 *     public ServicioCheckout(RepositorioPedidos repositorio) {
 *         this.repositorio = Objects.requireNonNull(repositorio);
 *     }
 *
 *     public void finalizarCompra(String id, double total) {
 *         if (total <= 0) throw new IllegalArgumentException("Total invalido");
 *         repositorio.guardar(id, total);
 *     }
 * }
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Aplicamos el patron **Decorator** sobre un `ProcesadorPagos` para
 * agregar registro de auditoria sin modificar ni una sola linea de la clase
 * original de pagos.
 *
 * interface ProcesadorPagos {
 *     boolean cobrar(String cliente, double monto);
 * }
 *
 * static final class ProcesadorPagosReal implements ProcesadorPagos {
 *     @Override
 *     public boolean cobrar(String cliente, double monto) {
 *         return monto > 0 && monto <= 10_000;
 *     }
 * }
 *
 * static final class ProcesadorPagosConAuditoria implements ProcesadorPagos {
 *     private final ProcesadorPagos delegado;
 *
 *     ProcesadorPagosConAuditoria(ProcesadorPagos delegado) {
 *         this.delegado = Objects.requireNonNull(delegado);
 *     }
 *
 *     @Override
 *     public boolean cobrar(String cliente, double monto) {
 *         System.out.printf("[AUDIT] Iniciando cobro a %s por %.2f%n", cliente, monto);
 *         boolean exito = delegado.cobrar(cliente, monto);
 *         System.out.printf("[AUDIT] Resultado para %s: %s%n", cliente, exito ? "APROBADO" : "RECHAZADO");
 *         return exito;
 *     }
 * }
 * // Salida esperada al invocar cobrar("Ana", 250.0):
 * // [AUDIT] Iniciando cobro a Ana por 250.00
 * // [AUDIT] Resultado para Ana: APROBADO
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - EVITA EL ANTIPATRON SINGLETON GLOBAL CON ESTADO MUTABLE: Los Singletons
 *   estaticos (`MiServicio.getInstance()`) acoplan ocultamente todo el codigo y
 *   hacen casi imposible ejecutar pruebas en paralelo. Prefiere siempre pasar
 *   las dependencias por el constructor (*Constructor Injection*).
 * - NO SOBRE-INGENIERICES (*YAGNI - You Aren't Gonna Need It*): No crees una
 *   interfaz, una fabrica y 4 clases abstractas si hoy solo existe una unica
 *   regla simple y no requiere aislar I/O externo.
 * - REEMPLAZA NUMEROS MAGICOS Y CODIGOS DE TEXTO POR `enum` RICOS: En Java, un
 *   `enum` puede tener atributos, constructor y metodos polimorficos propios!
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Basico]
 * 1. Refactorizacion Clean Code (Guard Clauses y Nombres Expresivos): Toma un
 *    metodo con 4 niveles de `if/else` anidados y variables `a`, `b`, `flag`, y
 *    reescribelo usando clausulas de guarda (*early return*) y metodos privados
 *    con nombres que expliquen la intencion.
 * 2. Principio de Responsabilidad Unica (SRP): Divide una clase Dios `FacturaTodoEnUno`
 *    en tres clases cohesionadas: `CalculadoraFactura`, `FormateadorFacturaTexto`
 *    y `RepositorioFacturas`.
 * 3. `enum` Rico con Comportamiento (OCP sin clases extra): Crea un `enum TipoCliente`
 *    (`ESTANDAR`, `PLATA`, `ORO`) donde cada constante calcule su propio porcentaje
 *    de descuento y puntos por dolar gastado.
 *
 * [Intermedio]
 * 4. Patron **Strategy** en Calculo de Envios: Define la interfaz `EstrategiaEnvio`
 *    y tres implementaciones (`EnvioEstandar`, `EnvioExpress`, `RecogidaEnTienda`),
 *    permitiendo cambiar la estrategia en una `Orden` o pasar una lambda.
 * 5. Patron **Simple Factory / Registry**: Crea una fabrica `FabricaMediosPago`
 *    respaldada por un `Map<String, Supplier<MedioPago>>` que instancie el
 *    procesador correcto a partir de `"TARJETA"`, `"PSE"` o `"TRANSFERENCIA"`
 *    sin usar `switch` ni `if/else`.
 * 6. Segregacion de Interfaces (ISP): Refactoriza una interfaz monolitica
 *    `TrabajadorAlmacen` en interfaces pequenas (`Empacador`, `ConductorMontacargas`,
 *    `AuditorInventario`) para que un robot automatizado solo implemente lo que usa.
 * 7. Inversion de Dependencias (DIP) e Inyeccion por Constructor: Crea un
 *    `ServicioRegistroUsuario` que dependa de `RepositorioUsuarios` y
 *    `EnviadorBienvenida`, y pruebalo inyectando implementaciones en memoria.
 *
 * [Senior / Produccion]
 * 8. Patron **Observer / Publicador de Eventos de Dominio**: Implementa un
 *    `BusEventosPedido` donde, al confirmarse un pedido, se notifique de forma
 *    desacoplada a multiples suscriptores (`EscuchaInventario`, `EscuchaFacturacion`,
 *    `EscuchaFidelizacion`).
 * 9. Patron **Decorator** Apilable (Cache + Logging): Dada una interfaz
 *    `ConsultaCatalogo`, crea el servicio base y dos decoradores (`CatalogoConCache`
 *    y `CatalogoConMetricas`) que puedan envolverse uno dentro del otro:
 *    `new CatalogoConMetricas(new CatalogoConCache(new CatalogoReal()))`.
 * 10. Patron **Chain of Responsibility** (Pipeline de Aprobacion de Credito):
 *     Encadena eslabones de validacion (`ValidadorEdad`, `ValidadorIngresosMinimos`,
 *     `ValidadorHistorialCrediticio`) donde cada eslabon decide si rechaza la
 *     solicitud con un motivo claro o la pasa al siguiente eslabon.
 */
public class Tema29CleanCodeSolidPatrones {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
    }
}
