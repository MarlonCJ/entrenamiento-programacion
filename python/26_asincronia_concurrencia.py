r"""
============================================================================
TEMA 26: ASINCRONÍA Y CONCURRENCIA (ASYNCIO, GIL, HILOS Y PROCESOS)
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: event loop, GIL y ejecutores)
----------------------------------------------------------------------------
1) **Concurrencia no es paralelismo**: concurrencia = gestionar muchas tareas
   que avanzan intercaladas; paralelismo = ejecutarlas literalmente a la vez
   en varios núcleos. Python ofrece tres herramientas distintas:
   - `asyncio`: UN hilo, UN event loop, miles de corrutinas cooperativas.
   - `threading`: varios hilos del sistema operativo dentro de un proceso.
   - `multiprocessing` / `ProcessPoolExecutor`: varios procesos, cada uno con
     su propio intérprete y memoria (paralelismo real de CPU).
2) **El GIL (Global Interpreter Lock)**: en CPython clásico solo un hilo
   ejecuta bytecode Python a la vez. Los hilos SÍ sirven para I/O (el GIL se
   libera mientras se espera red/disco o dentro de C como `hashlib`, `zlib`),
   pero NO aceleran cálculos en Python puro. Python 3.13 trae una compilación
   experimental *free-threaded* (`python3.13t`, PEP 703) sin GIL; aún no es la
   opción por defecto y muchas extensiones C no están listas.
3) **Cómo funciona asyncio**: `async def` crea una función corrutina; llamarla
   NO la ejecuta, devuelve un objeto corrutina. `await` suspende la corrutina y
   devuelve el control al event loop, que reanuda a otra que esté lista
   (multitarea cooperativa). Si una corrutina hace trabajo bloqueante
   (`time.sleep`, `requests.get`, un bucle de CPU), congela TODO el loop.
4) **Primitivas modernas (3.11+)**:
   - `asyncio.TaskGroup`: concurrencia estructurada; si una tarea falla, cancela
     las demás y propaga un `ExceptionGroup` (se captura con `except*`).
   - `asyncio.timeout(seg)`: límite de tiempo como gestor de contexto; al
     vencer lanza `TimeoutError` (alias del builtin desde 3.11).
   - `asyncio.Semaphore(n)`: limita cuántas corrutinas entran a la vez.
   - `asyncio.to_thread(func)`: ejecuta código bloqueante en un hilo sin
     congelar el loop.
5) **`concurrent.futures`**: API unificada de alto nivel. `ThreadPoolExecutor`
   para I/O bloqueante, `ProcessPoolExecutor` para CPU. Ambos devuelven
   `Future` y se usan con `map()`, `submit()` y `as_completed()`.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- asyncio: APIs con FastAPI/aiohttp, websockets de chat, scrapers que consultan
  cientos de endpoints, gateways IoT que reciben lecturas de miles de sensores.
- Hilos: llamar a librerías bloqueantes (SDKs, drivers de BD síncronos) en
  paralelo, descargar archivos de S3, tareas en segundo plano en apps de
  escritorio.
- Procesos: redimensionar imágenes, generar PDFs masivos, cálculos de riesgo
  financiero, entrenamiento o inferencia de modelos en CPU.
- Semáforos y timeouts: respetar el rate limit de un proveedor (máx. 5
  peticiones simultáneas) y no dejar colgado un checkout por un servicio lento.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
import asyncio
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor

async def obtener_lectura(sensor: str) -> float:
    await asyncio.sleep(0.1)            # I/O simulado, NO time.sleep
    return 21.5

async def main() -> None:
    # gather: varias corrutinas a la vez, resultados en el MISMO orden
    a, b = await asyncio.gather(obtener_lectura("S1"), obtener_lectura("S2"))
    # return_exceptions=True: los errores vuelven como valores, no abortan
    resultados = await asyncio.gather(*corrutinas, return_exceptions=True)

    async with asyncio.TaskGroup() as tg:          # 3.11+
        t1 = tg.create_task(obtener_lectura("S3"))
    print(t1.result())                  # al salir del bloque, todas terminaron

    try:
        async with asyncio.timeout(2):  # 3.11+ (antes: asyncio.wait_for)
            await obtener_lectura("S4")
    except TimeoutError:
        print("sensor sin respuesta")

    datos = await asyncio.to_thread(leer_archivo_grande, "lecturas.csv")

try:
    ...
except* ValueError as grupo:            # manejar ExceptionGroup del TaskGroup
    for error in grupo.exceptions: ...

asyncio.run(main())                     # punto de entrada: crea y cierra el loop

# CPU en paralelo real (obligatorio el guard en Windows/macOS: usan "spawn")
if __name__ == "__main__":
    with ProcessPoolExecutor() as pool:
        hashes = list(pool.map(calcular_hash, rutas))
    with ThreadPoolExecutor(max_workers=8) as pool:
        paginas = list(pool.map(descargar, urls))

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Una plataforma logística cotiza un envío con 4 transportistas. El
proveedor de integraciones solo permite 2 consultas simultáneas (semáforo) y
cada cotización tiene un límite de 0.5 s; el transportista lento se descarta
sin bloquear a los demás.

import asyncio

TARIFAS = {  # nombre: (segundos de respuesta simulados, precio en pesos)
    "Rápido": (0.2, 18_500),
    "Económico": (0.3, 12_900),
    "Lento": (2.0, 9_900),
    "Express": (0.1, 25_000),
}

async def cotizar(nombre: str, limite: asyncio.Semaphore) -> tuple[str, int | None]:
    demora, precio = TARIFAS[nombre]
    async with limite:                       # máx. 2 consultas a la vez
        try:
            async with asyncio.timeout(0.5):
                await asyncio.sleep(demora)  # simula la llamada HTTP
                return nombre, precio
        except TimeoutError:
            return nombre, None

async def main() -> None:
    limite = asyncio.Semaphore(2)
    async with asyncio.TaskGroup() as tg:
        tareas = [tg.create_task(cotizar(nombre, limite)) for nombre in TARIFAS]
    resultados = [tarea.result() for tarea in tareas]
    for nombre, precio in resultados:
        estado = f"${precio:,}" if precio is not None else "sin respuesta (timeout)"
        print(f"{nombre:<10} {estado}")
    validas = [r for r in resultados if r[1] is not None]
    mejor = min(validas, key=lambda r: r[1])
    print(f"Mejor oferta: {mejor[0]} a ${mejor[1]:,}")

asyncio.run(main())

# Salida esperada:
# Rápido     $18,500
# Económico  $12,900
# Lento      sin respuesta (timeout)
# Express    $25,000
# Mejor oferta: Económico a $12,900

(Línea de tiempo: Rápido y Económico arrancan en t=0; Rápido libera el
semáforo en 0.2 s y entra Lento; Económico lo libera en 0.3 s y entra Express,
que termina en 0.4 s; Lento vence su timeout en 0.7 s. Total ≈ 0.7 s frente a
los ≈ 1.1 s que tardaría en serie con los mismos timeouts.)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- ELIGE LA HERRAMIENTA POR EL TIPO DE CARGA: I/O masivo -> asyncio; I/O con
  librerías bloqueantes -> hilos; CPU -> procesos. Hilos para CPU en CPython
  con GIL suelen ir IGUAL o MÁS LENTO que la versión secuencial.
- NUNCA BLOQUEES EL LOOP: `time.sleep`, `requests` o un cálculo pesado dentro
  de `async def` detienen todas las corrutinas. Usa `await asyncio.sleep`,
  clientes async (`httpx`, `aiohttp`) o `asyncio.to_thread`.
- OLVIDAR EL `await`: `obtener_lectura("S1")` sin `await` no hace nada y emite
  `RuntimeWarning: coroutine ... was never awaited`.
- TAREAS HUÉRFANAS: `asyncio.create_task(...)` sin guardar la referencia puede
  ser recolectada por el GC a mitad de ejecución. Prefiere `TaskGroup`.
- NO SILENCIES `CancelledError`: hereda de `BaseException` (3.8+) para que
  `except Exception` no la trague; si la capturas para limpiar, re-lánzala.
- CONDICIONES DE CARRERA CON HILOS: `contador += 1` NO es atómico (leer, sumar,
  escribir). Protege el estado compartido con `threading.Lock` o, mejor,
  comunica hilos con `queue.Queue`.
- PROCESOS: los argumentos y resultados se serializan con `pickle` (nada de
  lambdas ni conexiones abiertas) y SIEMPRE usa `if __name__ == "__main__":`.
- `gather` SIN `return_exceptions=True` propaga el primer error pero NO cancela
  las demás corrutinas: por eso `TaskGroup` es la opción moderna y segura.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Primera corrutina: `saludar(nombre, demora)` que espere con `asyncio.sleep`
   e imprima un saludo; lanza 3 con `asyncio.gather` y verifica que el tiempo
   total es el de la más lenta (mídelo con `time.perf_counter`).
2. Secuencial vs concurrente: `descargar_reporte(id)` que tarde 0.3 s; compara
   el tiempo de 5 descargas con `await` en serie frente a un `TaskGroup`.
3. Timeout de sensor: `leer_sensor(id, demora)` envuelto en
   `asyncio.timeout(1)` que devuelva `None` y registre un aviso si se excede.

[Intermedio]
4. Rate limit: `consultar_api(n, limite: asyncio.Semaphore)` para 20 peticiones
   con máximo 3 simultáneas; imprime cuántas hay en vuelo en cada momento.
5. Productor/consumidor: con `asyncio.Queue(maxsize=10)`, un productor que
   genere 50 pedidos y 3 consumidores que los procesen; termina limpio con
   `queue.join()` y cancelando los consumidores.
6. Carrera de hilos: incrementa un contador global 1_000_000 de veces desde 4
   hilos, demuestra el resultado incorrecto y corrígelo con `threading.Lock`.
7. CPU real: `es_primo(n)` sobre 50 números grandes; compara secuencial,
   `ThreadPoolExecutor` y `ProcessPoolExecutor` y explica los tiempos por el GIL.

[Senior / Producción]
8. Reintentos con backoff: `con_reintentos(corrutina_factory, intentos=4)` con
   espera exponencial + jitter, timeout por intento y que respete la
   cancelación (no capture `CancelledError`).
9. Fallo estructurado: lanza 5 tareas en un `TaskGroup` donde 2 lanzan
   `ValueError` y `KeyError`; captura con `except*` cada tipo por separado y
   demuestra que las tareas restantes fueron canceladas.
10. Puente síncrono/asíncrono: integra una librería bloqueante simulada
    (`time.sleep`) en un servicio asyncio usando `asyncio.to_thread`, mide que
    el loop sigue respondiendo (un "latido" cada 100 ms) y escribe pruebas con
    `unittest.IsolatedAsyncioTestCase`.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
