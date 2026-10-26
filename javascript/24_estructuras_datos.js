'use strict';

/*
 * ============================================================================
 * TEMA 24: ESTRUCTURAS DE DATOS (PILAS LIFO, COLAS FIFO O(1), DEQUE Y HEAPS)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Estructuras en V8)
 * ----------------------------------------------------------------------------
 * En JavaScript, un `Array` nativo (`[]`) sirve perfectamente como **Pila (LIFO)**
 * porque `.push()` y `.pop()` operan al final del arreglo en tiempo constante
 * **$O(1)$**.
 *
 * ¡Pero usar un `Array` con `.shift()` como **Cola (FIFO)** en colecciones
 * grandes es una trampa de rendimiento grave!:
 * - Cuando llamas a `cola.shift()`, V8 extrae el índice `0` y tiene que
 *   desplazar todos los elementos restantes un lugar hacia la izquierda
 *   (**$O(n)$**). Encolar y desencolar 100,000 elementos con `.push()` y
 *   `.shift()` realiza $5,000,000,000$ de operaciones ($O(n^2)$)!
 * - ¿Cómo implementa un ingeniero Senior una **Cola FIFO en $O(1)$** en JavaScript?
 *   Con un objeto respaldado por dos punteros (`#cabeza` y `#cola` sobre un
 *   almacén o lista enlazada / buffer circular), logrando tanto `enqueue()` como
 *   `dequeue()` en **$O(1)$ real**!
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Pilas (LIFO): Historial de navegación, *Undo / Redo*, evaluación de
 *   expresiones, validación de tokens/delimitadores y recorrido DFS iterativo.
 * - Colas FIFO en $O(1)$: Colas de tareas asíncronas, *Rate Limiters* por
 *   ventana deslizante, recorrido en anchura (BFS) y buffers de mensajes.
 * - Cola de Prioridad (*Min-Heap / Max-Heap*): Planificadores de eventos por
 *   timestamp de expiración y atención de trabajos por criticidad en $O(\log n)$.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Pila (Stack LIFO) encapsulada en O(1):
 * class Pila {
 *     #items = [];
 *     apilar(valor) { this.#items.push(valor); }
 *     desapilar() { return this.#items.pop(); }
 *     tope() { return this.#items.at(-1); }
 *     get tamano() { return this.#items.length; }
 *      get estaVacia() { return this.#items.length === 0; }
 * }
 *
 * // 2. Cola (Queue FIFO) en O(1) REAL (Sin usar Array.prototype.shift!):
 * class ColaRapida {
 *     #almacen = new Map();
 *     #frente = 0;
 *     #final = 0;
 *
 *     encolar(valor) {
 *         this.#almacen.set(this.#final++, valor);
 *     }
 *     desencolar() {
 *         if (this.estaVacia) return undefined;
 *         const valor = this.#almacen.get(this.#frente);
 *         this.#almacen.delete(this.#frente++);
 *         return valor;
 *     }
 *     verFrente() { return this.#almacen.get(this.#frente); }
 *     get tamano() { return this.#final - this.#frente; }
 *     get estaVacia() { return this.tamano === 0; }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un motor de acciones de interfaz utiliza dos pilas (`#undo` y
 * `#redo`) para implementar "Deshacer" y "Rehacer" en tiempo constante $O(1)$.
 *
 * class GestorHistorial {
 *     #undo = [];
 *     #redo = [];
 *
 *     ejecutarAccion(estado) {
 *         this.#undo.push(estado);
 *         this.#redo.length = 0; // Nueva acción invalida el historial de rehacer
 *     }
 *
 *     deshacer() {
 *         if (this.#undo.length <= 1) return this.estadoActual;
 *         this.#redo.push(this.#undo.pop());
 *         return this.estadoActual;
 *     }
 *
 *     rehacer() {
 *         if (this.#redo.length === 0) return this.estadoActual;
 *         const recuperado = this.#redo.pop();
 *         this.#undo.push(recuperado);
 *         return recuperado;
 *     }
 *
 *     get estadoActual() { return this.#undo.at(-1) ?? null; }
 * }
 *
 * const editor = new GestorHistorial();
 * editor.ejecutarAccion('Versión 1');
 * editor.ejecutarAccion('Versión 2');
 * console.log('Tras deshacer:', editor.deshacer());
 * console.log('Tras rehacer: ', editor.rehacer());
 * // Salida esperada:
 * // Tras deshacer: Versión 1
 * // Tras rehacer:  Versión 2
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - NUNCA EXPONGAS EL ARREGLO INTERNO DE TU PILA O COLA: Si tu clase `Pila`
 *   tiene una propiedad pública `this.items = []`, cualquier código externo
 *   puede hacer `pila.items.splice(1, 1)` rompiendo la disciplina LIFO. Usa
 *   siempre un campo privado `#items`.
 * - RECUERDA VACIAR UN ARREGLO CON `arr.length = 0` CUANDO QUIERAS REUTILIZAR
 *   LA MISMA INSTANCIA: Es instantáneo y evita alojar un arreglo nuevo si no hay
 *   otras referencias externas.
 * - EN COLAS DE MÁS DE 1,000 ELEMENTOS, USA UNA COLA $O(1)$ BASADA EN PUNTEROS
 *   O LISTA ENLAZADA EN LUGAR DE `.shift()`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Implementación y prueba de `Pila` (LIFO): Crea la clase `Pila` con `#items`
 *    y úsala para invertir el orden de las palabras de una oración y verificar
 *    su funcionamiento.
 * 2. Implementación de `ColaRapida` (FIFO $O(1)$): Usa `ColaRapida` para simular
 *    el procesamiento de una fila de pedidos de impresión en estricto orden de
 *    llegada.
 * 3. Benchmark `ColaRapida.desencolar()` vs `Array.shift()`: Mide con
 *    `performance.now()` el tiempo de desencolar 30,000 elementos con ambos
 *    enfoques y comprueba la diferencia abismal entre $O(n)$ y $O(n^2)$.
 *
 * [Intermedio]
 * 4. Validador de etiquetas y delimitadores anidados con Pila: Verifica si una
 *    expresión con `()`, `[]` y `{}` está correctamente balanceada devolviendo
 *    la posición exacta del primer carácter inválido si falla.
 * 5. Simplificador de Rutas Unix (`/a/b/../c/./d` -> `/a/c/d`) con Pila:
 *    Recorre los segmentos separados por `'/'`: ignora `'.'` y vacíos, haz
 *    `.pop()` cuando encuentres `'..'` y `.push()` para nombres de carpeta.
 * 6. Cola de Doble Extremo (*Deque* - Double-Ended Queue): Implementa una clase
 *    `Deque` que permita insertar y extraer tanto por el frente (`agregarFrente`,
 *    `extraerFrente`) como por el final (`agregarFinal`, `extraerFinal`) en $O(1)$.
 * 7. Pila Monótona (*Next Greater Element*): Dado un arreglo de precios de
 *    acciones por día `[73, 74, 75, 71, 69, 72, 76, 73]`, usa una pila en $O(n)$
 *    para saber cuántos días hay que esperar desde cada día para ver un precio mayor.
 *
 * [Senior / Producción]
 * 8. Implementación de una **Cola de Prioridad (*Min-Heap*)** en $O(\log n)$:
 *    Construye la clase `ColaPrioridad` sobre un arreglo binario (`padre = Math.trunc((i - 1) / 2)`,
 *    `hijoIzq = 2 * i + 1`, `hijoDer = 2 * i + 2`) con métodos `encolar(item, prioridad)`
 *    y `extraerMasPrioritario()`.
 * 9. Limitador de Tasa por Ventana Deslizante Exacta (*Sliding Window Log Rate Limiter*):
 *    Usa una `ColaRapida` para almacenar los timestamps de las peticiones de un
 *    usuario: al llegar una nueva petición en `ahoraMs`, desencola todos los
 *    timestamps viejos menores a `ahoraMs - ventanaMs` y acepta la petición solo
 *    si `cola.tamano < limiteMaximo`.
 * 10. Recorrido en Anchura (BFS) sobre Grafo para Encontrar Camino Más Corto:
 *     Usa tu `ColaRapida` y un `Set` de visitados para encontrar la secuencia
 *     mínima de transformaciones o saltos entre dos nodos de una red.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
