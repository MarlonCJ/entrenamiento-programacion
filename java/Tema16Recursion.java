/*
 * ============================================================================
 * TEMA 16: RECURSION, PILA DE LLAMADAS Y DIVIDE Y VENCERAS
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * La recursion ocurre cuando un metodo se invoca a si mismo para resolver una
 * instancia mas pequeña del mismo problema.
 *
 * Modelo Mental en la JVM (Call Stack y Stack Frames):
 * - Cada vez que un metodo se invoca en Java, la JVM reserva un marco de pila
 *   (Stack Frame) en la pila del hilo actual (Thread Call Stack).
 * - Ese Stack Frame almacena los parametros locales, las variables locales y
 *   la direccion de retorno (donde continuar cuando el metodo termine).
 * - Todo algoritmo recursivo requiere DOS componentes innegociables:
 *   1) Caso Base (Condicion de parada): Resuelve el caso mas simple de forma
 *      directa sin realizar nuevas llamadas recursivas, iniciando el desapilado
 *      (unwinding) de los Stack Frames.
 *   2) Caso Recursivo (Reduccion): Reduce el tamaño o complejidad del problema
 *      acercandolo estrictamente al caso base en cada paso.
 * - Si el caso base nunca se alcanza o la profundidad de llamadas supera la
 *   memoria asignada al stack del hilo (configurable con `-Xss`), la JVM lanza
 *   un error fatal: `java.lang.StackOverflowError`.
 * - NOTA IMPORTANTE EN JAVA: A diferencia de lenguajes funcionales como Scala
 *   o Kotlin (`tailrec`), el compilador `javac` y la JVM actual NO realizan
 *   optimizacion de cola automatica (Tail-Call Optimization - TCO). Por ello,
 *   cualquier recursion lineal de profundidad N consume O(N) memoria en el
 *   Call Stack.
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Recorrido de estructuras jerarquicas o arboreas: Sistemas de archivos
 *   (directorios dentro de directorios), arboles DOM/HTML, documentos JSON/XML
 *   anidados, categorias de e-commerce o estructuras organizacionales.
 * - Algoritmos de Divide y Venceras: Merge Sort, Quick Sort, Busqueda Binaria.
 * - Grafos y Backtracking: Busqueda en Profundidad (DFS), resolucion de rutas,
 *   planificacion de horarios, generacion de permutaciones o combinaciones.
 * - ¿Cuando EVITARLA?: En secuencias lineales de longitud arbitraria o masiva
 *   (ej. recorrer una lista de 100,000 registros), donde un bucle iterativo
 *   (`for`/`while`) o una pila explicita en el Heap (`Deque<T>`) usa O(1) en
 *   el Call Stack y evita `StackOverflowError`.
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // Patron estructural de un metodo recursivo con acumulador / memoizacion:
 * public static long factorial(int n) {
 *     if (n < 0) {
 *         throw new IllegalArgumentException("n no puede ser negativo: " + n);
 *     }
 *     if (n == 0 || n == 1) {          // 1. CASO BASE
 *         return 1L;
 *     }
 *     return n * factorial(n - 1);     // 2. PASO RECURSIVO (n disminuye hacia 1)
 * }
 *
 * // Divide y venceras (reduccion logaritmica O(log n)):
 * public static long potenciaRapida(long base, int exp) {
 *     if (exp == 0) return 1L;
 *     long mitad = potenciaRapida(base, exp / 2);
 *     return (exp % 2 == 0) ? mitad * mitad : base * mitad * mitad;
 * }
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Calcular el peso total (en KB) de un directorio virtual que
 * contiene archivos y subdirectorios anidados a cualquier profundidad.
 *
 * import java.util.List;
 *
 * record NodoArchivo(String nombre, long tamanoKb, List<NodoArchivo> hijos) {
 *     boolean esDirectorio() { return hijos != null && !hijos.isEmpty(); }
 * }
 *
 * public static long calcularTamanoTotal(NodoArchivo nodo) {
 *     // Caso base implicito: si es un archivo hoja, la lista hijos esta vacia
 *     long total = nodo.tamanoKb();
 *     if (nodo.hijos() != null) {
 *         for (NodoArchivo hijo : nodo.hijos()) {
 *             total += calcularTamanoTotal(hijo); // Llamada recursiva por subarbol
 *         }
 *     }
 *     return total;
 * }
 *
 * // Ejecucion simulada:
 * // raiz (0 KB)
 * //  ├── config.json (12 KB)
 * //  └── src (0 KB)
 * //       ├── Main.java (45 KB)
 * //       └── Utils.java (23 KB)
 * //
 * // Salida esperada al invocar calcularTamanoTotal(raiz):
 * // Tamaño total del proyecto: 80 KB
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - Valida precondiciones antes de iniciar la recursion: Si `n < 0` en un
 *   factorial no validado, `n - 1` se alejara infinitamente de `0` causando
 *   `StackOverflowError`. Lanza `IllegalArgumentException` en la entrada.
 * - Cuidado con la explosion exponencial O(2^n): Implementar Fibonacci como
 *   `fib(n - 1) + fib(n - 2)` recalcula los mismos subproblemas millones de
 *   veces. Usa Memoizacion (Programacion Dinamica con arreglo o `Map`) o una
 *   solucion iterativa O(n).
 * - Metodo envoltorio (Helper Method Pattern): No expongas indices internos ni
 *   acumuladores en la firma publica. Crea un metodo publico limpio
 *   `esPalindromo(String texto)` que delegue en un metodo privado recursivo
 *   `esPalindromo(String texto, int izq, int der)`.
 * - No pases copias innecesarias de arreglos o subcadenas (`substring` en bucle
 *   recursivo): Pasa la referencia original junto con indices `(inicio, fin)`
 *   para mantener el consumo de memoria bajo control.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Basico]
 * 1. Cuenta regresiva y traza de pila: Crea `static void trazarPila(int n)` que
 *    imprima `"Entrando nivel " + n` antes de la llamada recursiva y
 *    `"Saliendo nivel " + n` despues de ella hasta llegar al caso base `n == 0`.
 * 2. Suma y factorial seguro: Implementa `sumaHasta(int n)` y `factorial(int n)`
 *    retornando `long` y lanzando `IllegalArgumentException` si `n < 0` o si
 *    `n > 20` (para prevenir desbordamiento de `long`).
 * 3. Digitos de un entero: Implementa `contarDigitos(long n)` y
 *    `sumarDigitos(long n)` que funcionen correctamente tanto para numeros
 *    positivos como negativos y para el `0`.
 *
 * [Intermedio]
 * 4. Potencia rapida (Divide y Venceras): Implementa `potenciaRapida(double base, int exp)`
 *    en tiempo O(log n) soportando exponentes positivos, cero y negativos.
 * 5. Palindromo con punteros recursivos: Crea un metodo publico
 *    `esPalindromo(String texto)` y su helper recursivo privado con indices
 *    `(izq, der)` sin usar `substring`, ignorando espacios y mayusculas.
 * 6. Maximo en Divide y Venceras: Encuentra el valor maximo de un `int[]`
 *    dividiendo el rango `[inicio, fin]` en dos mitades recursivamente.
 * 7. Inversion in-place de un arreglo: Invierte un arreglo `int[]` de forma
 *    recursiva intercambiando los extremos `(izq, der)` sin crear otro arreglo.
 *
 * [Senior / Produccion]
 * 8. Fibonacci O(2^n) vs Memoizacion O(n): Implementa el Fibonacci recursivo
 *    ingenuo y el Fibonacci recursivo con memoizacion (`long[] memo`), mide el
 *    tiempo con `System.nanoTime()` para `n = 42` y compara resultados.
 * 9. Explorador de arbol de categorias: Modela una jerarquia de categorias de
 *    productos e implementa un buscador recursivo que devuelva la ruta completa
 *    (breadcrumb, ej. `"Tecnologia > Computadores > Laptops"`) de una categoria
 *    buscada por nombre.
 * 10. Refactorizacion de Recursion a Pila Explicita (Heap): Toma el recorrido
 *     del arbol del ejercicio 9 y reescribelo usando `Deque<Categoria>`
 *     (`ArrayDeque`) de forma iterativa para garantizar que nunca ocurra
 *     `StackOverflowError` incluso con 50,000 niveles de profundidad.
 */
public class Tema16Recursion {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
    }
}
