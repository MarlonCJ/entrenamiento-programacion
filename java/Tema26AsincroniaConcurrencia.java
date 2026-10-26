import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/*
 * ============================================================================
 * TEMA 26: ASINCRONIA, CONCURRENCIA, EXECUTORS, COMPLETABLEFUTURE Y VIRTUAL THREADS
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Modelo Mental y Java Memory Model - JMM)
 * ----------------------------------------------------------------------------
 * En sistemas modernos, un servidor atiende miles de peticiones simultaneas y
 * consulta multiples servicios externos (bases de datos, pasarelas de pago, APIs).
 * Si las haces en serie bloqueando el hilo, la latencia se suma; si las ejecutas
 * concurrentemente sin control, corromperas la memoria (*Race Conditions*).
 *
 * Modelo Mental de Concurrencia en la JVM:
 * 1) **Condiciones de Carrera (*Race Conditions*) y Visibilidad**:
 *    La operacion `contador++` NO es atomica: consta de 3 pasos en CPU (leer de
 *    memoria, sumar 1 en registro, escribir). Si dos hilos ejecutan `contador++`
 *    al mismo tiempo sobre un `int` normal, se pierden incrementos (*Lost Updates*).
 * 2) **Herramientas de Sincronizacion Segura (`java.util.concurrent`)**:
 *    - **Inmutabilidad**: Los objetos inmutables (`record`, `final`) nunca sufren
 *      condiciones de carrera y pueden compartirse libremente entre hilos.
 *    - **Variables Atomicas (`AtomicInteger`, `AtomicLong`, `LongAdder`)**:
 *      Usan instrucciones de hardware CAS (*Compare-And-Swap*) sin bloquear hilos.
 *    - **Colecciones Concurrentes (`ConcurrentHashMap`, `CopyOnWriteArrayList`)**:
 *      Reemplazan a `HashMap` y `ArrayList` cuando varios hilos leen y escriben.
 * 3) **Pools de Hilos (`ExecutorService`), `CompletableFuture` y *Virtual Threads* (Java 21+)**:
 *    - Nunca crees hilos crudos con `new Thread().start()` sin control. Usa un
 *      `ExecutorService` (que implementa `AutoCloseable` en Java 19+).
 *    - `CompletableFuture<T>`: Permite componer llamadas asincronas en paralelo
 *      (`supplyAsync`, `thenApply`, `thenCombine`, `allOf`, `exceptionally`).
 *    - *Virtual Threads* (`Executors.newVirtualThreadPerTaskExecutor()`, Java 21):
 *      Hilos ultraligeros gestionados por la JVM ideales para miles de tareas I/O.
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Agregacion Paralela de Microservicios (*Fan-Out / Fan-In*): Consultar al
 *   mismo tiempo el perfil del cliente (100ms), su historial de pedidos (120ms)
 *   y sus puntos de fidelidad (90ms) con `CompletableFuture.allOf`, tardando
 *   ~120ms en total en lugar de 310ms.
 * - Contadores de Metricas y Limitadores de Tasa (*Rate Limiters*) en Memoria:
 *   Usar `ConcurrentHashMap<String, AtomicInteger>` con `computeIfAbsent`.
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // 1. Contador Thread-Safe sin bloqueos pesados usando AtomicInteger:
 * AtomicInteger visitas = new AtomicInteger(0);
 * int nuevoValor = visitas.incrementAndGet(); // Atomico en hardware (CAS)
 *
 * // 2. Composicion asincrona en paralelo con CompletableFuture:
 * CompletableFuture<Double> futuroPrecio = CompletableFuture.supplyAsync(() -> 100.0);
 * CompletableFuture<Double> futuroImpuesto = CompletableFuture.supplyAsync(() -> 19.0);
 * double total = futuroPrecio.thenCombine(futuroImpuesto, Double::sum).join(); // 119.0
 *
 * // 3. Pool de hilos con cierre seguro:
 * // ExecutorService pool = Executors.newFixedThreadPool(4);
 * // try { ... } finally { pool.shutdown(); }
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un agregador de e-commerce consulta en paralelo el precio base de un
 * producto y el descuento del cliente usando `CompletableFuture`, aplica un
 * fallback seguro con `exceptionally` si falla el servicio de descuentos, y
 * combina ambos resultados.
 *
 * static void cotizacionAsincronaDemo() {
 *     CompletableFuture<Double> fPrecio = CompletableFuture.supplyAsync(() -> 200.0);
 *     CompletableFuture<Double> fDescuento = CompletableFuture.<Double>supplyAsync(() -> {
 *         throw new RuntimeException("Timeout en servicio de promociones");
 *     }).exceptionally(ex -> 0.0); // Fallback resiliente a 0.0 de descuento
 *
 *     double totalFinal = fPrecio.thenCombine(fDescuento, (precio, desc) -> precio - desc).join();
 *     System.out.println("Total cotizado de forma resiliente: " + totalFinal);
 * }
 * // Salida esperada:
 * // Total cotizado de forma resiliente: 200.0
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA USES `HashMap` NI `ArrayList` ENTRE MULTIPLES HILOS ESCRITORES:
 *   `HashMap` no es thread-safe; modificarlo concurrentemente corrompe sus cubetas
 *   internas. Usa siempre `ConcurrentHashMap`.
 * - SIEMPRE CIERRA EL `ExecutorService`: Si creas un `Executors.newFixedThreadPool(4)`
 *   y olvidas llamar a `shutdown()`, los hilos del pool no son *daemon* por
 *   defecto y el proceso de la JVM nunca terminara.
 * - EVITA INTERBLOQUEOS (*Deadlocks*): Si el Hilo 1 bloquea el Recurso A y espera
 *   el Recurso B, mientras el Hilo 2 bloquea B y espera A, ambos quedan congelados
 *   para siempre. Adquiere siempre los bloqueos en un orden global consistente
 *   (ej. ordenando por el `id` de la cuenta bancaria antes de sincronizar).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Basico]
 * 1. Demostracion y correccion de *Race Condition*: Lanza 4 hilos que incrementen
 *    10,000 veces un contador; compara un `int` normal (pierde incrementos)
 *    frente a un `AtomicInteger` (da exactamente 40,000).
 * 2. Tarea asincrona con `CompletableFuture.supplyAsync`: Ejecuta un calculo en
 *    segundo plano, transformalo con `.thenApply(...)` y recupera el resultado.
 * 3. Manejo de errores asincronos: Usa `.exceptionally(...)` y `.handle(...)`
 *    en un `CompletableFuture` para devolver un valor por defecto cuando una
 *    tarea asincrona lanza una excepcion.
 *
 * [Intermedio]
 * 4. Ejecucion en paralelo (*Fan-Out / Fan-In*): Simula 3 consultas a servicios
 *    (`obtenerCliente`, `obtenerSaldo`, `obtenerPuntos`) que tardan 50ms cada
 *    una; lanzalas en paralelo con `CompletableFuture.allOf` o `thenCombine` y
 *    comprueba que el tiempo total es ~50ms y no 150ms.
 * 5. Diccionario de frecuencias concurrente: Usa `ConcurrentHashMap<String, AtomicInteger>`
 *    y `computeIfAbsent(clave, k -> new AtomicInteger()).incrementAndGet()` desde
 *    multiples hilos para contar eventos por categoria sin perder ninguno.
 * 6. Procesamiento de lote con `ExecutorService` y `Future`: Envia 10 tareas
 *    `Callable<Integer>` a un pool de 3 hilos (`Executors.newFixedThreadPool(3)`),
 *    recolecta la suma de sus resultados y cierra el pool limpiamente en `finally`.
 * 7. Transferencia bancaria Thread-Safe sin *Deadlock*: Implementa un metodo
 *    `transferir(Cuenta origen, Cuenta destino, long monto)` que adquiera los
 *    bloqueos (`synchronized`) siempre en orden ascendente de `cuenta.getId()`
 *    para hacer matematicamente imposible un interbloqueo circular.
 *
 * [Senior / Produccion]
 * 8. Patron Productor-Consumidor con `BlockingQueue`: Usa una `ArrayBlockingQueue<String>(5)`
 *    donde un hilo productor encola trabajos con `put()` (aplicando *backpressure*
 *    si la cola se llena) y dos hilos consumidores los procesan con `take()`.
 * 9. Timeout y Resiliencia en Llamadas Externas (`orTimeout` / `completeOnTimeout`):
 *    En un `CompletableFuture` que simula un servicio lento, configura un limite
 *    de tiempo con `.completeOnTimeout("Respuesta desde Cache", 100, TimeUnit.MILLISECONDS)`.
 * 10. Cache en Memoria Thread-Safe con Computacion Unica: Implementa una clase
 *     `CacheSegura<K, V>` respaldada por `ConcurrentHashMap` que garantice que
 *     ante una clave ausente la funcion de carga se ejecute de forma segura.
 */
public class Tema26AsincroniaConcurrencia {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
    }
}
