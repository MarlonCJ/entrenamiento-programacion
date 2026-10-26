import java.util.Objects;

/*
 * ============================================================================
 * TEMA 22: PRUEBAS AUTOMATIZADAS (PATRON AAA), ASERCIONES Y DEPURACION CIENTIFICA
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Modelo Mental de Calidad de Software)
 * ----------------------------------------------------------------------------
 * Un codigo sin pruebas automatizadas es "codigo legado" desde el minuto en que
 * se escribe, porque nadie se atreve a refactorizarlo por miedo a romper algo en
 * silencio.
 *
 * Modelo Mental de Testing Profesional:
 * - **Patron AAA (Arrange - Act - Assert)**:
 *   1) *Arrange* (Preparar): Instanciar los objetos y configurar los datos de
 *      entrada y dobles de prueba (*Stubs/Fakes*).
 *   2) *Act* (Actuar): Invocar el unico metodo que se desea poner a prueba.
 *   3) *Assert* (Afirmar): Verificar que el valor retornado, el cambio de estado
 *      o la excepcion lanzada coincida exactamente con lo esperado.
 * - **Casos que SIEMPRE debes probar (BICEP / Boundary Testing)**:
 *   - *Happy Path*: El caso normal esperado.
 *   - *Boundary Conditions* (Fronteras): `0`, `1`, `-1`, lista vacia `List.of()`,
 *     cadena vacia `""`, valor maximo permitido.
 *   - *Error Cases*: Verificar que ante entradas ilegales o `null` el metodo
 *     lance la excepcion correcta (`IllegalArgumentException`, etc.).
 * - **Depuracion Cientifica**: Observar el fallo -> leer el Stack Trace de
 *   arriba hacia abajo buscando la primera linea de TU codigo -> formular una
 *   hipotesis -> aislar con un test reproducible -> corregir y dejar el test.
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Reglas Financieras y de Negocio: Calculo de intereses, impuestos, descuentos,
 *   liquidacion de nomina y validadores de documentos.
 * - Prevencion de Regresiones: Cuando reportan un bug en produccion, primero
 *   escribes un test que reproduzca el bug (falla en rojo), luego corriges el
 *   codigo (pasa en verde) y el bug nunca vuelve a ocurrir.
 * - Diseno Desacoplado (Testabilidad): Si una clase es dificil de probar porque
 *   se conecta directamente a una base de datos dentro de su metodo, el test te
 *   revela que debes extraer una interfaz e inyectarla por constructor.
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // Mini-framework de aserciones sin dependencias externas (estilo JUnit 5):
 * static void assertIguales(Object esperado, Object actual, String nombreTest) {
 *     if (!Objects.equals(esperado, actual)) {
 *         throw new AssertionError(String.format(
 *             "[FALLO] %s -> Esperado: <%s> pero fue: <%s>", nombreTest, esperado, actual));
 *     }
 *     System.out.println("[OK] " + nombreTest);
 * }
 *
 * static void assertLanza(Class<? extends Throwable> tipoEsperado, Runnable accion, String nombreTest) {
 *     try {
 *         accion.run();
 *     } catch (Throwable t) {
 *         if (tipoEsperado.isInstance(t)) {
 *             System.out.println("[OK] " + nombreTest + " (lanzo " + t.getClass().getSimpleName() + ")");
 *             return;
 *         }
 *         throw new AssertionError("[FALLO] " + nombreTest + " -> Lanzo excepcion distinta: " + t);
 *     }
 *     throw new AssertionError("[FALLO] " + nombreTest + " -> No lanzo " + tipoEsperado.getSimpleName());
 * }
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Probamos exhaustivamente una funcion de calculo de envio gratis
 * verificando caso normal, frontera exacta (`100.0`) y entrada negativa invalida.
 *
 * static double calcularCostoEnvio(double montoCompra) {
 *     if (montoCompra < 0) {
 *         throw new IllegalArgumentException("El monto no puede ser negativo: " + montoCompra);
 *     }
 *     return montoCompra >= 100.0 ? 0.0 : 12.50;
 * }
 *
 * // Suite de pruebas AAA en main:
 * // assertIguales(12.50, calcularCostoEnvio(50.0), "Compra menor a 100 cobra envio");
 * // assertIguales(0.0, calcularCostoEnvio(100.0), "Frontera exacta en 100 tiene envio gratis");
 * // assertLanza(IllegalArgumentException.class, () -> calcularCostoEnvio(-0.01), "Rechaza monto negativo");
 * //
 * // Salida esperada:
 * // [OK] Compra menor a 100 cobra envio
 * // [OK] Frontera exacta en 100 tiene envio gratis
 * // [OK] Rechaza monto negativo (lanzo IllegalArgumentException)
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - NO USES `assert` NATIVO DE JAVA PARA VALIDAR ARGUMENTOS PUBLICOS: La palabra
 *   clave `assert condicion;` de Java viene DESACTIVADA por defecto en la JVM en
 *   produccion (requiere la bandera `-ea`). Para validar parametros usa siempre
 *   `if (...) throw new IllegalArgumentException(...)`.
 * - CADA TEST DEBE SER INDEPENDIENTE Y DETERMINISTA: Un test nunca debe depender
 *   de que otro test se haya ejecutado antes, ni de la hora actual del reloj del
 *   sistema (`LocalDateTime.now()`), ni del azar (`Math.random()`).
 * - COMPARACION DE DECIMALES (`double`) EN PRUEBAS: Nunca compares dos `double`
 *   con igualdad exacta si provienen de calculos de punto flotante; usa un
 *   margen de tolerancia (`epsilon`, ej. `Math.abs(esperado - actual) < 1e-6`).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Basico]
 * 1. Construye tu propio motor de pruebas (`MiniJUnit`): Implementa los metodos
 *    auxiliares `assertTrue`, `assertEquals`, `assertAlmostEquals(double, double, double eps)`
 *    y `assertThrows`.
 * 2. Pruebas de fronteras (Boundary Testing): Implementa `clasificarEdad(int edad)`
 *    y escribe pruebas AAA para los limites exactos: `-1` (error), `0`, `17`,
 *    `18`, `64`, `65` y `120`.
 * 3. Cazador de bugs #1 (*Off-by-one Error*): El siguiente algoritmo para
 *    invertir un arreglo o buscar un elemento falla en el ultimo indice. Escribe
 *    un test que lo demuestre y corrige el limite del bucle.
 *
 * [Intermedio]
 * 4. Cazador de bugs #2 (Mutacion accidental e igualdad de Strings): Corrige un
 *    metodo de validacion de cupones que comparaba Strings con `==` en vez de
 *    `.equals()` y no aplicaba `.trim()`, cubriendolo con 4 pruebas unitarias.
 * 5. Cazador de bugs #3 (Division entera involuntaria): Corrige una funcion que
 *    calculaba el porcentaje de descuento haciendo `(descuento / 100) * precio`
 *    con `int` (dando siempre `0`), y verificala con `assertAlmostEquals`.
 * 6. TDD (Test-Driven Development) de Validador de Contrasenas: Escribe primero
 *    los tests y luego la implementacion de un validador que exija longitud >= 8,
 *    al menos una mayuscula, un digito y sin espacios en blanco.
 * 7. Pruebas de Estado en POO: Escribe una suite de pruebas para una clase
 *    `CarritoCompras` verificando carrito vacio inicial, agregar items, eliminar
 *    item y vaciar carrito.
 *
 * [Senior / Produccion]
 * 8. Dobles de Prueba (*Fake / Stub*) sin librerias externas: Crea una interfaz
 *    `TasaCambioProveedor` y un servicio `ConversorDivisas`. Implementa un
 *    `StubTasaCambioFija` para probar el conversor de forma 100% determinista
 *    sin conectarse a internet.
 * 9. Test Spy (Espia de interacciones): Crea un `SpyNotificadorEmail` que
 *    guarde en una `List<String>` todos los correos enviados durante un test,
 *    y verifica que al confirmar un pedido se haya enviado exactamente 1 correo
 *    con el asunto correcto.
 * 10. Ejecutor de Suite de Pruebas con Reporte Final: Crea un metodo que reciba
 *     una lista de casos de prueba (`Map<String, Runnable>`), ejecute todos
 *     capturando cualquier `AssertionError` sin detener la suite al primer fallo,
 *     e imprima al final el resumen: `Total: X | Pasaron: Y | Fallaron: Z`.
 */
public class Tema22PruebasDepurar {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
    }
}
