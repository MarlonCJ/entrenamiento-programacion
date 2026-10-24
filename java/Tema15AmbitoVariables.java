/*
 * ============================================================================
 * TEMA 15: ÁMBITO DE VARIABLES (SCOPE), CICLO DE VIDA Y ESTADO EN LA JVM
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * El ámbito (Scope) de una variable determina en qué región del código es visible
 * y accesible. El ciclo de vida (Lifetime) determina cuándo se reserva su memoria
 * y cuándo se destruye.
 *
 * En Java existen 4 niveles de ámbito con ubicaciones muy distintas en la JVM:
 * 1) Variables de Bloque (`{ ... }`, `if`, `for`): Nacen en la línea donde se
 *    declaran y mueren al cerrarse la llave `}` de ese bloque. Viven en el Stack.
 * 2) Variables Locales y Parámetros de Método: Viven en el Stack Frame del hilo
 *    mientras dura la ejecución del método. NO tienen valor por defecto (el
 *    compilador exige inicializarlas antes de leerlas). Son 100% Thread-Safe
 *    porque cada hilo tiene su propia pila independiente.
 * 3) Variables de Instancia (Campos / Atributos no `static`): Pertenecen a cada
 *    objeto creado con `new`. Viven en el Heap mientras el objeto sea alcanzable.
 * 4) Variables de Clase (`static`): Existe una única copia compartida por toda
 *    la aplicación asociada a la clase en el Metaspace/Heap.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Variables locales/de bloque: Por defecto para todo cálculo temporal. Cuanto
 *   más estrecho sea el ámbito de una variable, menos errores habrá.
 * - Parámetros explícitos (Inyección de Dependencias / Configuración): Pasar tasas,
 *   contextos o servicios como argumentos en vez de usar variables globales.
 * - Campos de instancia (`private final`): Para encapsular el estado propio de
 *   cada entidad u objeto de servicio.
 * - `static final`: Únicamente para constantes globales verdaderamente inmutables.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * public class EjemploAmbito {
 *     // 1. Constante de clase (static final): segura porque es inmutable
 *     private static final double TASA_BASE = 0.15;
 *
 *     // 2. Variable de instancia: cada objeto new EjemploAmbito() tiene la suya
 *     private int operacionesRealizadas = 0;
 *
 *     // 3. Parámetros ('monto') y variables locales ('impuesto'): viven en el Stack
 *     public static double calcularImpuesto(double monto, double tasaEspecifica) {
 *         double impuesto = monto * tasaEspecifica;
 *         if (monto > 1000) {
 *             double recargoLujo = monto * 0.02; // 4. Ámbito de bloque (solo vive en el if)
 *             impuesto += recargoLujo;
 *         }
 *         // Aquí 'recargoLujo' ya NO existe.
 *         return impuesto;
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Cálculo puro recibiendo configuración explícita sin contaminar estado global.
 *
 * double precioProducto = 500.0;
 * double tasaColombia = 0.19;
 * double tasaEspana = 0.21;
 *
 * double totalCO = precioProducto * (1.0 + tasaColombia);
 * double totalES = precioProducto * (1.0 + tasaEspana);
 *
 * System.out.println("Total CO: $" + totalCO + " | Total ES: $" + totalES);
 *
 * Salida esperada:
 * Total CO: $595.0 | Total ES: $605.0
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - Effective Java (Item 57): Minimiza el ámbito de las variables locales.
 *   Decláralas en el preciso momento en que las necesitas por primera vez, no
 *   todas juntas al principio del método como se hacía en C antiguo.
 * - PELIGRO EN PRODUCCIÓN (Estado `static` mutable): Nunca uses variables
 *   `static` no finales (ej. `static double totalCarrito;`) para guardar datos de
 *   peticiones de usuarios. En un servidor web (Spring Boot, Quarkus) con 200
 *   hilos simultáneos, todos los clientes sobrescribirán la misma variable
 *   provocando fugas de datos y Race Conditions críticas.
 * - Gotcha de Variable Shadowing (Ocultamiento): Si una variable local o parámetro
 *   se llama igual que un campo de la clase (`nombre`), oculta al campo. Si no usas
 *   `this.nombre = nombre;`, harás `nombre = nombre;` (asignando el parámetro a
 *   sí mismo sin modificar el objeto).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Demuestra que una variable local declarada dentro de un método auxiliar no
 *    puede leerse desde `main`, sino que su resultado debe devolverse con `return`.
 * 2. Crea dos métodos distintos que utilicen ambos una variable local llamada
 *    `resultado` y demuestra que no interfieren entre sí en el Stack.
 * 3. Demuestra la diferencia de ámbito entre una variable declarada dentro de un
 *    bloque `for` o `if` y una variable declarada al nivel del método.
 *
 * [Intermedio]
 * 4. Refactoriza un cálculo de impuestos que leía una variable `static double tasa`
 *    para que reciba la `tasa` explícitamente como parámetro del método.
 * 5. Escribe un método puro que reciba un saldo y un retiro, y devuelva el nuevo
 *    saldo calculado sin mutar ninguna variable externa.
 * 6. Pasa un objeto o conjunto de parámetros de configuración (`moneda`, `decimales`,
 *    `impuesto`) explícitamente a través de una cadena de dos métodos (`generarFactura`
 *    -> `formatearLinea`).
 * 7. Demuestra el problema de "Variable Shadowing" en una clase auxiliar donde el
 *    parámetro del constructor o setter tiene el mismo nombre que el atributo, y
 *    corrígelo usando `this.atributo = atributo`.
 *
 * [Senior / Producción]
 * 8. Crea una pequeña clase interna estática `ContadorSeguro` con un atributo
 *    `private int cuenta` por instancia; instancia dos contadores independientes
 *    en `main` y demuestra que incrementar uno no altera el estado del otro.
 * 9. Demuestra por qué el estado `static` mutable rompe el aislamiento entre
 *    clientes simulando dos sesiones de compra intercaladas, y corrígelo pasando
 *    el estado de cada sesión por separado.
 * 10. Diseña un calculador de nómina sin estado oculto (Stateless Service) donde
 *     toda la información necesaria (salario bruto, porcentajes de salud, pensión
 *     y bonificaciones) ingrese por parámetros y produzca el desprendible final.
 */
public class Tema15AmbitoVariables {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
