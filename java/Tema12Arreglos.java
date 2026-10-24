import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/*
 * ============================================================================
 * TEMA 12: ARREGLOS ESTÁTICOS (`T[]`) Y LISTAS DINÁMICAS (`List<T>`, `ArrayList`)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * Para almacenar secuencias ordenadas de elementos en Java existen dos estructuras
 * fundamentales:
 * 1) Arreglos (`int[]`, `String[]`): Bloques contiguos de memoria de tamaño FIJO
 *    definido al crearse. Tienen soporte nativo en bytecode y admiten primitivos
 *    reales (`int[]`) sin sobrecarga de objetos envolventes.
 * 2) Listas (`List<T>`, implementada por `ArrayList<T>`): Estructuras dinámicas
 *    que crecen automáticamente duplicando o incrementando en un 50% su arreglo
 *    interno cuando se llenan. Solo admiten tipos de referencia (`Integer`, `String`).
 *
 * Modelo Mental en la JVM (Localidad de Caché vs Flexibilidad):
 * - Un `int[]` guarda los enteros de 32 bits uno al lado del otro en el Heap
 *   (excelente localidad espacial en caché L1/L2 de la CPU).
 * - Un `ArrayList<Integer>` guarda un arreglo de punteros a objetos `Integer`
 *   en el Heap (implica Autoboxing/Unboxing y mayor consumo de RAM, pero ofrece
 *   una API riquísima y redimensionamiento automático en $O(1)$ amortizado).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - `byte[]` / `int[]` / `double[]`: Procesamiento de archivos binarios, buffers
 *   de red, criptografía, matrices numéricas e imágenes de alto rendimiento.
 * - `List<T>` (`ArrayList`): El 95% de la lógica empresarial (listas de clientes,
 *   líneas de una factura, resultados de consultas SQL, respuestas JSON).
 * - `List.of(...)` (Java 9+): Para crear listas constantes e inmutables que no
 *   deben modificarse nunca.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // 1. Arreglos de tamaño fijo y utilidades de java.util.Arrays
 * int[] notas = {85, 92, 78, 95};
 * int primera = notas[0];                    // Acceso O(1) por índice base 0
 * int cantidad = notas.length;               // Propiedad (sin paréntesis)
 * Arrays.sort(notas);                        // Ordena in-place: [78, 85, 92, 95]
 * System.out.println(Arrays.toString(notas)); // Imprime "[78, 85, 92, 95]"
 *
 * // 2. Listas dinámicas (programar siempre hacia la interfaz List<T>)
 * List<String> tareas = new ArrayList<>();
 * tareas.add("Diseñar API");
 * tareas.add("Escribir tests");
 * String primeraTarea = tareas.get(0);       // Método get(i), tamaño con .size()
 *
 * // 3. Lista inmutable moderna (Java 9+)
 * List<String> rolesFijos = List.of("ADMIN", "AUDITOR");
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Filtrado de transacciones sospechosas y cálculo de métricas en un lote.
 *
 * double[] montos = {120.0, 5400.0, 85.5, 9200.0, 310.0};
 * List<Double> alertasFraude = new ArrayList<>();
 * double sumaTotal = 0.0;
 *
 * for (double monto : montos) {
 *     sumaTotal += monto;
 *     if (monto >= 5000.0) {
 *         alertasFraude.add(monto);
 *     }
 * }
 *
 * System.out.println("Total lote: $" + sumaTotal + " | Alertas: " + alertasFraude);
 *
 * Salida esperada:
 * Total lote: $15115.5 | Alertas: [5400.0, 9200.0]
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - Error común 1: Imprimir un arreglo directamente con `System.out.println(arr)`.
 *   Imprime su referencia hash tipo `[I@7ad041f3`. Usa siempre `Arrays.toString(arr)`.
 * - Error común 2: Eliminar elementos de un `ArrayList` dentro de un bucle `for-each`
 *   con `lista.remove(...)` lanza `ConcurrentModificationException`. Usa
 *   `lista.removeIf(condicion)` (Java 8+) o un `Iterator`.
 * - Gotcha de `Arrays.asList(...)` vs `List.of(...)`:
 *   * `Arrays.asList("a", "b")` devuelve una lista de tamaño fijo respaldada por el
 *     arreglo (permite `set`, falla en `add`/`remove`, admite `null`).
 *   * `List.of("a", "b")` (Java 9+) es 100% inmutable y rechaza `null`.
 * - Effective Java (Item 64): Declara siempre las variables con la interfaz
 *   `List<String> lista = new ArrayList<>();` y no con la clase concreta `ArrayList<String>`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Crea un arreglo de 5 precios, recórrelo con `for-each` y muestra su representación
 *    completa con `Arrays.toString(...)` junto a la suma total.
 * 2. Calcula el promedio, el valor mínimo y el valor máximo de un arreglo de
 *    enteros en una sola pasada (sin usar funciones de librería).
 * 3. Crea un `ArrayList<String>` de tareas pendientes, agrega 4 tareas, elimina
 *    una por nombre, actualiza otra con `.set(...)` y muestra el listado numerado.
 *
 * [Intermedio]
 * 4. Cuenta cuántas veces aparece un valor objetivo dentro de una `List<Integer>`
 *    y en qué índices se encuentra.
 * 5. Dado un arreglo de enteros, crea y devuelve un nuevo arreglo con los
 *    elementos en orden inverso (y luego muestra cómo invertir in-place inter-
 *    cambiando extremos hasta la mitad).
 * 6. Combina dos listas de nombres de clientes en una tercera lista sin modificar
 *    las dos listas originales.
 * 7. Separa una `List<Integer>` de lecturas en dos listas independientes: una de
 *    números pares y otra de números impares.
 *
 * [Senior / Producción]
 * 8. Elimina de un `ArrayList<String>` todos los códigos defectuosos (aquellos que
 *    estén en blanco o empiecen por `"ERR-"`) de forma segura sin provocar
 *    `ConcurrentModificationException` (usando `removeIf` o un bucle inverso).
 * 9. Implementa el algoritmo de rotación de un arreglo `k` posiciones hacia la
 *    derecha (ej. `[1, 2, 3, 4, 5]` rotado `k = 2` -> `[4, 5, 1, 2, 3]`) manejando
 *    el caso en que `k` sea mayor que la longitud del arreglo.
 * 10. Demuestra la diferencia de comportamiento ante mutaciones (`.set()` y `.add()`)
 *     entre `new ArrayList<>(List.of("A", "B"))`, `Arrays.asList("A", "B")` y
 *     `List.of("A", "B")` capturando `UnsupportedOperationException`.
 */
public class Tema12Arreglos {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
