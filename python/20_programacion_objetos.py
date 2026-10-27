r"""
============================================================================
TEMA 20: PROGRAMACIÓN ORIENTADA A OBJETOS, `@PROPERTY`, DUNDERS Y `DATACLASSES`
============================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: `__dict__`, descriptores y slots)
----------------------------------------------------------------------------
1) **Cómo vive un objeto en CPython**: por defecto, cada instancia guarda sus
   atributos en un diccionario interno `obj.__dict__`, y `type(obj)` apunta a la
   clase donde viven los métodos. Cuando llamas `cuenta.depositar(100)`, Python
   busca `depositar` en la clase y la convierte automáticamente en un *bound
   method* pasando la instancia como primer argumento `self`.
2) **Atributos de clase vs atributos de instancia**:
   - Un atributo definido en el cuerpo de `class` vive en `Clase.__dict__` y es
     compartido por todas las instancias.
   - Un atributo asignado a `self.x = ...` dentro de `__init__` vive en el
     `__dict__` propio de esa instancia.
   - **Peligro clásico**: si defines `etiquetas = []` en el cuerpo de la clase y
     haces `self.etiquetas.append("vip")`, estás mutando la misma lista para
     TODOS los objetos de esa clase.
3) **Encapsulación pythónica con `@property`**: en Python no se escriben
   `get_saldo()` y `set_saldo()` al estilo Java. Empiezas con un atributo público
   `self.saldo` y, cuando necesitas proteger un invariante o calcularlo al vuelo,
   lo conviertes en `@property` sin cambiar el código de quienes usan la clase.
4) **Modelo de datos de Python (métodos *dunder* `__xxx__`)**: implementar
   `__repr__`, `__eq__`, `__lt__`, `__len__` o `__enter__`/`__exit__` hace que
   tus objetos se comporten como tipos nativos del lenguaje.
5) **`@dataclass` y `__slots__`**:
   - `@dataclass(frozen=True, slots=True)` genera `__init__`, `__repr__`,
     `__eq__` y `__hash__` automáticamente sin código repetitivo.
   - `__slots__` reemplaza el `__dict__` por un arreglo fijo de punteros en C,
     ahorrando entre 40 % y 60 % de memoria RAM cuando creas millones de
     instancias e impidiendo agregar atributos por error tipográfico.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
----------------------------------------------------------------------------
- Entidades de dominio con invariantes de negocio (`CuentaBancaria`, `Pedido`,
  `Suscripcion`) donde el estado nunca puede quedar inválido.
- Objetos de valor inmutables (`Dinero`, `RangoFechas`, `Coordenada`) con
  `@dataclass(frozen=True, slots=True)`.
- Constructores alternativos expresivos con `@classmethod` (`Pedido.desde_json()`,
  `RangoFechas.mes_actual()`).
- Gestión automática de recursos (conexiones, transacciones, bloqueos) mediante
  el protocolo de *Context Manager* (`__enter__` y `__exit__`).

3. SINTAXIS Y REFERENCIA RÁPIDA
----------------------------------------------------------------------------
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Self

# 1. Dataclass inmutable, con slots y valor por defecto seguro (default_factory)
@dataclass(frozen=True, slots=True, order=True)
class Precio:
    monto: Decimal
    moneda: str = "USD"
    impuestos_incluidos: tuple[str, ...] = field(default_factory=tuple, compare=False)

    def __post_init__(self) -> None:
        if self.monto < Decimal("0"):
            raise ValueError("El monto no puede ser negativo")

# 2. Clase con invariantes protegidos, @property, @classmethod y dunder methods
class Cuenta:
    __slots__ = ("_titular", "_saldo")             # sin __dict__, menor uso de RAM

    def __init__(self, titular: str, saldo_inicial: int = 0) -> None:
        self._titular = titular.strip()
        self._saldo = 0
        self.depositar(saldo_inicial)

    @property
    def saldo(self) -> int:                        # lectura: cuenta.saldo
        return self._saldo

    def depositar(self, monto: int) -> None:
        if monto < 0:
            raise ValueError("El depósito debe ser no negativo")
        self._saldo += monto

    @classmethod
    def desde_diccionario(cls, datos: dict[str, object]) -> Self:
        return cls(str(datos["titular"]), int(str(datos.get("saldo", 0))))

    def __repr__(self) -> str:                     # representación para depuración
        return f"Cuenta(titular={self._titular!r}, saldo={self._saldo})"

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
----------------------------------------------------------------------------
Escenario: Modelamos las líneas de un pedido con `@dataclass(frozen=True, slots=True)`
y la entidad `CarritoCompra` protegiendo sus invariantes de dominio (no devuelve
su lista interna mutable sino una tupla de solo lectura en `@property`) e
implementando `__len__`, `__iter__` y `__repr__`.

from collections.abc import Iterator
from dataclasses import dataclass

@dataclass(frozen=True, slots=True)
class LineaPedido:
    sku: str
    cantidad: int
    precio_unitario: int

    def __post_init__(self) -> None:
        if not self.sku.strip():
            raise ValueError("El SKU no puede estar vacío")
        if self.cantidad <= 0 or self.precio_unitario < 0:
            raise ValueError("Cantidad debe ser > 0 y precio >= 0")

    @property
    def subtotal(self) -> int:
        return self.cantidad * self.precio_unitario

class CarritoCompra:
    def __init__(self, cliente_id: str) -> None:
        self.cliente_id = cliente_id
        self._lineas: dict[str, LineaPedido] = {}

    def agregar(self, sku: str, cantidad: int, precio_unitario: int) -> None:
        anterior = self._lineas.get(sku)
        nueva_cant = (anterior.cantidad + cantidad) if anterior else cantidad
        self._lineas[sku] = LineaPedido(sku, nueva_cant, precio_unitario)

    @property
    def lineas(self) -> tuple[LineaPedido, ...]:
        # Devuelve tupla inmutable: nadie fuera puede mutar self._lineas
        return tuple(self._lineas.values())

    @property
    def total(self) -> int:
        return sum(linea.subtotal for linea in self._lineas.values())

    def __len__(self) -> int:
        return sum(linea.cantidad for linea in self._lineas.values())

    def __iter__(self) -> Iterator[LineaPedido]:
        return iter(self._lineas.values())

    def __repr__(self) -> str:
        return f"CarritoCompra(cliente_id={self.cliente_id!r}, items={len(self)}, total={self.total})"

carrito = CarritoCompra("CLI-900")
carrito.agregar("TEC-01", 2, 150_000)
carrito.agregar("MOU-02", 1, 80_000)
carrito.agregar("TEC-01", 1, 150_000)              # acumula 3 teclados
print(repr(carrito))
for linea in carrito:
    print(f" - {linea.sku}: {linea.cantidad} x ${linea.precio_unitario:,} = ${linea.subtotal:,}")

# Salida esperada:
# CarritoCompra(cliente_id='CLI-900', items=4, total=530000)
#  - TEC-01: 3 x $150,000 = $450,000
#  - MOU-02: 1 x $80,000 = $80,000

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
----------------------------------------------------------------------------
- NUNCA EXPONGAS COLECCIONES MUTABLES INTERNAS DIRECTAMENTE: si `carrito.lineas`
  devuelve la `list` interna `self._lineas`, cualquier llamador puede hacer
  `carrito.lineas.clear()` o meter una línea inválida saltándose tus reglas.
  Devuelve una `tuple` o una copia.
- ATRIBUTOS DE CLASE MUTABLES: en una clase normal pon las listas/dicts dentro
  de `self.items = []` en `__init__`; en una `@dataclass` usa siempre
  `items: list[str] = field(default_factory=list)` (de hecho, `@dataclass` lanza
  `ValueError: mutable default <class 'list'> is not allowed` si pones `= []`).
- `__repr__` vs `__str__`: `__repr__` es para desarrolladores y logs (debe ser
  inequívoco, idealmente `Clase(campo=valor!r)`); `__str__` es para el usuario
  final. Si solo defines `__repr__`, Python lo usa también como respaldo de `__str__`.
- NO HAGAS TRABAJO PESADO (RED, ARCHIVOS, SQL) EN `@property`: quien lee
  `pedido.total` espera un acceso rápido como un atributo. Si la operación hace
  I/O o tarda mucho, debe ser un método con verbo (`calcular_impuestos_externos()`).
- EN `__eq__`, DEVUELVE `NotImplemented` (no `False`) SI EL OTRO TIPO NO ES
  COMPATIBLE: `if not isinstance(other, MiClase): return NotImplemented`. Así
  Python puede intentar la comparación reflejada en el otro operando.

6. EJERCICIOS PROGRESIVOS (10 Retos)
----------------------------------------------------------------------------
[Básico]
1. Entidad con invariantes y `@property`: crea `Termostato(temperatura_c)` con
   propiedades `temperatura_c` (con *setter* que impida bajar de `-50` o subir
   de `100` lanzando `ValueError`) y `temperatura_f` (calculada al vuelo).
2. Constructores con `@classmethod`: implementa `FechaFiscal(anio, trimestre)`
   con los constructores alternativos `FechaFiscal.desde_cadena("2026-Q3")` y
   `FechaFiscal.desde_mes(2026, 8)`.
3. Dataclass inmutable: modela `@dataclass(frozen=True, slots=True)` `Coordenada`
   con método `distancia_a(otra: Coordenada) -> float` y verifica que puede
   usarse en un `set`.

[Intermedio]
4. Operadores aritméticos y comparación (*dunder methods*): implementa una clase
   inmutable `Vector2D(x, y)` con `__add__`, `__sub__`, `__mul__` (escalar),
   `__abs__` (magnitud con `math.hypot`) y `__repr__`.
5. Contenedor personalizado: crea una clase `ColaPrioridadTareas` que implemente
   `__len__`, `__bool__`, `__contains__` (`in`) e `__iter__` para que funcione
   naturalmente con `len(cola)`, `if cola:` y `for tarea in cola:`.
6. Context manager de clase (`__enter__` / `__exit__`): implementa `Cronometro(
   etiqueta: str)` que mida con `time.perf_counter()` cuánto tarda el bloque
   `with`, guarde el tiempo en `crono.duracion_ms` y no suprima las excepciones
   (`__exit__` devuelve `False`).
7. Comparación de memoria `__dict__` vs `__slots__`: crea dos clases idénticas
   `PuntoConDict` y `PuntoConSlots`, instancia 100 000 objetos de cada una
   midiendo el consumo total de memoria con `tracemalloc` e imprime el ahorro.

[Senior / Producción]
8. Descriptor reutilizable (`__get__`, `__set__`, `__set_name__`): escribe un
   descriptor `EnteroEnRango(minimo: int, maximo: int)` y úsalo en una clase
   `ConfiguracionServidor` para validar automáticamente `puerto` (`1..65535`) y
   `workers` (`1..64`) sin repetir lógica en múltiples `@property`.
9. Objeto de valor `Dinero` de grado bancario: diseña `@dataclass(frozen=True,
   slots=True)` `Dinero(centavos: int, moneda: str)` que valide el código ISO de
   moneda en `__post_init__`, implemente `__add__`, `__sub__` (lanzando error si
   las monedas difieren), `repartir(partes: int) -> list[Dinero]` y un
   constructor `Dinero.desde_decimal("19.99", "USD")`.
10. Transacción en memoria con rollback (`__enter__` / `__exit__`): implementa
    `TransaccionEstado(estado: dict[str, object])` que tome una instantánea
    profunda al entrar al `with` y, si ocurre cualquier excepción dentro del
    bloque, restaure automáticamente el diccionario original antes de propagar
    el error.
"""

# Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
