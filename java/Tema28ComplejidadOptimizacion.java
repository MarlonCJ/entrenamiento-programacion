import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/*
 * ============================================================================
 * TEMA 28: COMPLEJIDAD ALGORITMICA (BIG-O), MEMOIZACION Y OPTIMIZACION EN LA JVM
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Modelo Mental de Escalabilidad y Memoria)
 * ----------------------------------------------------------------------------
 * Un algoritmo que parece instantaneo en tu laptop con 50 registros puede
 * congelar un servidor en produccion cuando la tabla crece a 50,000 registros.
 * La notacion **Big-O** mide como crece el numero de operaciones (Tiempo) y el
 * consumo de memoria (Espacio) en funcion del tamano de entrada $n$:
 *
 * Jerarquia de Complejidad (de mejor a peor para $n = 100,000$):
 * - $O(1)$ Constante: ~1 operacion (`HashMap.get`, acceso `arr[i]`).
 * - $O(\log n)$ Logaritmica: ~17 operaciones (`Arrays.binarySearch`, `TreeMap.get`).
 * - $O(n)$ Lineal: $100,000$ operaciones (un bucle simple o un `Stream` en una pasada).
 * - $O(n \log n)$ Linealitmica: ~$1,700,000$ operaciones (`List.sort` / TimSort).
 * - $O(n^2)$ Cuadratica: $10,000,000,000$ operaciones! (Doble bucle anidado o
 *   llamar a `list.contains()` dentro de un bucle). Tarda varios segundos/minutos.
 * - $O(2^n)$ Exponencial: Inviable para $n > 40$ (recursion ingenua sin cache).
 *
 * Tecnicas Senior de Optimizacion en la JVM:
 * 1) **Indexacion en Memoria con `HashMap` / `HashSet`**: Convertir un bucle
 *    anidado $O(n \times m)$ en dos pasadas lineales $O(n + m)$ pre-indexando
 *    una de las colecciones en un `Map` o `Set`.
 * 2) **Memoizacion y Cache LRU (*Least Recently Used*)**: Guardar resultados de
 *    calculos costosos y limitar el tamano maximo de la cache para no provocar
 *    un `OutOfMemoryError`.
 * 3) **Tipos Primitivos y Preasignacion de Capacidad**: Evitar el *Autoboxing*
 *   (`long` vs `Long`) en bucles intensivos y preasignar el tamano de `ArrayList`
 *   o `StringBuilder` cuando se conoce de antemano.
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Cruce de Datos en Memoria (*In-Memory Hash Join*): Unir una lista de 50,000
 *   pedidos con una lista de 10,000 clientes en milisegundos usando un
 *   `Map<String, Cliente>` en lugar de recorrer la lista de clientes por cada pedido.
 * - Ventana Deslizante (*Sliding Window*) y Dos Punteros (*Two Pointers*):
 *   Calcular promedios moviles o detectar rafagas de trafico en $O(n)$ en lugar
 *   de recalcular cada ventana desde cero en $O(n \times k)$.
 * - Caches Acotadas en Memoria (LRU Cache): Mantener en RAM solo las 1,000
 *   configuraciones o sesiones mas usadas recientemente usando `LinkedHashMap`.
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // 1. Eliminar O(n^2) convirtiendo una lista de busqueda a HashSet O(1):
 * // MAL O(n * m): for (String id : candidatos) if (listaNegraList.contains(id)) ...
 * // BIEN O(n + m):
 * // Set<String> listaNegraSet = Set.copyOf(listaNegraList);
 * // for (String id : candidatos) if (listaNegraSet.contains(id)) ...
 *
 * // 2. Cache LRU (Least Recently Used) nativa en Java con LinkedHashMap:
 * static <K, V> Map<K, V> crearCacheLru(int maxEntradas) {
 *     return new LinkedHashMap<>(maxEntradas, 0.75f, true) {
 *         @Override
 *         protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
 *             return size() > maxEntradas;
 *         }
 *     };
 * }
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Encontrar dos transacciones en un lote cuyos montos sumen
 * exactamente un valor objetivo de conciliacion en una sola pasada $O(n)$ usando
 * un `HashMap` de complementos (en lugar de un doble bucle $O(n^2)$).
 *
 * static int[] encontrarParConciliacion(int[] montos, int objetivo) {
 *     Map<Integer, Integer> indicePorMonto = new HashMap<>();
 *     for (int i = 0; i < montos.length; i++) {
 *         int complemento = objetivo - montos[i];
 *         if (indicePorMonto.containsKey(complemento)) {
 *             return new int[]{indicePorMonto.get(complemento), i};
 *         }
 *         indicePorMonto.put(montos[i], i);
 *     }
 *     return new int[]{-1, -1};
 * }
 * // Ejecucion en main:
 * // int[] indices = encontrarParConciliacion(new int[]{120, 45, 300, 55, 90}, 100);
 * // System.out.println(java.util.Arrays.toString(indices));
 * // Salida esperada:
 * // [1, 3] (porque 45 + 55 = 100)
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - EL ASESINO SILENCIOSO DE RENDIMIENTO (`List.contains` DENTRO DE UN BUCLE):
 *   `ArrayList.contains(x)` es $O(n)$. Si lo llamas dentro de un `for` o
 *   `stream().filter( lista::contains )`, tienes un algoritmo cuadratico $O(n^2)$
 *   oculto! Convierte siempre la coleccion de consulta a un `HashSet` antes del bucle.
 * - NUNCA CREES UN CACHE EN MEMORIA SIN LIMITE DE TAMANO (Unbounded Cache):
 *   Un `HashMap` estatico usado como cache que solo crece con `.put()` y nunca
 *   desaloja entradas antiguas es una fuga de memoria (*Memory Leak*) garantizada
 *   que derribara la JVM en produccion.
 * - PREFIERE PRIMITIVOS A TIPOS BOXED (Effective Java Item 61):
 *   Escribir `Long suma = 0L; for (long i = 0; i < 10_000_000; i++) suma += i;`
 *   instancia 10 millones de objetos `Long` innecesarios. Usa `long suma = 0L;`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Basico]
 * 1. Optimizacion de concatenacion de Strings: Demuestra con `System.nanoTime()`
 *    la diferencia entre concatenar 20,000 fragmentos con `+` ($O(n^2)$ por copias)
 *    frente a usar `StringBuilder` con capacidad inicial preasignada ($O(n)$).
 * 2. Deteccion de duplicados en $O(n)$: Implementa `tieneDuplicados(int[] datos)`
 *    en una sola pasada usando un `HashSet` en lugar de un doble bucle anidado.
 * 3. Impacto del Autoboxing: Compara el tiempo de sumar 5 millones de enteros
 *    usando una variable acumulador `Long` (boxed) frente a `long` (primitivo).
 *
 * [Intermedio]
 * 4. *In-Memory Hash Join* ($O(n + m)$): Dadas una lista de 10,000 `Pedido` y
 *    una lista de 2,000 `Cliente`, unelas en tiempo lineal indexando primero los
 *    clientes en un `Map<Integer, Cliente>` en lugar de buscar en la lista por
 *    cada pedido.
 * 5. Tecnica de Ventana Deslizante (*Sliding Window* $O(n)$): Dado un arreglo de
 *    ventas diarias y un tamano de ventana $k = 7$, encuentra la suma maxima de
 *    7 dias consecutivos actualizando la ventana en $O(1)$ por paso (restando el
 *    dia que sale y sumando el que entra).
 * 6. Tecnica de Sumas Prefijas (*Prefix Sums*): Preprocesa un arreglo de ingresos
 *    diarios en un arreglo `prefijo[]` en $O(n)$ para poder responder cualquier
 *    consulta `sumaRango(diaInicio, diaFin)` en tiempo constante $O(1)$.
 * 7. Memoizacion generica con `Map.computeIfAbsent`: Optimiza una funcion de
 *    calculo recursivo o costoso envolviendola con una cache de resultados.
 *
 * [Senior / Produccion]
 * 8. Implementacion completa de **LRU Cache** (*Least Recently Used*): Construye
 *    una clase `CacheLru<K, V>` con capacidad maxima $N$ que en $O(1)$ actualice
 *    el orden de uso tanto en `get(k)` como en `put(k, v)` y desaloje el elemento
 *    menos usado recientemente al superar $N$.
 * 9. Compresion / Procesamiento en Streaming con Memoria $O(1)$: Procesa un
 *    flujo simulado de 1,000,000 de lecturas de sensores usando un `Stream` o
 *    `Iterator` perezoso para calcular metricas agregadas sin almacenar los
 *    elementos en ninguna lista en el Heap.
 * 10. Auditoria de Complejidad (Refactorizacion de Codigo Legado $O(n^3)$ a $O(n)$):
 *     Dado un metodo lento que busca que productos compraron en comun dos
 *     segmentos de clientes y calcula su frecuencia, refactorizalo para que se
 *     ejecute en tiempo lineal usando estructuras hash adecuadas.
 */
public class Tema28ComplejidadOptimizacion {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
    }
}
