/*
 * ============================================================================
 * TEMA 08: OPERADORES BIT A BIT (BITWISE), TERNARIO Y PRECEDENCIA
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * - Operadores Bit a Bit (`&`, `|`, `^`, `~`, `<<`, `>>`, `>>>`): Manipulan
 *   directamente la representación binaria en complemento a dos de los tipos
 *   enteros en registros de la CPU en un solo ciclo de reloj.
 * - Operador Condicional Ternario (`condicion ? valorSiTrue : valorSiFalse`):
 *   Es una expresión compacta que produce un valor, a diferencia de `if/else`
 *   tradicional que es una sentencia.
 * - Precedencia de Operadores: Define el orden en que el compilador agrupa los
 *   términos cuando no hay paréntesis explícitos (ej. `*` antes que `+`, y `&&`
 *   antes que `||`).
 *
 * Modelo Mental en la JVM:
 * - `>>` (Desplazamiento con signo / aritmético): Conserva el bit de signo a la
 *   izquierda (divide entre potencias de 2 manteniendo el signo).
 * - `>>>` (Desplazamiento sin signo / lógico, exclusivo de Java): Rellena con `0`
 *   a la izquierda sin importar el signo (muy usado en algoritmos de hash y redes).
 * - Diferencia entre `&`/`|` y `&&`/`||`: Cuando `&` o `|` se aplican a `boolean`,
 *   evalúan SIEMPRE ambos lados (sin cortocircuito). Cuando se aplican a enteros,
 *   operan bit por bit.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Máscaras de bits (Bitmasks / Flags): Empaquetar permisos (LECTURA, ESCRITURA,
 *   EJECUCIÓN) en un solo entero de 32 bits.
 * - Criptografía, cálculo de hashes (`hashCode`), compresión, manipulación de
 *   colores RGB (`(rgb >> 16) & 0xFF`) y máscaras de subred IPv4.
 * - Operador ternario: Asignar valores por defecto o etiquetas simples en una
 *   sola línea limpia.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // 1. Operador ternario
 * int nota = 75;
 * String estado = (nota >= 60) ? "Aprobado" : "Reprobado";
 *
 * // 2. Máscaras de bits con literales binarios (0b...)
 * final int PERM_LECTURA   = 1 << 0; // 0b001 = 1
 * final int PERM_ESCRITURA = 1 << 1; // 0b010 = 2
 * final int PERM_ADMIN     = 1 << 2; // 0b100 = 4
 *
 * int misPermisos = PERM_LECTURA | PERM_ESCRITURA;         // Activar con OR (|) -> 3
 * boolean puedeEscribir = (misPermisos & PERM_ESCRITURA) != 0; // Consultar con AND (&)
 * misPermisos ^= PERM_ESCRITURA;                           // Alternar (toggle) con XOR (^)
 * misPermisos &= ~PERM_LECTURA;                            // Apagar un bit con AND NOT (& ~)
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Extracción de canales de color RGB desde un entero de 24 bits y
 * etiquetado de estado con operador ternario.
 *
 * int colorHex = 0x3498DB; // Azul claro: R=0x34 (52), G=0x98 (152), B=0xDB (219)
 * int rojo  = (colorHex >> 16) & 0xFF;
 * int verde = (colorHex >> 8)  & 0xFF;
 * int azul  = colorHex & 0xFF;
 *
 * String tono = (azul > rojo && azul > verde) ? "Predomina Azul" : "Otro tono";
 * System.out.println("RGB(" + rojo + ", " + verde + ", " + azul + ") -> " + tono);
 *
 * Salida esperada:
 * RGB(52, 152, 219) -> Predomina Azul
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - Prohibido anidar ternarios complejos: `a ? (b ? x : y) : (c ? z : w)` es
 *   ilegible. Usa ternario solo para selecciones simples de una línea; para el
 *   resto usa `if/else` o `switch` expressions.
 * - Gotcha de precedencia: Los operadores bit a bit `&`, `^`, `|` tienen MENOR
 *   precedencia que `==` y `!=`. Por eso `(permisos & FLAG) != 0` REQUIERE
 *   paréntesis alrededor de `permisos & FLAG`; sin ellos, Java intenta evaluar
 *   `permisos & (FLAG != 0)` y ni siquiera compila.
 * - Effective Java (Item 36): Para conjuntos de banderas en código de dominio
 *   empresarial moderno, prefiere `EnumSet` sobre campos de bits manuales, salvo
 *   cuando interactúes con protocolos binarios o necesites máxima compactación.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Usa el operador ternario para clasificar un número como `"Positivo"` o
 *    `"Cero o Negativo"`.
 * 2. Usa el operador ternario para asignar la tarifa de entrada (`15.0` para
 *    adultos `>= 18` o `8.0` para menores).
 * 3. Comprueba si un entero es par o impar inspeccionando su bit menos
 *    significativo con `(n & 1) == 0`.
 *
 * [Intermedio]
 * 4. Multiplica un entero por 8 usando desplazamiento a la izquierda (`<< 3`) y
 *    divídelo entre 4 usando desplazamiento a la derecha (`>> 2`).
 * 5. Define tres banderas de permisos (`LEER = 1`, `ESCRIBIR = 2`, `BORRAR = 4`),
 *    combina dos con `|`, verifica si tiene permiso de escritura con `&` y muestra
 *    el resultado.
 * 6. Usa el operador ternario para asignar un nombre por defecto `"Invitado"` si
 *    una cadena `nombreUsuario` es `null` o está en blanco (`.isBlank()`).
 * 7. Activa y desactiva repetidamente una bandera de estado usando el operador
 *    XOR (`^`) y muestra el valor en binario con `Integer.toBinaryString(...)`.
 *
 * [Senior / Producción]
 * 8. Empaqueta tres valores `R = 255`, `G = 128`, `B = 64` en un único `int` de
 *    24 bits usando `<<` y `|`, y luego desempaquétalos de vuelta usando `>>` y `& 0xFF`.
 * 9. Demuestra cómo `&&` tiene mayor precedencia que `||` evaluando
 *    `true || false && false` frente a `(true || false) && false`, y documenta
 *    por qué los paréntesis explícitos previenen incidentes en producción.
 * 10. Compara el desplazamiento con signo (`-16 >> 2`) frente al desplazamiento
 *     sin signo (`-16 >>> 2`) mostrando sus resultados decimales y binarios.
 */
public class Tema08BitwiseTernarioPrecedencia {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
