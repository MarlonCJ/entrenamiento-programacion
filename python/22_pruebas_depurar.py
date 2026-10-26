r"""
============================================================================
TEMA 22: PRUEBAS AUTOMATIZADAS (UNITTEST, PYTEST, MOCK) Y DEPURACIÓN
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: aserciones, dobles y trazas)
----------------------------------------------------------------------------
1) **Una prueba es código que ejecuta tu código y verifica un resultado**. Si
   la verificación falla, se lanza `AssertionError` y el *runner* lo reporta.
   Python trae `unittest` (estilo xUnit, clases `TestCase`) y `doctest` en la
   biblioteca estándar; el estándar de facto en la industria es `pytest`
   (externo), que usa el `assert` normal y lo reescribe al importar el módulo
   de pruebas para mostrar los valores exactos que no coincidieron.
2) **`assert` es una sentencia, no una función**: `assert condicion, mensaje`.
   Con `python -O` TODAS las sentencias `assert` se eliminan del bytecode.
   Por eso sirven para pruebas e invariantes internas, NUNCA para validar
   entradas de usuario en producción.
3) **Patrón AAA**: *Arrange* (preparar datos y dobles), *Act* (ejecutar UNA
   acción), *Assert* (verificar). Una prueba = un comportamiento.
4) **Dobles de prueba (`unittest.mock`)**: `Mock`/`MagicMock` aceptan
   cualquier llamada y la REGISTRAN (`.call_args`, `.call_count`);
   `patch("modulo.nombre")` reemplaza temporalmente un objeto donde SE USA.
   `create_autospec`/`autospec=True` copian la firma real y fallan si llamas
   con argumentos o métodos inexistentes.
5) **Depuración**: una excepción no capturada imprime el *traceback* (la pila
   de llamadas, de la más externa a la más interna; la última línea es la
   causa). `breakpoint()` (3.7+) abre `pdb`: `n` (siguiente), `s` (entrar),
   `c` (continuar), `p expr`, `pp`, `w` (dónde estoy), `l` (listar).
   Desde 3.11 los tracebacks señalan con `^^^^` la subexpresión exacta y
   `add_note()` permite añadir contexto a una excepción.
6) **Depuración científica**: reproducir el bug con una prueba que FALLE ->
   formular hipótesis -> inspeccionar -> corregir la causa raíz -> la prueba
   queda como protección contra regresiones.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Reglas de negocio críticas: cálculos de copagos, impuestos, intereses o
  nómina, donde un error de redondeo cuesta dinero o demandas.
- Integración continua (GitHub Actions/GitLab CI): `pytest --cov` en cada
  *pull request*; el merge se bloquea si algo falla.
- Aislar servicios externos (pasarelas de pago, correo, APIs de terceros) con
  mocks o *fakes* para que la suite sea rápida y determinista.
- Casos frontera: `0`, negativos, listas vacías, `None`, Unicode, límites
  exactos de tramos (100 % de cobertura, saldo justo igual al monto).
- Diagnóstico en producción: `logging` con niveles, `traceback.format_exc()`,
  `faulthandler` para cuelgues y `tracemalloc` para fugas de memoria.

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
import unittest
from unittest.mock import Mock, patch

class PruebasDescuento(unittest.TestCase):
    def setUp(self) -> None:                     # antes de CADA prueba
        self.carrito = Carrito()

    def test_descuento_vip(self) -> None:
        self.assertEqual(aplicar_descuento(100, "VIP"), 80)
        self.assertAlmostEqual(0.1 + 0.2, 0.3)   # floats: nunca assertEqual
        with self.assertRaises(ValueError):
            aplicar_descuento(-5, "VIP")

    @patch("tienda.servicios.enviar_correo")     # donde se USA, no donde se define
    def test_confirmacion(self, enviar_falso: Mock) -> None:
        confirmar_pedido(42)
        enviar_falso.assert_called_once_with(42)

    def test_casos(self) -> None:                # parametrizar sin pytest
        for entrada, esperado in [(0, 0), (99, 99), (100, 90)]:
            with self.subTest(entrada=entrada):
                self.assertEqual(precio_final(entrada), esperado)

# Equivalente en pytest (archivo test_descuentos.py):
# import pytest
# @pytest.mark.parametrize("monto, esperado", [(0, 0), (100, 90)])
# def test_precio_final(monto, esperado):
#     assert precio_final(monto) == esperado
# def test_negativo():
#     with pytest.raises(ValueError, match="negativo"):
#         precio_final(-1)

# Ejecutar:  python -m unittest -v        |  pytest -q -x --lf
# Depurar:   breakpoint()  |  python -m pdb script.py  |  PYTHONBREAKPOINT=0

def suma(a: int, b: int) -> int:
    '''
    >>> suma(2, 3)
    5
    '''
    return a + b                                 # python -m doctest modulo.py

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Una clínica calcula el copago de un paciente según el porcentaje
de cobertura de su seguro y le notifica por SMS. Probamos el cálculo, los
casos frontera y la interacción con el notificador usando un `Mock`.

import io
import unittest
from decimal import Decimal, ROUND_HALF_UP
from unittest.mock import Mock

def calcular_copago(costo: Decimal, cobertura: int) -> Decimal:
    if not 0 <= cobertura <= 100:
        raise ValueError(f"cobertura fuera de rango: {cobertura}")
    copago = costo * (100 - cobertura) / 100
    return copago.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

class ServicioFacturacion:
    def __init__(self, notificador) -> None:
        self.notificador = notificador           # dependencia inyectada

    def facturar(self, paciente: str, costo: Decimal, cobertura: int) -> Decimal:
        copago = calcular_copago(costo, cobertura)
        if copago > 0:
            self.notificador.enviar(paciente, f"Copago: {copago}")
        return copago

class PruebasCopago(unittest.TestCase):
    def test_cobertura_parcial(self) -> None:
        self.assertEqual(calcular_copago(Decimal("150000"), 80), Decimal("30000.00"))

    def test_cobertura_total_no_notifica(self) -> None:
        notificador = Mock()                                    # Arrange
        servicio = ServicioFacturacion(notificador)
        copago = servicio.facturar("ana", Decimal("90000"), 100)  # Act
        self.assertEqual(copago, Decimal("0.00"))               # Assert
        notificador.enviar.assert_not_called()

    def test_notifica_copago(self) -> None:
        notificador = Mock()
        ServicioFacturacion(notificador).facturar("luis", Decimal("10000.50"), 70)
        notificador.enviar.assert_called_once_with("luis", "Copago: 3000.15")

    def test_rechaza_cobertura_invalida(self) -> None:
        with self.assertRaisesRegex(ValueError, "fuera de rango"):
            calcular_copago(Decimal("1000"), 120)

suite = unittest.TestLoader().loadTestsFromTestCase(PruebasCopago)
print([prueba.id().split(".")[-1] for prueba in suite])
salida = io.StringIO()                           # silencia el reporte con tiempos
resultado = unittest.TextTestRunner(stream=salida).run(suite)
print(f"Ejecutadas: {resultado.testsRun}, fallos: {len(resultado.failures)}, "
      f"errores: {len(resultado.errors)}")
print("OK" if resultado.wasSuccessful() else "FALLÓ")

# Salida esperada:
# ['test_cobertura_parcial', 'test_cobertura_total_no_notifica', 'test_notifica_copago', 'test_rechaza_cobertura_invalida']
# Ejecutadas: 4, fallos: 0, errores: 0
# OK

(El `TestLoader` ordena las pruebas alfabéticamente. Usamos `Decimal` porque
con `float` los centavos se redondean mal: `round(2.675, 2)` devuelve 2.67.)

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- `assert (condicion, "mensaje")` CON PARÉNTESIS SIEMPRE PASA: es una tupla
  no vacía y por tanto verdadera (Python emite `SyntaxWarning`).
- PARCHEAR EN EL LUGAR EQUIVOCADO: si `facturas.py` hace
  `from correo import enviar`, debes parchear `"facturas.enviar"`, no
  `"correo.enviar"`: el nombre ya fue copiado al módulo que lo usa.
- MOCKS DEMASIADO PERMISIVOS: `Mock()` acepta `notificador.envair(...)` (con
  errata) sin quejarse. Usa `create_autospec(Clase)` o `spec=Clase`.
- NO SIMULES LO QUE ES TUYO Y BARATO: mockea fronteras (red, disco, reloj,
  aleatoriedad), no tus propias funciones puras; demasiados mocks hacen que
  la prueba verifique la implementación en lugar del comportamiento.
- PRUEBAS NO DETERMINISTAS ("flaky"): inyecta el reloj (`ahora=datetime.now`)
  y la semilla (`random.Random(42)`) en lugar de llamarlos directamente.
- CADA PRUEBA DEBE SER INDEPENDIENTE: nada de estado global compartido ni
  depender del orden; usa `setUp`/fixtures y `tmp_path` para archivos.
- FLOATS: compara con `assertAlmostEqual`, `math.isclose` o `pytest.approx`.
- `print` PARA DEPURAR ES TEMPORAL: en código real usa `logging` con
  `logger = logging.getLogger(__name__)`; y nunca subas un `breakpoint()`
  (bloquea el proceso en CI; Ruff tiene la regla T100 para detectarlo).
- `except Exception: pass` OCULTA BUGS: si debes capturar, registra con
  `logger.exception(...)`, que incluye el traceback completo.
- COBERTURA 100 % NO ES CALIDAD: mide líneas ejecutadas, no aserciones útiles.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Primeras pruebas: implementa `validar_rut(rut: str) -> bool` (o el
   documento de identidad de tu país) y escribe un `TestCase` con casos
   válido, dígito verificador incorrecto, cadena vacía y espacios.
2. Cazador de bugs #1: `promedio(notas)` lanza `ZeroDivisionError` con una
   lista vacía. Escribe primero la prueba que lo reproduce, luego decide el
   contrato (`ValueError` o `None`) y corrígelo.
3. Doctest: documenta `formatear_moneda(valor)` con tres ejemplos `>>>` en su
   docstring y ejecútalos con `python -m doctest -v`.

[Intermedio]
4. Cazador de bugs #2 (argumento mutable): `agregar_item(item, carrito=[])`
   acumula productos entre llamadas. Escribe la prueba que lo demuestra y
   corrige la función con `None` como centinela.
5. Pruebas parametrizadas: valida `clasificar_imc(peso, estatura)` con
   `subTest` sobre 8 casos, incluyendo los límites exactos 18.5, 25 y 30.
6. Mock con `patch`: `obtener_tasa_cambio()` llama a una API con
   `urllib.request.urlopen`; prueba `convertir(monto, "USD")` sin red,
   simulando una respuesta correcta y otra que lanza `TimeoutError`.
7. Depuración con pdb: inserta `breakpoint()` en una función de cálculo de
   intereses compuestos con un error de precedencia; documenta qué comandos
   (`p`, `n`, `s`, `w`) usaste para encontrarlo y deja la prueba de regresión.

[Senior / Producción]
8. Reloj inyectable: refactoriza `token_expirado(token)` que usa
   `datetime.now(UTC)` para recibir `ahora: Callable[[], datetime]`, y pruébalo
   con un reloj fijo en el segundo exacto de expiración.
9. Fake repository: crea `RepositorioCuentasEnMemoria` (con `dict`) que
   cumpla el mismo `Protocol` que el repositorio real y prueba de extremo a
   extremo `ServicioTransferencias` (éxito, cuenta inexistente, fondos
   insuficientes y atomicidad: si falla el abono, no queda el cargo).
10. Mini runner: construye `SuitePruebas` con un decorador `@prueba` que
    registre funciones, las ejecute aisladas en `try/except`, mida cada una
    con `time.perf_counter()`, capture el traceback de las fallidas con
    `traceback.format_exc()` y devuelva un resumen; pruébalo con pytest.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
