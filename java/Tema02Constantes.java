/*
 * ============================================================================
 * TEMA 02: CONSTANTES E INMUTABILIDAD (`final` y `static final`)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * En Java, la palabra clave `final` aplicada a una variable garantiza que solo
 * pueda asignarse una única vez. Cuando se combina con `static` a nivel de clase
 * (`public static final` o `private static final`), define una constante global
 * compartida por todas las instancias de esa clase.
 *
 * Modelo Mental en la JVM:
 * - Constantes en Tiempo de Compilación (Compile-time Constants): Si una variable
 *   es `static final` de tipo primitivo o `String` y se inicializa con una
 *   expresión constante (ej. `static final int MAX_REINTENTOS = 3;`), el
 *   compilador `javac` hace "constant folding / inlining": incrusta el valor
 *   directamente en el bytecode de quienes la usan sin consultar la memoria en
 *   tiempo de ejecución.
 * - `final` en Referencias vs Objetos Inmutables: Declarar `final List<String> items`
 *   impide que la variable apunte a otra lista, pero NO impide modificar el
 *   contenido de la lista a menos que el objeto mismo sea inmutable (como `String`,
 *   `BigDecimal` o `List.of(...)`).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Eliminar "Números Mágicos" y "Strings Mágicos": Tasas de impuestos, códigos
 *   de estado, límites de paginación (`TAMANO_PAGINA_DEFAULT = 50`).
 * - Parámetros de configuración técnica: Timeouts en milisegundos, tamaños de
 *   buffer, expresiones regulares precompiladas.
 * - Leyes físicas y conversiones: `SEGUNDOS_POR_MINUTO = 60`, `BYTES_POR_MB = 1_048_576`.
 * - Seguridad multihilo (Thread-Safety): Los valores inmutables pueden leerse
 *   concurrentemente por miles de hilos en un servidor sin bloqueos (`synchronized`).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // Constantes de clase (UPPER_SNAKE_CASE por convención estándar de Java)
 * private static final double TASA_IVA = 0.19;
 * private static final int MAX_INTENTOS_LOGIN = 5;
 * private static final String MONEDA_BASE = "USD";
 *
 * // Constante local dentro de un método (camelCase)
 * final double precioBase = 100.0;
 * final double totalConIva = precioBase * (1 + TASA_IVA);
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Cálculo de tarifa de envío y facturación con reglas de negocio claras.
 *
 * final double TARIFA_POR_KG = 4.50;
 * final double IMPUESTO_ADUANA = 0.12;
 * final String PREFIJO_GUIA = "ENV-2025-";
 *
 * double pesoPaqueteKg = 10.0;
 * double costoBase = pesoPaqueteKg * TARIFA_POR_KG;
 * double costoTotal = costoBase * (1 + IMPUESTO_ADUANA);
 *
 * System.out.println("Guía: " + PREFIJO_GUIA + "0089");
 * System.out.println("Costo base: $" + costoBase + " | Total c/aduana: $" + costoTotal);
 *
 * Salida esperada:
 * Guía: ENV-2025-0089
 * Costo base: $45.0 | Total c/aduana: $50.400000000000006
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - Clean Code: Nunca dejes literales sueltos como `if (estado == 4)` o
 *   `monto * 0.19` en medio de la lógica. Bautízalos con constantes semánticas:
 *   `ESTADO_ENTREGADO` o `TASA_IVA_GENERAL`.
 * - Convención de nombres: `UPPER_SNAKE_CASE` exclusivamente para `static final`
 *   inmutables. Las variables locales `final` dentro de un método usan `camelCase`.
 * - Effective Java (Item 17): Minimiza la mutabilidad. Declara variables y campos
 *   como `final` por defecto a menos que exista una razón explícita para mutarlos.
 * - Gotcha de arreglos: `public static final int[] CODIGOS = {1, 2};` es un agujero
 *   de seguridad porque cualquiera puede hacer `CODIGOS[0] = 99;`. Usa `List.of(1, 2)`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Declara una constante con el nombre oficial de tu país y muéstrala en consola.
 * 2. Declara una constante `PI` (o usa `Math.PI`) y calcula el perímetro y área
 *    de un círculo de radio 7.5.
 * 3. Guarda `TASA_IVA` y `PRECIO_NETO` como constantes y calcula el total final.
 *
 * [Intermedio]
 * 4. Declara `SEGUNDOS_POR_MINUTO` y `MINUTOS_POR_HORA`; convierte 5 horas y
 *    25 minutos al total exacto de segundos.
 * 5. Declara el nombre de una aplicación y su versión como constantes de clase y
 *    construye un encabezado de arranque para los logs del sistema.
 * 6. Define `DIAS_POR_SEMANA = 7` y calcula cuántas semanas completas y días
 *    sueltos hay en un proyecto de 100 días.
 * 7. Declara `MAX_INTENTOS_ACCESO = 3`, simula un contador de intentos fallidos
 *    y evalúa en un booleano si la cuenta debe bloquearse.
 *
 * [Senior / Producción]
 * 8. Define constantes financieras usando `BigDecimal` (`TASA_RETENCION`,
 *    `COMISION_FIJA`) y calcula la liquidación neta de un pago empresarial.
 * 9. Crea un bloque de constantes de límites de un servidor HTTP (`TIMEOUT_MS`,
 *    `MAX_PAYLOAD_MB`, `BYTES_POR_MB`) y calcula el límite exacto en bytes.
 * 10. Modela un recibo de punto de venta (POS) combinando constantes de empresa
 *     (NIT, razón social, moneda, porcentaje de propina sugerida) y variables de
 *     la compra actual.
 */
public class Tema02Constantes {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
