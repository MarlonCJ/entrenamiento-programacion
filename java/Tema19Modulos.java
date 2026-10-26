import java.util.Collections;
import java.util.List;
import java.util.Objects;

/*
 * ============================================================================
 * TEMA 19: MODULOS, PAQUETES, VISIBILIDAD Y ORGANIZACION DE PROYECTOS
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Modelo Mental y Arquitectura en la JVM)
 * ----------------------------------------------------------------------------
 * A medida que un sistema crece de 1 archivo a 500 clases, poner todo en el
 * mismo directorio o hacer todo `public` crea una "Gran Bola de Lodo" (*Big Ball
 * of Mud*) donde cualquier clase acopla y modifica detalles internos de otra.
 *
 * Java organiza y encapsula el codigo en dos niveles:
 * 1) Paquetes (`package` e `import`):
 *    - Agrupan clases cohesionadas bajo un espacio de nombres unico (usando el
 *      dominio invertido en minusculas, ej. `com.empresa.pagos.dominio`).
 *    - Controlan el acceso mediante los 4 niveles de visibilidad de Java:
 *      a) `private`: Solo visible dentro de la misma clase.
 *      b) *package-private* (sin modificador): Visible solo para clases del
 *         MISMO paquete. Es la visibilidad por defecto de Java y es clave para
 *         ocultar clases internas de implementacion!
 *      c) `protected`: Visible en el mismo paquete y en subclases.
 *      d) `public`: Visible desde cualquier parte del proyecto.
 * 2) Sistema de Modulos de la Plataforma Java (JPMS - `module-info.java`, Java 9+):
 *    - Agrupa paquetes en una unidad superior y declara explicitamente que
 *      paquetes exporta al mundo (`exports`) y de que otros modulos depende
 *      (`requires`), logrando encapsulacion fuerte a nivel de JAR.
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Organizacion por Capas vs Organizacion por Caracteristica (*Package by Feature*):
 *   En lugar de tener solo carpetas gigantes `controladores/`, `servicios/`,
 *   `repositorios/` con todo `public`, agrupar por dominio (`pagos/`, `inventario/`,
 *   `clientes/`) dejando las clases internas como *package-private* y exponiendo
 *   solo una interfaz o fachada `public`.
 * - Clases Utilitarias Inmutables (`final class` con constructor `private`):
 *   Como `java.lang.Math` o `java.util.Objects`, que agrupan funciones puras y
 *   prohiben ser instanciadas o heredadas.
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // 1. Declaracion de paquete e importaciones explicitas (al inicio del archivo):
 * // package com.entrenamiento.facturacion;
 * // import java.math.BigDecimal;
 * // import static java.util.Objects.requireNonNull;
 *
 * // 2. Clase utilitaria no instanciable (Effective Java Item 4):
 * final class ImpuestosUtil {
 *     public static final double IVA_ESTANDAR = 0.19;
 *
 *     private ImpuestosUtil() {
 *         throw new AssertionError("Clase utilitaria no instanciable");
 *     }
 *
 *     public static double calcularConIva(double subtotal) {
 *         if (subtotal < 0) throw new IllegalArgumentException("Subtotal negativo");
 *         return Math.round(subtotal * (1 + IVA_ESTANDAR) * 100.0) / 100.0;
 *     }
 * }
 *
 * // 3. Ejemplo conceptual de descriptor modular JPMS (archivo module-info.java):
 * // module com.empresa.facturacion {
 * //     requires java.sql;
 * //     exports com.empresa.facturacion.api; // Solo expone la API publica
 * // }
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un modulo de carrito de compras donde la clase interna de calculo
 * tiene visibilidad reducida y la fachada publica expone un contrato seguro e
 * inmutable (devolviendo una vista no modificable de la lista).
 *
 * static final class CalculadoraDescuentosInterna { // Simula clase package-private
 *     static double aplicarDescuento(double monto, boolean esClienteVip) {
 *         return esClienteVip ? monto * 0.90 : monto;
 *     }
 * }
 *
 * public static final class ServicioFacturacion {
 *     public double cotizar(List<Double> precios, boolean esVip) {
 *         Objects.requireNonNull(precios, "La lista de precios no puede ser null");
 *         double subtotal = 0;
 *         for (double p : precios) {
 *             subtotal += p;
 *         }
 *         return CalculadoraDescuentosInterna.aplicarDescuento(subtotal, esVip);
 *     }
 * }
 * // Ejecucion en main:
 * // var servicio = new ServicioFacturacion();
 * // System.out.println("Total VIP: " + servicio.cotizar(List.of(100.0, 50.0), true));
 * // Salida esperada:
 * // Total VIP: 135.0
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - EVITA LOS IMPORTS CON COMODIN (`import java.util.*;`): En codigo profesional,
 *   importa cada clase explicitamente. Los comodines pueden causar colisiones de
 *   nombres (ej. `java.util.Date` vs `java.sql.Date` o `java.awt.List` vs `java.util.List`).
 * - MINIMIZA LA ACCESIBILIDAD DE CLASES Y MIEMBROS (Effective Java Item 15):
 *   Haz que cada clase o metodo sea lo mas privado posible (`private` primero,
 *   luego *package-private*, y solo `public` si forma parte de la API del modulo).
 * - NO USES `import static` EN EXCESO: Solo usalo para constantes matematicas o
 *   aserciones de pruebas (`assertEquals`); abusar de el oscurece de que clase
 *   proviene cada metodo.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Basico]
 * 1. Clase utilitaria matematica: Crea una clase `final` llamada `GeometriaUtil`
 *    con constructor `private` que lance `AssertionError` y metodos estaticos
 *    para calcular area y perimetro de un circulo y un rectangulo.
 * 2. Resolucion de colision de nombres (FQCN - Fully Qualified Class Name):
 *    Demuestra como usar `java.util.Date` y `java.sql.Date` en el mismo metodo
 *    usando el nombre completamente calificado para al menos uno de ellos.
 * 3. Constantes de configuracion de modulo: Crea una clase `ConfiguracionApp`
 *    con constantes `public static final` inmutables y un metodo que valide si
 *    un entorno (`"DEV"`, `"STAGE"`, `"PROD"`) es valido.
 *
 * [Intermedio]
 * 4. Encapsulacion y niveles de visibilidad: Disena una clase `MotorPrecioInterno`
 *    (package-private) y una fachada publica `CotizadorPublico` que la utilice
 *    internamente sin exponer los detalles del calculo al exterior.
 * 5. Utilidad de validacion de textos (`TextoValidator`): Implementa metodos
 *    estaticos reutilizables `esNoVacio(String)`, `esEmailBasico(String)` y
 *    `normalizarSlug(String)` ("Hola Mundo!" -> "hola-mundo").
 * 6. Proteccion de estado interno (Copias defensivas): Crea una clase `CatalogoModulo`
 *    que reciba una `List<String>` en su constructor, guarde una copia inmutable
 *    (`List.copyOf`) y la exponga sin permitir que el exterior la modifique.
 * 7. Organizacion por caracteristica (*Package by Feature*): Modela mediante
 *    clases estaticas anidadas (simulando los paquetes `inventario` y `ventas`)
 *    la interaccion limpia entre dos modulos a traves de un objeto de transferencia
 *    de datos (DTO) inmutable.
 *
 * [Senior / Produccion]
 * 8. Desacoplamiento mediante Interfaces (Inversion de Dependencias entre Modulos):
 *    Define una interfaz `NotificadorPuerto` en el modulo de dominio y dos
 *    implementaciones concretas (`NotificadorConsola`, `NotificadorMemoria`),
 *    demostrando como el servicio de negocio funciona sin conocer la implementacion.
 * 9. Registro y Fabrica de Servicios (*Service Locator / Simple Registry*):
 *    Implementa un contenedor ligero que permita registrar implementaciones por
 *    interfaz (`Class<T>`) y recuperarlas de forma tipada y segura.
 * 10. Auditoria de arquitectura del modulo: Crea un verificador usando reflexion
 *     basica (`Class.getDeclaredFields()`, `Modifier.isPrivate(...)`) que compruebe
 *     que todos los atributos de una clase de dominio dada sean `private` y `final`.
 */
public class Tema19Modulos {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
    }
}
