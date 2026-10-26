import java.util.Objects;

/*
 * ============================================================================
 * TEMA 20: PROGRAMACION ORIENTADA A OBJETOS (ENCAPSULACION, INVARIANTES Y RECORDS)
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * La Programacion Orientada a Objetos (POO) de nivel profesional NO consiste en
 * crear clases vacias llenas de `get` y `set` publicos para todos los campos
 * (antipatron conocido como *Modelo de Dominio Anemico*).
 *
 * El verdadero proposito de una clase es proteger sus **Invariantes de Dominio**:
 * condiciones que SIEMPRE deben ser verdaderas durante toda la vida del objeto
 * (por ejemplo, que una `CuentaBancaria` nunca tenga saldo negativo sin sobregiro
 * autorizado, o que un `Email` siempre tenga formato valido).
 *
 * Modelo Mental en la JVM:
 * - **Clase vs Instancia**: La clase es el molde cargado en el *Metaspace*; cada
 *   `new MiClase()` reserva memoria en el *Heap* para sus atributos de instancia.
 * - **Identidad (`==`) vs Igualdad Semantica (`equals` y `hashCode`)**:
 *   Por defecto, `Object.equals` compara direcciones de memoria (`==`). Si dos
 *   objetos representan el mismo valor logico (ej. dos coordenadas o dos clientes
 *   con el mismo documento), debes sobrescribir `equals` y OBLIGATORIAMENTE
 *   `hashCode` (si dos objetos son iguales segun `equals`, deben tener el mismo
 *   `hashCode` para funcionar en `HashMap` y `HashSet`).
 * - **`record` (Java 16+)**: Para Objetos de Valor (*Value Objects*) y DTOs
 *   inmutables, `public record Dinero(long centavos, String moneda) {}` genera
 *   automaticamente atributos `private final`, constructor, accesores, `equals`,
 *   `hashCode` y `toString`.
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Entidades de Negocio Ricas (*Rich Domain Models*): `Pedido`, `CuentaBancaria`,
 *   `Suscripcion`, con metodos de comportamiento real (`confirmarPago()`,
 *   `debitar(monto)`, `cancelar()`) en vez de `setEstado("PAGADO")` suelto.
 * - Objetos de Valor Inmutables (*Value Objects* con `record`): `Dinero`,
 *   `RangoFechas`, `DireccionEmail`, `CoordenadaGps`, validando en su constructor
 *   compacto que no puedan existir instancias invalidas.
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // 1. Entidad con encapsulacion fuerte e invariantes protegidos:
 * public final class CuentaBancaria {
 *     private final String numeroCuenta;
 *     private long saldoEnCentavos;
 *
 *     public CuentaBancaria(String numeroCuenta, long saldoInicialCentavos) {
 *         this.numeroCuenta = Objects.requireNonNull(numeroCuenta, "Cuenta nula");
 *         if (saldoInicialCentavos < 0) {
 *             throw new IllegalArgumentException("Saldo inicial negativo");
 *         }
 *         this.saldoEnCentavos = saldoInicialCentavos;
 *     }
 *
 *     public void depositar(long centavos) {
 *         if (centavos <= 0) throw new IllegalArgumentException("Monto debe ser > 0");
 *         this.saldoEnCentavos += centavos;
 *     }
 *
 *     public long getSaldoEnCentavos() { return saldoEnCentavos; }
 * }
 *
 * // 2. Value Object Inmutable con Java Record y constructor compacto (Java 16+):
 * public record ProductoResumen(String sku, String nombre, double precio) {
 *     public ProductoResumen {
 *         Objects.requireNonNull(sku, "SKU requerido");
 *         if (precio < 0) throw new IllegalArgumentException("Precio negativo");
 *     }
 * }
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Modelar una linea de inventario rica que impide existencias
 * negativas, ofrece metodos de negocio expresivos (`reabastecer`, `despachar`)
 * e implementa `toString`, `equals` y `hashCode` basados en su identificador.
 *
 * static final class ItemInventario {
 *     private final String sku;
 *     private final String nombre;
 *     private int stock;
 *
 *     public ItemInventario(String sku, String nombre, int stockInicial) {
 *         if (sku == null || sku.isBlank()) throw new IllegalArgumentException("SKU vacio");
 *         if (stockInicial < 0) throw new IllegalArgumentException("Stock negativo");
 *         this.sku = sku.trim().toUpperCase();
 *         this.nombre = Objects.requireNonNull(nombre);
 *         this.stock = stockInicial;
 *     }
 *
 *     public void despachar(int cantidad) {
 *         if (cantidad <= 0) throw new IllegalArgumentException("Cantidad debe ser > 0");
 *         if (cantidad > this.stock) {
 *             throw new IllegalStateException("Stock insuficiente para SKU " + sku);
 *         }
 *         this.stock -= cantidad;
 *     }
 *
 *     @Override
 *     public String toString() {
 *         return String.format("Item[sku=%s, nombre=%s, stock=%d]", sku, nombre, stock);
 *     }
 * }
 * // Salida esperada al crear new ItemInventario("lap-01", "Laptop", 10) y despachar(3):
 * // Item[sku=LAP-01, nombre=Laptop, stock=7]
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - DILE NO A LOS SETTERS CIEGOS (*Tell, Don't Ask*): No expongas `setSaldo(double)`
 *   ni `setStock(int)`. Expone operaciones de dominio con significado y reglas:
 *   `depositar(monto)`, `retirar(monto)`, `despacharUnidades(cantidad)`.
 * - SIEMPRE SOBRESCRIBE `hashCode` CUANDO SOBRESCRIBAS `equals` (Effective Java Item 11):
 *   Usa `Objects.equals(this.id, that.id)` y `Objects.hash(this.id)`. Si olvidas
 *   `hashCode`, tu objeto se perdera dentro de un `HashSet` o `HashMap`.
 * - PREFIERE LA INMUTABILIDAD (Effective Java Item 17): Declara `final` todo
 *   atributo que no necesite cambiar despues de construir el objeto. Los objetos
 *   inmutables son automaticamente *thread-safe* (seguros en concurrencia).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Basico]
 * 1. Clase `Producto` con validacion en constructor: Crea una clase con `id`,
 *    `nombre` y `precio` que valide en su constructor que el nombre no sea vacio
 *    y el precio sea `>= 0`, e implemente un `toString()` legible.
 * 2. Clase `CuentaBancaria` sin setters publicos: Implementa `depositar(double)`,
 *    `retirar(double)` (lanzando excepcion si supera el saldo) y `consultarSaldo()`.
 * 3. Sobrecarga de constructores (*Constructor Chaining* con `this(...)`):
 *    En una clase `Usuario`, ofrece un constructor completo `(nombre, email, rol)`
 *    y otro secundario `(nombre, email)` que delegue al principal asignando `"LECTOR"`.
 *
 * [Intermedio]
 * 4. Igualdad semantica (`equals` y `hashCode`): Crea una clase `Cliente`
 *    identificada por `documentoId`. Sobrescribe `equals` y `hashCode` y demuestra
 *    en un `HashSet<Cliente>` que no permite insertar dos instancias con el mismo documento.
 * 5. Objeto de Valor Inmutable (`record Dinero`): Crea un `record Dinero(long centavos, String moneda)`
 *    con constructor compacto que normalice la moneda a mayusculas y metodos
 *    `sumar(Dinero otro)` y `multiplicar(int factor)` que devuelvan nuevas instancias
 *    validando que ambas monedas sean iguales.
 * 6. Encapsulacion de colecciones internas: Crea una clase `Pedido` con una lista
 *    privada de lineas. Permite agregar lineas mediante `agregarLinea(...)` con
 *    validaciones y devuelve `Collections.unmodifiableList(lineas)` en su getter.
 * 7. Fabrica Estatica con Nombre (*Static Factory Method* - Effective Java Item 1):
 *    En una clase `Temperatura`, haz el constructor `private` y ofrece los metodos
 *    de fabrica expresivos `Temperatura.desdeCelsius(double)` y
 *    `Temperatura.desdeFahrenheit(double)`.
 *
 * [Senior / Produccion]
 * 8. Maquina de estados encapsulada en la Entidad (`OrdenCompra`): Modela una
 *    orden con estados `BORRADOR -> PAGADA -> ENVIADA` o `CANCELADA`. Garantiza
 *    que una orden `ENVIADA` no pueda cancelarse y que no se puedan agregar
 *    productos si ya no esta en `BORRADOR`.
 * 9. Patron *Fluent Builder* para objetos complejos: Implementa una clase
 *    inmutable `ConfiguracionServidor` (host, puerto, timeoutMs, usarTls, maxConexiones)
 *    con su clase interna `ConfiguracionServidor.Builder` que valide todas las
 *    invariantes al invocar `.build()`.
 * 10. Prevencion de *Primitive Obsession* (Obsesion por Primitivos): Reemplaza
 *     parametros sueltos `(String email, String telefono, double monto)` en un
 *     servicio de pagos por *Value Objects* fuertemente tipados (`Email`, `MontoMonetario`)
 *     que hagan imposible pasar un telefono donde iba un email.
 */
public class Tema20ProgramacionObjetos {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
    }
}
