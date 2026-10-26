import java.util.Arrays;
import java.util.Comparator;

/*
 * ============================================================================
 * TEMA 23: ALGORITMOS DE BUSQUEDA, ORDENAMIENTO Y COMPARADORES (TIMSORT)
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Modelo Mental y Complejidad Algoritmica)
 * ----------------------------------------------------------------------------
 * Buscar y ordenar son las operaciones fundamentales de la computacion. Elegir
 * el algoritmo correcto marca la diferencia entre hacer `1,000,000` de
 * comparaciones o hacer solo `20` comparaciones para encontrar un dato.
 *
 * Modelo Mental de Complejidad y Motores de Ordenamiento en la JVM:
 * - **Busqueda Lineal ($O(n)$)**: Recorre elemento por elemento. Es la unica
 *   opcion si los datos NO estan ordenados ni indexados.
 * - **Busqueda Binaria ($O(\log n)$)**: Requiere que el arreglo o lista de
 *   acceso aleatorio este ORDENADO previamente. En cada paso descarta la mitad
 *   del espacio de busqueda. Para $1,000,000$ de elementos, toma a lo sumo
 *   $\lceil \log_2(10^6) \rceil = 20$ pasos!
 * - **Algoritmos de Ordenamiento Cuadraticos ($O(n^2)$)**: Burbuja (*Bubble Sort*),
 *   Seleccion (*Selection Sort*) e Insercion (*Insertion Sort*). Utiles para
 *   entender la mecanica de intercambios e invariantes de bucle (e Insertion
 *   Sort es muy rapido para arreglos diminutos de $n < 32$).
 * - **Algoritmos $O(n \log n)$ y lo que usa Java internamente**:
 *   - `Arrays.sort(primitivos)` usa **Dual-Pivot Quicksort** ($O(n \log n)$ in-place).
 *   - `Arrays.sort(Objetos)` y `List.sort(Comparator)` usan **TimSort** (hibrido
 *     de *Merge Sort* + *Insertion Sort*, $O(n \log n)$, **estable**: preserva el
 *     orden relativo de elementos con clave igual).
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Ordenamiento Multicriterio con `Comparator`: Ordenar productos por
 *   disponibilidad, luego por precio ascendente y desempatar por nombre.
 * - Busqueda Ultrarrapida en Catalogos en Memoria: Ordenar una tabla de tarifas
 *   o rangos de IPs al iniciar la aplicacion y consultarla miles de veces por
 *   segundo con `Arrays.binarySearch` en $O(\log n)$.
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // 1. Busqueda Binaria segura (Cuidado con el overflow al calcular `medio`):
 * static int busquedaBinaria(int[] arr, int objetivo) {
 *     int izq = 0, der = arr.length - 1;
 *     while (izq <= der) {
 *         int medio = izq + (der - izq) / 2; // Evita overflow de (izq + der) / 2
 *         if (arr[medio] == objetivo) return medio;
 *         if (arr[medio] < objetivo) izq = medio + 1;
 *         else der = medio - 1;
 *     }
 *     return -1;
 * }
 *
 * // 2. Comparator moderno y fluido (Java 8+):
 * // Comparator<Producto> comparador = Comparator
 * //     .comparingDouble(Producto::precio)
 * //     .thenComparing(Producto::nombre);
 * // productos.sort(comparador);
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Ordenar una lista de candidatos de un proceso de seleccion primero
 * por puntaje descendente y, en caso de empate, por orden alfabetico de nombre.
 *
 * record Candidato(String nombre, int puntaje) {}
 *
 * // Ejecucion en main:
 * // Candidato[] candidatos = {
 * //     new Candidato("Carlos", 85),
 * //     new Candidato("Ana", 92),
 * //     new Candidato("Beatriz", 85)
 * // };
 * // Arrays.sort(candidatos, Comparator
 * //     .comparingInt(Candidato::puntaje).reversed()
 * //     .thenComparing(Candidato::nombre));
 * // System.out.println(Arrays.toString(candidatos));
 * //
 * // Salida esperada:
 * // [Candidato[nombre=Ana, puntaje=92], Candidato[nombre=Beatriz, puntaje=85], Candidato[nombre=Carlos, puntaje=85]]
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - EL FAMOSO BUG DE OVERFLOW EN BUSQUEDA BINARIA: Escribir `int medio = (izq + der) / 2;`
 *   estalla con un numero negativo (`ArrayIndexOutOfBoundsException`) si la suma
 *   `izq + der` supera `Integer.MAX_VALUE` ($2^{31}-1$). Usa siempre:
 *   `int medio = izq + (der - izq) / 2;` o `(izq + der) >>> 1`.
 * - NUNCA RESTES VALORES EN UN `Comparator` (`(a, b) -> a.valor - b.valor`):
 *   Puede causar *Integer Overflow* si un valor es negativo grande y otro positivo.
 *   Usa siempre `Integer.compare(a.valor, b.valor)` o `Comparator.comparingInt(...)`
 *   (Effective Java Item 14).
 * - EN PRODUCCION, NO REINVENTES QUICKSORT/MERGESORT: Usa `List.sort` o
 *   `Arrays.sort` (TimSort), que estan altamente optimizados en la JVM.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Basico]
 * 1. Busqueda lineal con predicado: Implementa un metodo que busque el indice de
 *    la primera aparicion de un numero en un `int[]` y devuelva `-1` si no existe.
 * 2. Verificador de arreglo ordenado ($O(n)$): Implementa `estaOrdenadoAscendente(int[] arr)`
 *    que compruebe en una sola pasada si el arreglo ya esta ordenado sin llegar
 *    a ordenarlo.
 * 3. Ordenamiento por Insercion (*Insertion Sort*): Implementalo paso a paso
 *    sobre un `int[]` y verifica que ordene correctamente arreglos con duplicados
 *    y numeros negativos.
 *
 * [Intermedio]
 * 4. Busqueda Binaria Iterativa sin Overflow: Implementa `busquedaBinaria(int[] arr, int objetivo)`
 *    usando `izq + (der - izq) / 2` y cuenta cuantas iteraciones necesito para
 *    encontrar un elemento en un arreglo de 1,024 elementos.
 * 5. Punto de insercion (*Lower Bound* / `Arrays.binarySearch`): Adapta la
 *    busqueda binaria para que, si el elemento no existe, devuelva el indice
 *    exacto donde deberia insertarse para mantener el arreglo ordenado.
 * 6. Ordenamiento multicriterio con `Comparator`: Crea un `record Producto(String nombre, String categoria, double precio)`
 *    y ordena una lista por `categoria` ascendente, luego `precio` descendente y
 *    finalmente `nombre` ascendente.
 * 7. Implementacion de *Merge Sort* ($O(n \log n)$): Implementa el algoritmo de
 *    mezcla (*divide y venceras*) que divide un arreglo en mitades y las fusiona
 *    ordenadas mediante un metodo `fusionar(int[] izq, int[] der)`.
 *
 * [Senior / Produccion]
 * 8. Estabilidad del ordenamiento (*Stable Sort*): Demuestra con un ejemplo
 *    practico que `List.sort` (TimSort) preserva el orden original de llegada de
 *    dos pedidos que tienen la misma prioridad.
 * 9. Busqueda binaria de frontera en produccion (*First Bad Version / Umbral*):
 *    Dado un arreglo booleano o de metricas donde a partir de cierto indice todos
 *    los estados representan fallo (`[false, false, false, true, true]`), encuentra
 *    en $O(\log n)$ el PRIMER indice donde comienza el fallo.
 * 10. Top-K elementos mas grandes sin ordenar todo el arreglo: Compara ordenar
 *     todo el arreglo ($O(n \log n)$) frente a mantener una `PriorityQueue`
 *     (*Min-Heap*) de tamano $K$ ($O(n \log K)$) para obtener los 3 precios mas
 *     altos de una coleccion grande.
 */
public class Tema23AlgoritmosBusquedaOrdenamiento {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
    }
}
