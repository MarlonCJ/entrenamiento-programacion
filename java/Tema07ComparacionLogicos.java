import java.util.Objects;

/*
 * ============================================================================
 * TEMA 07: OPERADORES DE COMPARACIÓN, LÓGICOS Y CORTOCIRCUITO
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * Los operadores relacionales (`==`, `!=`, `<`, `>`, `<=`, `>=`) comparan dos
 * valores y producen un `boolean`. Los operadores lógicos (`&&`, `||`, `!`)
 * combinan expresiones booleanas para modelar reglas de decisión complejas.
 *
 * Modelo Mental en la JVM:
 * - Identidad (`==`) vs Igualdad de Valor (`.equals()`):
 *   * En primitivos (`int`, `double`, `boolean`), `==` compara los bits del valor.
 *   * En objetos (`String`, `Integer`, `BigDecimal`), `==` compara las DIRECCIONES
 *     DE MEMORIA (si ambas variables apuntan al mismo objeto en el Heap), NO su
 *     contenido. Para comparar contenido en objetos, se usa `.equals()` u
 *     `Objects.equals(a, b)`.
 * - Evaluación de Cortocircuito (Short-Circuit Evaluation):
 *   * `A && B`: Si `A` es `false`, la JVM NO evalúa `B` porque el resultado ya
 *     es obligatoriamente `false`.
 *   * `A || B`: Si `A` es `true`, la JVM NO evalúa `B` porque el resultado ya
 *     es obligatoriamente `true`.
 *   Esto es vital para proteger el código contra `NullPointerException` y evitar
 *   operaciones costosas innecesarias.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Reglas de autorización y control de acceso (`esAdmin || (esPropietario && cuentaActiva)`).
 * - Guardas de seguridad contra `null` (`texto != null && !texto.isBlank()`).
 * - Validación de rangos de negocio (edades, temperaturas, fechas, límites de crédito).
 * - Comparación segura de credenciales, códigos de estado o identificadores.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * int edad = 22;
 * boolean tieneLicencia = true;
 * boolean puedeAlquilarAuto = edad >= 21 && tieneLicencia;
 *
 * // Protección por cortocircuito contra NullPointerException
 * String cupon = "PROMO10";
 * boolean cuponValido = cupon != null && cupon.equals("PROMO10");
 *
 * // Comparación segura ante nulos con java.util.Objects (Java 7+)
 * boolean mismoCodigo = Objects.equals(cupon, "PROMO10");
 *
 * // Leyes de De Morgan para simplificar negaciones
 * // !(A && B) equivale a (!A || !B)
 * // !(A || B) equivale a (!A && !B)
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Motor de aprobación automática de crédito bancario.
 *
 * int scoreCrediticio = 720;
 * double ingresosMensuales = 3500.0;
 * boolean enListaMorosos = false;
 * String tipoContrato = new String("INDEFINIDO"); // Objeto nuevo en el Heap
 *
 * boolean contratoEstable = "INDEFINIDO".equals(tipoContrato);
 * boolean creditoAprobado = !enListaMorosos
 *         && scoreCrediticio >= 680
 *         && (ingresosMensuales >= 3000.0 || contratoEstable);
 *
 * System.out.println("Contrato estable: " + contratoEstable);
 * System.out.println("Crédito aprobado: " + creditoAprobado);
 *
 * Salida esperada:
 * Contrato estable: true
 * Crédito aprobado: true
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - EL ERROR MÁS FAMOSO EN JAVA: Comparar `String` o `Integer` con `==`.
 *   * Con `String`, a veces parece funcionar por el String Pool (`"hola" == "hola"`),
 *     pero falla en producción cuando el texto viene de base de datos o red.
 *   * Con `Integer`, Java cachea valores entre `-128` y `127`:
 *     `Integer a = 100, b = 100; (a == b)` da `true`, ¡pero con `1000` da `false`!
 *   Usa siempre `.equals()` u `Objects.equals()`.
 * - Yoda Conditions vs `Objects.equals`: Si comparas una constante con una variable
 *   que puede ser `null`, escribe `"ACTIVO".equals(estado)` o `Objects.equals(estado, "ACTIVO")`
 *   para no lanzar `NullPointerException`.
 * - Ordena las condiciones en `&&` poniendo primero la más barata y más probable
 *   de ser `false` (y siempre `obj != null` al principio).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Comprueba si la edad de un candidato es mayor o igual a 18 e imprime el
 *    resultado booleano.
 * 2. Comprueba si un número entero está dentro del rango inclusivo `[1, 10]`.
 * 3. Determina si una calificación es válida (`0` a `100`) y además aprobatoria
 *    (`>= 60`).
 *
 * [Intermedio]
 * 4. Determina si un número entero es múltiplo de 3 o de 5, pero NO de ambos al
 *    mismo tiempo.
 * 5. Evalúa si un año es bisiesto usando una única expresión booleana: divisible
 *    por 400, o bien divisible por 4 pero no por 100.
 * 6. Comprueba que un usuario no esté bloqueado (`!bloqueado`), tenga intentos
 *    disponibles (`intentos < 3`) y su sesión no haya expirado.
 * 7. Determina si la temperatura de una cámara frigorífica está en estado de
 *    alerta (fuera del rango seguro de `-5.0` a `2.0` grados Celsius).
 *
 * [Senior / Producción]
 * 8. Demuestra con `new String("admin")` por qué `==` devuelve `false` al comparar
 *    dos cadenas idénticas en memoria distinta, y corrígelo con `.equals()` y
 *    `Objects.equals()`.
 * 9. Demuestra el caché de `Integer` (`-128` a `127`) comparando dos `Integer`
 *    con valor `127` frente a dos `Integer` con valor `128` usando `==` vs `.equals()`.
 * 10. Escribe una validación por cortocircuito que verifique que un código de
 *     producto (`String`) no sea `null`, tenga longitud exacta de 8 caracteres
 *     y empiece por `"SKU-"`, probándola con `null` sin que lance excepción.
 */
public class Tema07ComparacionLogicos {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
