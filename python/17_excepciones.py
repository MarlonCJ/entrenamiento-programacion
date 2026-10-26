r"""
============================================================================
TEMA 17: EXCEPCIONES, JERARQUÍA, ENCADENAMIENTO, EXCEPTIONGROUP Y EXCEPT*
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: desenrollado de la pila)
----------------------------------------------------------------------------
Una excepción es un OBJETO que representa un fallo. Cuando se lanza con
`raise`, CPython abandona la función actual y "desenrolla" la pila de frames
buscando el primer `try` cuyo `except` coincida con el TIPO (o un supertipo)
de la excepción. Si nadie la captura, el programa termina mostrando el
traceback.

Piezas clave:
1) **Jerarquía**: `BaseException` es la raíz. Debajo están `SystemExit`,
   `KeyboardInterrupt`, `GeneratorExit` (NO son errores de negocio) y
   `Exception`, de la que heredan los errores normales: `ValueError`,
   `TypeError`, `KeyError` y `IndexError` (ambas `LookupError`), `OSError`
   (`FileNotFoundError`, `PermissionError`, `TimeoutError`...),
   `ArithmeticError` (`ZeroDivisionError`). Captura `Exception`, nunca
   `BaseException`, salvo en la capa más externa.
2) **Bloques**: `try` (código de riesgo) / `except Tipo as e` (manejo) /
   `else` (solo si NO hubo excepción) / `finally` (SIEMPRE: liberar recursos).
3) **Encadenamiento**: dentro de un `except`, `raise Nueva(...) from e` guarda
   la causa en `__cause__` ("The above exception was the direct cause...").
   Si lanzas sin `from`, Python guarda igualmente la original en
   `__context__` ("During handling of the above exception..."). `from None`
   oculta el contexto (útil para no filtrar detalles internos).
4) **Notas (3.11+)**: `e.add_note("pedido 123")` añade contexto al traceback
   sin cambiar el tipo ni el mensaje; se guardan en `e.__notes__`.
5) **ExceptionGroup y `except*` (3.11+)**: agrupan VARIOS errores ocurridos a
   la vez (lotes, `asyncio.TaskGroup`). `except* Tipo` maneja solo la parte
   del grupo que coincide; el resto se sigue propagando.
6) **Coste**: desde 3.11 los `try` son de "coste cero" cuando no se lanza
   nada; lanzar y capturar sí cuesta (crear el objeto y el traceback), así que
   no uses excepciones para el flujo de un bucle crítico.
7) **EAFP vs LBYL**: Python favorece "es más fácil pedir perdón que permiso"
   (`try: d[clave]` / `except KeyError`) frente a comprobar antes, sobre todo
   cuando la comprobación tiene condiciones de carrera (archivos, red).

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Pasarelas de pago: traducir errores técnicos (`TimeoutError`, `KeyError`)
  a errores de dominio (`PagoRechazado`, `PasarelaNoDisponible`) con causa.
- APIs web: un manejador global convierte `ErrorValidacion` en HTTP 422 y
  `RecursoNoEncontrado` en 404 sin `if` repartidos por el código.
- Procesos por lotes: importar 10 000 filas, acumular los errores por fila y
  reportarlos juntos en un `ExceptionGroup` o en un informe.
- Reintentos ante fallos transitorios de red o de base de datos.
- Liberación garantizada de recursos: conexiones, locks, archivos temporales
  (`finally` o, mejor, gestores de contexto `with`).

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
try:
    cantidad = int(texto)
except ValueError as error:
    print(f"Cantidad inválida: {error}")
except (TypeError, OverflowError):            # varias en una tupla
    raise                                     # relanza conservando traceback
else:
    print("Convertido:", cantidad)
finally:
    print("Siempre se ejecuta")

class ErrorDominio(Exception):                # base propia de la aplicación
    pass

class StockInsuficiente(ErrorDominio):
    def __init__(self, sku: str, pedido: int, disponible: int) -> None:
        super().__init__(f"{sku}: pedido {pedido}, disponible {disponible}")
        self.sku = sku

try:
    config = cargar(ruta)
except FileNotFoundError as e:
    raise ErrorDominio("falta la configuración") from e   # __cause__

from contextlib import suppress
with suppress(FileNotFoundError):             # ignorar UN error esperado
    ruta.unlink()

try:
    raise ExceptionGroup("lote", [ValueError("a"), KeyError("b")])
except* ValueError as grupo:                  # grupo.exceptions -> (ValueError('a'),)
    ...
except* KeyError:
    ...

import logging
try:
    procesar()
except Exception:
    logging.exception("Fallo procesando")     # registra con traceback completo
    raise

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Un banco digital procesa cobros. Los errores técnicos se traducen
a errores de dominio encadenados, `finally` garantiza la auditoría y un lote
nocturno reporta todos sus fallos juntos con `ExceptionGroup` y notas.

class ErrorPago(Exception):
    def __init__(self, mensaje: str, codigo: str = "ERR") -> None:
        super().__init__(mensaje)
        self.codigo = codigo

class FondosInsuficientes(ErrorPago):
    pass

class PasarelaNoDisponible(ErrorPago):
    pass

SALDOS = {"ACC-1": 500, "ACC-2": 80}

def consultar_saldo(cuenta: str) -> int:
    try:
        return SALDOS[cuenta]
    except KeyError as e:
        raise PasarelaNoDisponible(f"cuenta {cuenta} desconocida", "GW404") from e

def cobrar(cuenta: str, monto: int) -> int:
    if monto <= 0:
        raise ValueError(f"monto inválido: {monto}")
    saldo = consultar_saldo(cuenta)
    if saldo < monto:
        raise FondosInsuficientes(f"saldo {saldo} < {monto}", "NSF")
    SALDOS[cuenta] = saldo - monto
    return SALDOS[cuenta]

def procesar(cuenta: str, monto: int) -> None:
    try:
        nuevo = cobrar(cuenta, monto)
    except FondosInsuficientes as e:          # el más específico primero
        print(f"[{e.codigo}] Rechazado: {e}")
    except ErrorPago as e:
        print(f"[{e.codigo}] Error: {e} (causa: {e.__cause__!r})")
    else:
        print(f"OK {cuenta}: nuevo saldo {nuevo}")
    finally:
        print(f"  auditoría -> {cuenta} {monto}")

def cobrar_lote(pagos: list[tuple[str, int]]) -> None:
    errores: list[Exception] = []
    for cuenta, monto in pagos:
        try:
            cobrar(cuenta, monto)
        except (ErrorPago, ValueError) as e:
            e.add_note(f"pago: {cuenta} por {monto}")
            errores.append(e)
    if errores:
        raise ExceptionGroup("lote con fallos", errores)

procesar("ACC-1", 200)
procesar("ACC-2", 100)
procesar("ACC-9", 10)
try:
    procesar("ACC-1", 0)                      # ValueError no se captura dentro
except ValueError as e:
    print(f"Propagado: {e}")

try:
    cobrar_lote([("ACC-1", 50), ("ACC-2", 999), ("ACC-1", -5)])
except* FondosInsuficientes as grupo:
    for e in grupo.exceptions:
        print("Fondos:", e, "|", e.__notes__[0])
except* ValueError as grupo:
    for e in grupo.exceptions:
        print("Validación:", e, "|", e.__notes__[0])
print("Saldo final ACC-1:", SALDOS["ACC-1"])

# Salida esperada:
# OK ACC-1: nuevo saldo 300
#   auditoría -> ACC-1 200
# [NSF] Rechazado: saldo 80 < 100
#   auditoría -> ACC-2 100
# [GW404] Error: cuenta ACC-9 desconocida (causa: KeyError('ACC-9'))
#   auditoría -> ACC-9 10
#   auditoría -> ACC-1 0
# Propagado: monto inválido: 0
# Fondos: saldo 80 < 999 | pago: ACC-2 por 999
# Validación: monto inválido: -5 | pago: ACC-1 por -5
# Saldo final ACC-1: 250

(Observa que `finally` imprime la auditoría ANTES de que el `ValueError`
llegue al `except` externo, y que el primer pago del lote sí se aplicó.)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- NUNCA `except:` VACÍO NI `except BaseException`: atrapan `KeyboardInterrupt`
  y `SystemExit`, impidiendo detener el proceso con Ctrl+C o un `sys.exit()`.
- NO TRAGUES ERRORES: `except Exception: pass` convierte un bug en datos
  corruptos silenciosos. Si lo ignoras a propósito, usa `suppress(Tipo)`
  con el tipo exacto y un comentario.
- `raise` SOLO (sin argumento) relanza conservando el traceback original;
  `raise e` añade una línea más y `raise OtraCosa` sin `from` confunde.
- ORDEN DE LOS `except`: del más específico al más general. Si pones
  `except ErrorPago` antes de `except FondosInsuficientes`, el segundo nunca
  se ejecuta.
- TRY MÍNIMO: envuelve solo la línea que puede fallar; usa `else` para el
  resto. Un `try` de 40 líneas captura errores que no esperabas.
- `return` DENTRO DE `finally` ANULA la excepción en curso (y desde 3.14
  emite `SyntaxWarning`). No lo hagas.
- `e` SE BORRA AL SALIR DEL `except` (evita ciclos de referencia con el
  traceback). Si la necesitas después, asígnala a otra variable.
- EXCEPCIONES PROPIAS PICKLEABLES: si tu `__init__` exige argumentos que no
  pasas a `super().__init__`, la excepción puede fallar al viajar entre
  procesos (`multiprocessing`, Celery). Pasa todo o da valores por defecto.
- MENSAJES ÚTILES SIN SECRETOS: incluye ids y valores relevantes, nunca
  contraseñas, tokens ni números de tarjeta completos.
- Usa `logging.exception()` en la frontera (worker, endpoint), no `print`,
  y registra cada error UNA vez (no en cada capa que lo relanza).

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Conversión segura: `leer_edad(texto: str) -> int` que capture `ValueError`,
   valide el rango 0–130 y relance un `ValueError` con un mensaje claro.
2. Divisiones del reporte: calcula el margen `ganancia / ventas` de una lista
   de sucursales usando `try/except/else/finally` y marca "N/A" cuando las
   ventas sean 0.
3. Jerarquía propia: crea `ErrorInventario` y sus subclases
   `ProductoNoExiste` y `StockInsuficiente(sku, pedido, disponible)`;
   captúralas en el orden correcto.

[Intermedio]
4. Traducción con causa: `obtener_tarifa(region)` que lea de un dict y
   convierta el `KeyError` en `TarifaNoConfigurada` con `raise ... from e`;
   imprime `__cause__` y `__context__` para comparar `from e` y `from None`.
5. Reintentos: `con_reintentos(funcion, intentos=3, errores=(TimeoutError,))`
   que reintente solo los errores transitorios, añada con `add_note` el número
   de intento y relance el último error si todos fallan.
6. Importador de CSV de empleados: valida cada fila, acumula los errores con
   el número de fila y, al final, lanza un `ExceptionGroup`; manéjalo con
   `except*` separando errores de formato y de reglas de negocio.
7. Recurso garantizado: simula una conexión con `abrir()`/`cerrar()` y
   demuestra con prints que `finally` cierra incluso si hay `return` o un
   error dentro del `try`; luego reescríbelo con `contextlib.contextmanager`.

[Senior / Producción]
8. Manejador global de API: diseña `ErrorAplicacion(mensaje, codigo_http,
   codigo_interno)` y una función `a_respuesta(error) -> dict` que mapee la
   jerarquía a respuestas JSON (422, 404, 409, 500), ocultando detalles
   internos en los 500 pero registrando el traceback con `logging.exception`.
9. Circuit breaker: clase `Interruptor(umbral_fallos, tiempo_reset)` que,
   tras N fallos seguidos, lance `CircuitoAbierto` sin llamar al servicio;
   pruébalo con `unittest` y `assertRaises`, inyectando el reloj.
10. Errores en paralelo: con `asyncio.TaskGroup` (3.11+) lanza 5 consultas
    simuladas donde 2 fallan; captura el `ExceptionGroup` con `except*`,
    verifica que las tareas restantes se cancelan y explica la diferencia con
    `asyncio.gather(..., return_exceptions=True)`.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
