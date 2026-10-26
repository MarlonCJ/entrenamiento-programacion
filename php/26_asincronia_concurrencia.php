<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 26: ASINCRONÍA, FIBERS (PHP 8.1+), STREAMS NO BLOQUEANTES Y CONCURRENCIA
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Ejecución en PHP 8.1+)
 * ----------------------------------------------------------------------------
 * Tradicionalmente, PHP operaba bajo un modelo puramente síncrono de "compartir
 * nada" (*Shared-Nothing Architecture* en PHP-FPM): cada petición HTTP nace en
 * su propio proceso aislado, bloquea el hilo mientras espera una consulta SQL o
 * una llamada HTTP cURL, y muere al enviar la respuesta.
 *
 * Sin embargo, en el PHP moderno de nivel Senior (PHP 8.1+ con **Fibers**,
 * `curl_multi`, Streams no bloqueantes, Swoole, FrankenPHP, Revolt y ReactPHP/Amp),
 * PHP soporta **Multitarea Cooperativa (Concurrencia en un solo hilo)**:
 *
 * 1) **Fibers (`Fiber`, PHP 8.1+)**:
 *    Una *Fiber* (Fibra o Corrutina con pila propia) es un bloque de código que
 *    puede **pausarse a sí mismo** en cualquier punto con `Fiber::suspend($valor)`
 *    devolviendo el control al planificador (*Event Loop*), y **reanudarse** más
 *    tarde exactamente donde se quedó con `$fiber->resume($datos)` sin bloquear
 *    el proceso principal!
 * 2) **Concurrencia vs Paralelismo**:
 *    - **Concurrencia (Fibers / Event Loop / `curl_multi`)**: Un solo hilo inicia
 *      5 llamadas de red al mismo tiempo y, mientras espera que la red responda,
 *      avanza en otras tareas.
 *    - **Paralelismo Multi-proceso (`proc_open`, `pcntl`)**: Varios procesos del
 *      sistema operativo ejecutando código en distintos núcleos de CPU.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Agregación Concurrente de APIs Externas: Lanzar 3 peticiones HTTP o tareas
 *   I/O concurrentes intercalando su ejecución mediante un planificador de `Fiber`.
 * - Procesamiento Cooperativo de Lotes: Intercalar la lectura de archivos,
 *   envío de notificaciones y cálculo de reportes sin congelar el hilo principal.
 * - Prevención de Condiciones de Carrera entre Procesos PHP-FPM: Usar bloqueos
 *   atómicos de archivo (`flock`) o de base de datos cuando dos peticiones HTTP
 *   intentan modificar el mismo recurso compartido al mismo tiempo.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Ciclo de vida completo de una Fiber nativa (PHP 8.1+):
 * $fibra = new Fiber(function (string $tarea): string {
 *     echo "[Fibra] Iniciando: {$tarea}" . PHP_EOL;
 *     // Pausa la fibra y envía un mensaje al exterior:
 *     $respuestaExterna = Fiber::suspend("Esperando respuesta de I/O...");
 *     echo "[Fibra] Reanudada con: {$respuestaExterna}" . PHP_EOL;
 *     return "Resultado final de {$tarea}";
 * });
 *
 * // $mensajeSuspension = $fibra->start("Descarga API"); // Inicia hasta el 1er suspend
 * // $fibra->resume("HTTP 200 OK");                      // Reanuda la fibra
 * // $retorno = $fibra->getReturn();                     // Obtiene el return final
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un mini-planificador cooperativo (*Round-Robin Scheduler*) ejecuta
 * dos tareas concurrentes basadas en `Fiber` intercalando sus pasos de progreso.
 *
 * function crearTareaCooperativa(string $nombre, int $pasos): Fiber {
 *     return new Fiber(function () use ($nombre, $pasos): string {
 *         for ($i = 1; $i <= $pasos; $i++) {
 *             Fiber::suspend("[{$nombre}] Paso {$i}/{$pasos}");
 *         }
 *         return "[{$nombre}] COMPLETADA";
 *     });
 * }
 *
 * $colaFibras = [
 *     crearTareaCooperativa('PagoStripe', 2),
 *     crearTareaCooperativa('EnvioEmail', 2),
 * ];
 *
 * // Planificador (Event Loop simplificado):
 * while ($colaFibras !== []) {
 *     foreach ($colaFibras as $idx => $fibra) {
 *         if (!$fibra->isStarted()) {
 *             $estado = $fibra->start();
 *         } elseif ($fibra->isSuspended()) {
 *             $estado = $fibra->resume();
 *         }
 *         if ($fibra->isTerminated()) {
 *             echo $fibra->getReturn() . PHP_EOL;
 *             unset($colaFibras[$idx]);
 *         } else {
 *             echo $estado . PHP_EOL;
 *         }
 *     }
 * }
 * // Salida esperada:
 * // [PagoStripe] Paso 1/2
 * // [EnvioEmail] Paso 1/2
 * // [PagoStripe] Paso 2/2
 * // [EnvioEmail] Paso 2/2
 * // [PagoStripe] COMPLETADA
 * // [EnvioEmail] COMPLETADA
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - VERIFICA SIEMPRE EL ESTADO DE LA FIBER (`isStarted`, `isSuspended`, `isTerminated`):
 *   Llamar a `$fiber->resume()` en una fibra que aún no ha iniciado o que ya
 *   terminó lanza un `FiberError`. Asimismo, llamar a `$fiber->getReturn()`
 *   antes de que `isTerminated()` sea `true` lanza `FiberError`.
 * - LAS FIBERS NO SON HILOS DEL SISTEMA OPERATIVO: Una `Fiber` se ejecuta en el
 *   mismo hilo que la llamó. Si dentro de una `Fiber` ejecutas un bucle infinito
 *   de CPU o un `sleep(10)` bloqueante sin llamar a `Fiber::suspend()`, bloquearás
 *   todo el proceso.
 * - PROPAGACIÓN DE EXCEPCIONES EN FIBERS (`$fiber->throw($ex)`): Puedes inyectar
 *   una excepción dentro de una fibra suspendida usando `$fiber->throw(new TimeoutException())`,
 *   y la fibra podrá capturarla con un `try / catch` justo donde hizo `Fiber::suspend()`!
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Mi primera `Fiber`: Crea una `Fiber` que reciba un monto inicial en `start()`,
 *    se suspenda devolviendo el subtotal con IVA, reciba un descuento en `resume()`
 *    y retorne el total final obteniéndolo con `getReturn()`.
 * 2. Inspección de estados de `Fiber`: Imprime los valores de `isStarted()`,
 *    `isRunning()`, `isSuspended()` e `isTerminated()` antes de iniciar, durante
 *    la suspensión y después de finalizar una `Fiber`.
 * 3. Inyección de excepciones con `$fiber->throw()`: Suspende una `Fiber` dentro
 *    de un bloque `try / catch` e inyéctale desde afuera una `RuntimeException`
 *    con `$fiber->throw(...)` para demostrar cómo se recupera limpiamente.
 *
 * [Intermedio]
 * 4. Planificador Cooperativo (*Event Loop* Round-Robin): Crea una clase
 *    `PlanificadorFibras` que permita registrar múltiples `Fiber` y ejecutarlas
 *    de forma intercalada hasta que todas terminen, recolectando sus retornos.
 * 5. Simulación de `async` / `await` con `Fiber`: Implementa dos funciones
 *    `async(callable $fn): Fiber` y `await(Fiber $f): mixed` para simular la
 *    ergonomía de promesas/corrutinas en PHP 8.1+.
 * 6. Productor-Consumidor Bidireccional con `Fiber`: Crea una fibra consumidora
 *    que procese mensajes enviados uno por uno mediante `$consumidor->resume($mensaje)`
 *    y devuelva el acuse de recibo (`ACK`) en cada `Fiber::suspend()`.
 * 7. Streams en memoria no bloqueantes (`php://memory` / `stream_set_blocking`):
 *    Demuestra cómo abrir un flujo en memoria, configurar lectura y medir bytes
 *    transferidos con `stream_copy_to_stream`.
 *
 * [Senior / Producción]
 * 8. Mutex / Semáforo entre Procesos con `flock()` (`LOCK_EX | LOCK_NB`):
 *    Implementa una clase `BloqueoExclusivoArchivo` que adquiera un bloqueo de
 *    sistema operativo sobre un archivo `.lock` sin bloquear indefinidamente
 *    (`LOCK_NB`), impidiendo que dos instancias de un cronjob se ejecuten a la vez.
 * 9. Pool de Concurrencia con Límite de Tareas Simultáneas (*Concurrency Limiter*):
 *    Implementa un ejecutor que reciba 10 tareas basadas en `Fiber`, pero
 *    mantenga como máximo 3 fibras activas simultáneamente en vuelo.
 * 10. Manejo de Timeouts Cooperativos en el Event Loop: Mejora tu planificador
 *     de fibras para que mida con `hrtime(true)` cuánto tiempo lleva suspendida
 *     cada tarea y, si supera un umbral `$timeoutMs`, le inyecte automáticamente
 *     una excepción de timeout con `$fiber->throw(...)`.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
