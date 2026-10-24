/*
 * ============================================================================
 * TEMA 01: VARIABLES Y TIPOS DE DATOS
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * Una variable es un contenedor con nombre en la memoria cuya información puede
 * consultarse o actualizarse durante la ejecución del programa.
 *
 * Java es un lenguaje de tipado estático y fuerte: toda variable debe tener un
 * tipo conocido en tiempo de compilación y el compilador (`javac`) impide
 * asignaciones incompatibles antes de que el código llegue a producción.
 *
 * Modelo Mental en la JVM (Stack vs Heap):
 * - Tipos Primitivos (`byte`, `short`, `int`, `long`, `float`, `double`,
 *   `boolean`, `char`): Almacenan su valor binario directamente en el Stack Frame
 *   (cuando son variables locales) sin sobrecarga de cabeceras de objeto. Son
 *   ulorrápidos y nunca pueden ser `null`.
 * - Tipos de Referencia (`String`, `BigDecimal`, arreglos, objetos): La variable
 *   en el Stack guarda una dirección de memoria (puntero seguro de 32/64 bits)
 *   que apunta a la instancia real alojada en el Heap (administrado por el
 *   Garbage Collector).
 * - Inferencia de tipos locales (`var`, desde Java 10): Permite omitir el tipo
 *   explícito en variables locales cuando el lado derecho lo deja claro. Sigue
 *   siendo 100% tipado estático; el compilador deduce el tipo exacto.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - `int`: Contadores, índices de iteración, cantidades discretas hasta ~2 mil millones.
 * - `long`: Identificadores de base de datos (IDs autoincrementales o Snowflake),
 *   marcas de tiempo en milisegundos (`System.currentTimeMillis()`), tamaños de
 *   archivos en bytes.
 * - `double`: Cálculos científicos, coordenadas GPS, telemetría o estadísticas
 *   donde una mínima imprecisión binaria IEEE 754 es aceptable.
 * - `BigDecimal` (referencia): SIEMPRE para dinero, tasas de interés, impuestos
 *   y facturación (evita que `0.1 + 0.2` dé `0.30000000000000004`).
 * - `boolean`: Banderas de estado (`esActivo`, `tienePermiso`, `pagoConfirmado`).
 * - `String`: Textos, nombres, códigos ISO, JSON, identificadores UUID.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // Primitivos con literales legibles (guiones bajos desde Java 7)
 * int stockDisponible = 1_500;
 * long transaccionId = 9_876_543_210L;   // Sufijo 'L' obligatorio para literales long
 * double latitud = 4.60971;
 * boolean cuentaVerificada = true;
 * char categoria = 'A';                  // Comillas simples (UTF-16, 2 bytes)
 *
 * // Tipos de referencia e inferencia con var (Java 10+)
 * String cliente = "Ana Gómez";
 * var saldoCentavos = 250_000L;          // Inferido como long
 *
 * // Reasignación e inmutabilidad local
 * stockDisponible = stockDisponible - 1;
 * final String CODIGO_PAIS = "CO";       // No puede reasignarse
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Ficha de telemetría y resumen de pedido en un sistema de e-commerce.
 *
 * String sku = "LAP-PRO-16";
 * int unidades = 2;
 * long precioUnitarioCentavos = 450_000_00L; // Representación exacta en centavos
 * boolean envioExpress = true;
 * var totalCentavos = unidades * precioUnitarioCentavos;
 *
 * System.out.println("SKU: " + sku + " | Unidades: " + unidades);
 * System.out.println("Total (centavos): " + totalCentavos + " | Express: " + envioExpress);
 *
 * Salida esperada:
 * SKU: LAP-PRO-16 | Unidades: 2
 * Total (centavos): 90000000 | Express: true
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - Error común 1: Usar `double` o `float` para dinero. Usa `BigDecimal` o un
 *   `long` representando la unidad mínima (centavos).
 * - Error común 2: Olvidar la `L` mayúscula en literales `long` grandes
 *   (ej. `long x = 3000000000;` no compila porque el literal se evalúa como `int`).
 *   Nunca uses `l` minúscula porque se confunde con el dígito `1`.
 * - Clean Code: Usa `camelCase` descriptivo con sustantivos para variables
 *   (`tiempoRespuestaMs` en vez de `t`) y prefijos `es`/`tiene`/`puede` para
 *   booleanos (`esClienteVip`).
 * - Effective Java (Item 61): Prefiere tipos primitivos (`int`, `long`, `boolean`)
 *   sobre sus clases envolventes (`Integer`, `Long`, `Boolean`) para evitar
 *   sobrecarga de memoria, autoboxing innecesario y `NullPointerException`.
 * - Usa `var` solo cuando el tipo sea evidente en la misma línea.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Crea variables para tu nombre (`String`), edad (`int`) y ciudad (`String`),
 *    y muestra una frase de presentación formateada.
 * 2. Guarda el precio en centavos (`long`) de un producto y la cantidad comprada
 *    (`int`); muestra ambos datos y el subtotal en centavos.
 * 3. Guarda una temperatura en Celsius (`double`) y el símbolo de la unidad
 *    (`char`), y muéstralos juntos en consola.
 *
 * [Intermedio]
 * 4. Crea dos variables enteras (`a` y `b`), intercambia sus valores usando una
 *    variable temporal y muestra el estado antes y después.
 * 5. Guarda nombre y apellido por separado, únelos en una variable inferida con
 *    `var` y muestra el nombre completo junto a su estado booleano `perfilCompleto`.
 * 6. Declara el ancho y alto de una habitación (`double`), calcula el área en
 *    otra variable y muestra todas las medidas etiquetadas con sus unidades.
 * 7. Declara una variable `final` para el código ISO de tu país y una variable
 *    mutable para el saldo de una billetera; actualiza el saldo tras un abono.
 *
 * [Senior / Producción]
 * 8. Modela el registro de una transacción bancaria usando los tipos óptimos de
 *    la JVM: ID de transacción de 64 bits (`long`), monto en `BigDecimal`
 *    (usando `new BigDecimal("1250.75")`), moneda ISO (`String`) y bandera de
 *    auditoría (`boolean`). Imprime el resumen financiero.
 * 9. Demuestra el problema de precisión IEEE 754 sumando `0.1 + 0.2` con `double`
 *    y compáralo en consola con el resultado exacto usando `BigDecimal`.
 * 10. Diseña la ficha técnica de un servidor en la nube: ID del nodo (`long`),
 *     memoria RAM en bytes (`long` usando separadores `_`), uso de CPU (`double`),
 *     zona de disponibilidad (`final String`) y estado saludable (`boolean`).
 */
public class Tema01Variables {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
