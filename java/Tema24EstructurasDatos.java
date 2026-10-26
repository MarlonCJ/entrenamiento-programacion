import java.util.ArrayDeque;
import java.util.Deque;
import java.util.PriorityQueue;
import java.util.Queue;

/*
 * ============================================================================
 * TEMA 24: ESTRUCTURAS DE DATOS LINEALES Y PRIORITARIAS (STACK, QUEUE, DEQUE, HEAP)
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Modelo Mental y Memoria en la JVM)
 * ----------------------------------------------------------------------------
 * Elegir la estructura de datos correcta transforma un problema complejo en un
 * algoritmo limpio de pocas lineas con complejidad $O(1)$ por operacion.
 *
 * Modelo Mental de las Estructuras en Java:
 * 1) **Pila (Stack - LIFO: *Last-In, First-Out*)**:
 *    El ultimo elemento en entrar es el primero en salir (como una pila de platos).
 *    - Operaciones $O(1)$: `push(e)` (apilar), `pop()` (desapilar), `peek()` (ver tope).
 *    - En Java moderno NUNCA uses la clase legada `java.util.Stack` (es de Java 1.0,
 *      hereda erroneamente de `Vector` y sincroniza cada metodo). Usa siempre:
 *      `Deque<T> pila = new ArrayDeque<>();`
 * 2) **Cola (Queue - FIFO: *First-In, First-Out*)**:
 *    El primero en llegar es el primero en ser atendido (como la fila de un banco).
 *    - Operaciones $O(1)$: `offer(e)` (encolar al final), `poll()` (desencolar del
 *      frente, devuelve `null` si esta vacia), `peek()` (ver frente).
 *    - Implementacion preferida: `Queue<T> cola = new ArrayDeque<>();` (arreglo
 *      circular contiguo en memoria, mucho mas amigable con la cache del CPU que
 *      `LinkedList`).
 * 3) **Cola de Prioridad (`PriorityQueue` - Binary Heap)**:
 *    Los elementos no salen por orden de llegada, sino por su prioridad natural
 *    o `Comparator` ($O(\log n)$ para insertar/extraer, $O(1)$ para ver el minimo/maximo).
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Pilas (LIFO): Historial de "Deshacer / Rehacer" (*Undo / Redo*) en editores,
 *   navegacion "Atras/Adelante", validacion de parentesis/llaves en compiladores,
 *   y reemplazo de recursion profunda por recorridos iterativos (DFS).
 * - Colas (FIFO): Buffers de procesamiento de pedidos o mensajes por orden de
 *   llegada, busqueda en anchura (BFS) en grafos y limitadores de tasa (*Sliding Window*).
 * - Colas de Prioridad (Heap): Atencion de tickets de soporte criticos (Severidad 1
 *   antes que Severidad 3), planificadores de tareas y algoritmo de Dijkstra.
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // 1. Pila (LIFO) con ArrayDeque:
 * Deque<String> pila = new ArrayDeque<>();
 * pila.push("Accion 1");
 * pila.push("Accion 2");
 * String ultima = pila.pop(); // "Accion 2"
 *
 * // 2. Cola (FIFO) con ArrayDeque:
 * Queue<String> cola = new ArrayDeque<>();
 * cola.offer("Cliente A");
 * cola.offer("Cliente B");
 * String primero = cola.poll(); // "Cliente A"
 *
 * // 3. Cola de Prioridad (Min-Heap por defecto o con Comparator):
 * PriorityQueue<Integer> urgencias = new PriorityQueue<>();
 * urgencias.offer(3);
 * urgencias.offer(1);
 * int masUrgente = urgencias.poll(); // 1
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un validador de sintaxis verifica en $O(n)$ si los delimitadores
 * `()`, `[]` y `{}` de una expresion matematica o JSON estan bien balanceados.
 *
 * static boolean estaBalanceado(String expresion) {
 *     Deque<Character> pila = new ArrayDeque<>();
 *     for (char c : expresion.toCharArray()) {
 *         if (c == '(') pila.push(')');
 *         else if (c == '[') pila.push(']');
 *         else if (c == '{') pila.push('}');
 *         else if (c == ')' || c == ']' || c == '}') {
 *             if (pila.isEmpty() || pila.pop() != c) return false;
 *         }
 *     }
 *     return pila.isEmpty();
 * }
 * // Ejecucion en main:
 * // System.out.println("{[()]} -> " + estaBalanceado("{[()]}"));
 * // System.out.println("{[(])} -> " + estaBalanceado("{[(])}"));
 * // Salida esperada:
 * // {[()]} -> true
 * // {[(])} -> false
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - PREFIERE `ArrayDeque` SOBRE `Stack` Y `LinkedList`: `ArrayDeque` no tiene la
 *   sobrecarga de sincronizacion de `Stack` ni el costo de crear un objeto `Node`
 *   en el Heap por cada elemento como hace `LinkedList`.
 * - USA `offer()`, `poll()` Y `peek()` EN COLAS: A diferencia de `add()`, `remove()`
 *   y `element()` (que lanzan `NoSuchElementException` si la cola esta vacia),
 *   `poll()` y `peek()` devuelven `null` limpiamente cuando no quedan elementos.
 * - GOTCHA DE `PriorityQueue`: Iterar una `PriorityQueue` con un `for-each` NO
 *   recorre los elementos en orden! El orden solo esta garantizado al extraerlos
 *   uno por uno con `while (!pq.isEmpty()) pq.poll()`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Basico]
 * 1. Inversion con Pila (LIFO): Usa una `Deque<Character>` (`ArrayDeque`) para
 *    invertir una cadena de texto y comprobar su funcionamiento LIFO.
 * 2. Fila de atencion al cliente (FIFO): Simula la llegada de 5 clientes a una
 *    `Queue<String>` y atiendelos en estricto orden de llegada con `poll()`.
 * 3. Historial de navegacion basico: Implementa una clase `HistorialNavegador`
 *    con `visitar(String url)`, `atras()` y `verActual()` usando una pila.
 *
 * [Intermedio]
 * 4. Validador completo de delimitadores (`()`, `[]`, `{}`): Implementa el
 *    algoritmo que valide expresiones e indique si quedo algun delimitador sin
 *    cerrar al final.
 * 5. Sistema completo de *Undo / Redo* (Deshacer y Rehacer): Usa DOS pilas
 *    (`pilaUndo` y `pilaRedo`) para un editor de texto: al escribir una nueva
 *    accion se limpia `pilaRedo`, `deshacer()` mueve de `undo` a `redo`, y
 *    `rehacer()` mueve de `redo` a `undo`.
 * 6. Evaluador de expresiones en Notacion Polaca Inversa (RPN / Postfija):
 *    Evalua expresiones como `"3 4 + 2 *"` (= 14) usando una `Deque<Double>`.
 * 7. Centro de triaje medico con `PriorityQueue`: Crea un `record Paciente(String nombre, int nivelUrgencia, int ordenLlegada)`
 *    y usa una `PriorityQueue` que atienda primero al menor `nivelUrgencia` (1 es
 *    mas grave que 5) y, en caso de empate, al menor `ordenLlegada`.
 *
 * [Senior / Produccion]
 * 8. Ventana deslizante con `Deque` (Buffer circular de logs recientes):
 *    Implementa un `UltimosEventosBuffer` con capacidad maxima $K$ que en $O(1)$
 *    agregue nuevos eventos al final y descarte automaticamente el mas antiguo
 *    del frente cuando supere $K$.
 * 9. Implementa una Cola (FIFO) usando exclusivamente dos Pilas (LIFO):
 *    Crea la clase `ColaConDosPilas<T>` (`pilaEntrada` y `pilaSalida`) logrando
 *    complejidad $O(1)$ amortizada en `encolar` y `desencolar`.
 * 10. Pila con minimo en tiempo constante ($O(1)$ `MinStack`): Disena una clase
 *     `PilaConMinimo` que soporte `push(int)`, `pop()`, `top()` y `obtenerMinimo()`
 *     todos en tiempo $O(1)$ sin recorrer la pila.
 */
public class Tema24EstructurasDatos {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
    }
}
