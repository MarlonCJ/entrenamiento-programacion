/*
 * ============================================================================
 * TEMA 04: CONVERSIÓN DE TIPOS Y VALIDACIÓN DEFENSIVA DE DATOS
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * En el mundo real, los datos entran a tu sistema como texto crudo (`String`)
 * desde formularios web, archivos CSV, variables de entorno, JSON o consola.
 * Antes de aplicar lógica de negocio, debes:
 * 1) Convertirlos (Parsing / Casting) al tipo de dominio adecuado.
 * 2) Validarlos defensivamente (formato, nulidad, rango y reglas de negocio).
 *
 * Modelo Mental en la JVM:
 * - Widening Primitive Conversion (Implícita y segura): `int` -> `long` -> `double`.
 *   No pierde orden de magnitud.
 * - Narrowing Primitive Conversion (Cast explícito, riesgosa): `(int) 3.99` trunca
 *   la parte decimal a `3` (NO redondea). `(byte) 130` desborda (overflow) a `-126`.
 * - Parsing (`Integer.parseInt`, `Long.parseLong`, `Double.parseDouble`,
 *   `new BigDecimal(str)`): Recorre los caracteres UTF-16 y construye el valor
 *   numérico o lanza `NumberFormatException` si encuentra caracteres inválidos.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Lectura de variables de entorno (`System.getenv("PORT")`) al iniciar un
 *   microservicio, aplicando un valor por defecto seguro si falla.
 * - Validación de payloads en APIs REST (edades, precios positivos, cantidades
 *   en inventario, coordenadas geográficas).
 * - Importación masiva de archivos CSV/Excel donde una fila corrupta debe
 *   registrarse y rechazarse sin derribar todo el servidor.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // 1. Casting entre primitivos
 * double precioDecimal = 19.95;
 * int parteEntera = (int) precioDecimal;             // Trunca a 19
 * long redondeado = Math.round(precioDecimal);       // Redondea a 20
 *
 * // 2. Parsing seguro de String a número con manejo de excepciones
 * String entradaCruda = " 42 ";
 * try {
 *     int cantidad = Integer.parseInt(entradaCruda.trim());
 *     if (cantidad < 1 || cantidad > 100) {
 *         System.out.println("Fuera de rango permitido (1-100)");
 *     }
 * } catch (NumberFormatException e) {
 *     System.out.println("Formato numérico inválido: " + entradaCruda);
 * }
 *
 * // 3. Conversión de número a String
 * String texto = String.valueOf(12345);
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Validador de edad y monto de transferencia en una pasarela de pagos.
 *
 * String inputEdad = " 25 ";
 * String inputMonto = "1500.50";
 *
 * try {
 *     int edad = Integer.parseInt(inputEdad.trim());
 *     double monto = Double.parseDouble(inputMonto.trim());
 *     boolean datosValidos = (edad >= 18 && edad <= 120)
 *             && Double.isFinite(monto) && monto > 0;
 *     System.out.println("Edad: " + edad + " | Monto: " + monto + " | Válido: " + datosValidos);
 * } catch (NumberFormatException ex) {
 *     System.out.println("Error de formato en la solicitud.");
 * }
 *
 * Salida esperada:
 * Edad: 25 | Monto: 1500.5 | Válido: true
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - Gotcha de `Double.parseDouble`: Acepta cadenas como `"NaN"` o `"Infinity"`.
 *   En producción, verifica siempre `Double.isFinite(valor)` antes de operar.
 * - Gotcha de `Boolean.parseBoolean`: ¡NUNCA lanza excepción! Devuelve `true`
 *   si el texto es `"true"` (ignorando mayúsculas) y `false` para cualquier otra
 *   cosa (incluso `"1"`, `"si"` o `"basura"`). Si necesitas validación estricta,
 *   compara explícitamente el texto.
 * - Siempre aplica `.trim()` o `.strip()` (Java 11+, consciente de Unicode) antes
 *   de parsear entradas de usuario, ya que `Integer.parseInt(" 42 ")` lanza
 *   `NumberFormatException`.
 * - Prefiere `Integer.parseInt(str)` (devuelve `int` primitivo) sobre
 *   `Integer.valueOf(str)` (devuelve objeto `Integer`) cuando no necesites un objeto.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Convierte una cadena con dígitos y espacios alrededor (`"  2025  "`) a `int`,
 *    súmale 5 y muestra el resultado.
 * 2. Convierte una cadena decimal (`"45.80"`) a `double`, calcula su doble y
 *    muestra tanto el valor exacto como su parte entera truncada con `(int)`.
 * 3. Recibe una edad en texto y valida que sea un entero válido entre 0 y 125.
 *
 * [Intermedio]
 * 4. Valida un precio en texto: rechaza si es `null`, si está en blanco
 *    (`.isBlank()`), si no es numérico o si es menor o igual a cero.
 * 5. Recibe una cantidad de segundos como `String`, valida que sea un entero no
 *    negativo y conviértela a minutos y segundos restantes.
 * 6. Valida una cantidad de stock entera entre 1 y 1000 informando con mensajes
 *    distintos si falló por formato o por estar fuera de rango.
 * 7. Dadas dos cadenas numéricas, conviértelas y súmalas únicamente si ambas son
 *    válidas; si alguna falla, indica exactamente cuál de las dos causó el error.
 *
 * [Senior / Producción]
 * 8. Valida una lectura de sensor de temperatura (`String`): debe ser numérica,
 *    finita (`Double.isFinite`) y estar dentro del rango físico `[-273.15, 1000.0]`.
 *    Pruébalo con `"NaN"`, `"Infinity"`, `"-300"` y `"24.5"`.
 * 9. Diferencia programáticamente cuatro estados de una entrada de texto:
 *    `null`, cadena vacía/blanca (`""` o `"   "`), el literal `"0"` y un número
 *    positivo válido.
 * 10. Simula un lector resiliente de puerto de red que intenta parsear una cadena
 *     de configuración (rango válido 1024-65535) y, ante cualquier fallo, aplica
 *     el puerto por defecto `8080` registrando una advertencia.
 */
public class Tema04ConversionValidacion {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
