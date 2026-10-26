<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 20: PROGRAMACIÓN ORIENTADA A OBJETOS (CONSTRUCTOR PROMOTION Y READONLY)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de POO en PHP 8.x)
 * ----------------------------------------------------------------------------
 * PHP 8 transformó por completo la ergonomía y seguridad de la Programación
 * Orientada a Objetos con tres características de nivel empresarial:
 *
 * 1) **Constructor Property Promotion (Promoción de Propiedades en el Constructor, PHP 8.0+)**:
 *    En lugar de declarar las propiedades arriba, repetirlas en los parámetros
 *    del constructor y volverlas a escribir en `$this->prop = $prop;` (3 veces
 *    cada campo!), basta con agregar la visibilidad (`private`, `protected`,
 *    `public`) directamente en el parámetro del `__construct`:
 *    `public function __construct(private readonly string $sku, private int $stock) {}`
 * 2) **Propiedades `readonly` (PHP 8.1) y Clases `readonly class` (PHP 8.2)**:
 *    Una propiedad `readonly` solo puede asignarse **una vez** (en el constructor)
 *    y jamás puede mutarse después, permitiendo exponerla como `public readonly`
 *    sin miedo a que alguien la modifique desde afuera. Si declaras toda la
 *    clase como `readonly class Dinero`, todas sus propiedades son inmutables
 *    automáticamente (ideal para *Value Objects* y DTOs).
 * 3) **Protección de Invariantes de Dominio**:
 *    Una clase profesional valida sus reglas en el `__construct` (Fail-Fast) y
 *    modifica su estado solo mediante métodos de negocio con significado
 *    (`depositar()`, `confirmarPago()`), nunca con setters vacíos sin control.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Objetos de Valor Inmutables (*Value Objects* con `readonly class`): `Dinero`,
 *   `Email`, `RangoFechas`, `DireccionEnvio`, donde cualquier operación devuelve
 *   una nueva instancia.
 * - Entidades de Dominio Encapsuladas: `Pedido`, `CuentaBancaria`, `Suscripcion`,
 *   protegiendo el estado interno con propiedades `private` y métodos de dominio.
 * - DTOs de Entrada/Salida (Data Transfer Objects): Transportar datos tipados
 *   entre el controlador HTTP y la capa de servicio.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Value Object Inmutable con readonly class + Constructor Promotion (PHP 8.2+):
 * readonly class Dinero {
 *     public function __construct(
 *         public int $centavos,
 *         public string $moneda = 'USD',
 *     ) {
 *         if ($this->centavos < 0) {
 *             throw new InvalidArgumentException("El monto no puede ser negativo");
 *         }
 *     }
 *
 *     public function sumar(self $otro): self {
 *         if ($this->moneda !== $otro->moneda) {
 *             throw new DomainException("No se pueden sumar monedas distintas");
 *         }
 *         return new self($this->centavos + $otro->centavos, $this->moneda);
 *     }
 * }
 *
 * // 2. Entidad con estado controlado e interfaz Stringable (PHP 8.0+):
 * final class CuentaBancaria implements Stringable {
 *     public function __construct(
 *         public readonly string $numero,
 *         private int $saldoCentavos = 0,
 *     ) {}
 *
 *     public function depositar(int $centavos): void {
 *         if ($centavos <= 0) throw new InvalidArgumentException("Depósito inválido");
 *         $this->saldoCentavos += $centavos;
 *     }
 *
 *     public function obtenerSaldoCentavos(): int { return $this->saldoCentavos; }
 *
 *     public function __toString(): string {
 *         return sprintf("Cuenta[%s]: $%.2f", $this->numero, $this->saldoCentavos / 100);
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Modelar un producto de inventario usando Constructor Property
 * Promotion, propiedades `readonly` para su identidad y métodos expresivos para
 * descontar existencias validando invariantes.
 *
 * final class ProductoInventario {
 *     public function __construct(
 *         public readonly string $sku,
 *         public readonly string $nombre,
 *         private int $existencias,
 *     ) {
 *         if (trim($this->sku) === '') {
 *             throw new InvalidArgumentException("El SKU no puede estar vacío");
 *         }
 *         if ($this->existencias < 0) {
 *             throw new InvalidArgumentException("Las existencias iniciales no pueden ser negativas");
 *         }
 *     }
 *
 *     public function reservarUnidades(int $cantidad): void {
 *         if ($cantidad <= 0) {
 *             throw new InvalidArgumentException("La cantidad a reservar debe ser positiva");
 *         }
 *         if ($cantidad > $this->existencias) {
 *             throw new DomainException("Stock insuficiente para {$this->sku}");
 *         }
 *         $this->existencias -= $cantidad;
 *     }
 *
 *     public function existenciasDisponibles(): int {
 *         return $this->existencias;
 *     }
 * }
 *
 * $item = new ProductoInventario(sku: 'SSD-1TB', nombre: 'Disco NVMe 1TB', existencias: 10);
 * $item->reservarUnidades(3);
 * echo "{$item->sku} ({$item->nombre}) -> Disponibles: {$item->existenciasDisponibles()}" . PHP_EOL;
 * // Salida esperada:
 * // SSD-1TB (Disco NVMe 1TB) -> Disponibles: 7
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - USA `final class` POR DEFECTO EN ENTIDADES Y SERVICIOS CONCRETOS:
 *   Evita cadenas frágiles de herencia y fomenta la composición.
 * - SIEMPRE DECLARA EL TIPO EN TODAS LAS PROPIEDADES DE CLASE:
 *   Nunca escribas `private $nombre;` sin tipo; escribe `private string $nombre;`.
 * - CUIDADO CON LA CLONACIÓN SUPERFICIAL (`clone $obj`):
 *   Si una clase tiene como propiedad otro objeto mutable (ej. `DateTime`),
 *   hacer `clone $pedido` copia la referencia al mismo `DateTime`. Por eso en
 *   PHP moderno usamos siempre **`DateTimeImmutable`** en lugar de `DateTime`!
 * - EVITA LOS MÉTODOS MÁGICOS `__get` Y `__set` EN MODELOS DE DOMINIO:
 *   Ocultan las propiedades reales al IDE y al analizador estático, y son más
 *   lentos que las propiedades tipadas nativas.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Promoción de propiedades en el constructor: Crea una clase `Curso` con
 *    `public readonly string $codigo`, `public readonly string $titulo` y
 *    `private int $cuposDisponibles`, validando en el constructor que los cupos
 *    sean `>= 0`.
 * 2. Implementación de `Stringable` (`__toString`): Haz que la clase `Curso`
 *    implemente `Stringable` para que al hacer `echo $curso` muestre un resumen
 *    formateado.
 * 3. Métodos de comportamiento sin setters: Agrega a `Curso` los métodos
 *    `inscribirEstudiante(): void` (resta 1 cupo o lanza `DomainException` si
 *    está lleno) y `liberarCupo(): void`.
 *
 * [Intermedio]
 * 4. *Value Object* Inmutable `Email`: Crea una clase `readonly` llamada `Email`
 *    que normalice el correo (`strtolower(trim(...))`), lo valide en su
 *    constructor con `FILTER_VALIDATE_EMAIL` y ofrezca métodos `dominio(): string`
 *    y `esIgualA(self $otro): bool`.
 * 5. *Value Object* `RangoFechas` con `DateTimeImmutable`: Crea una clase que
 *    reciba `DateTimeImmutable $inicio` y `DateTimeImmutable $fin`, valide que
 *    `$fin >= $inicio` y calcule la duración en días y si una fecha dada cae
 *    dentro del rango.
 * 6. Constructores Estáticos con Nombre (*Named Constructors*): Crea una clase
 *    `Descuento` con constructor `private` y dos métodos de fábrica públicos:
 *    `Descuento::porPorcentaje(float $pct)` y `Descuento::porMontoFijo(int $centavos)`.
 * 7. Encapsulación de colección hija: Crea una clase `Factura` que mantenga un
 *    arreglo privado `private array $lineas = []`, permita agregar objetos
 *    `LineaFactura` y calcule el total dinámicamente.
 *
 * [Senior / Producción]
 * 8. Inmutabilidad con evolución de estado (`with*` / `clone`): Crea un DTO o
 *    configuración inmutable `SolicitudHttp` con métodos `conCabecera(string $k, string $v): self`
 *    y `conTimeout(int $segundos): self` que devuelvan una nueva instancia sin
 *    mutar la original (estilo PSR-7 MessageInterface).
 * 9. Máquina de Estados en la Entidad (`Suscripcion`): Modela una suscripción
 *    con un `enum EstadoSuscripcion` (`Prueba`, `Activa`, `Pausada`, `Cancelada`)
 *    y métodos `activar()`, `pausar()`, `cancelar()`, lanzando `DomainException`
 *    si se intenta reactivar una suscripción ya `Cancelada`.
 * 10. Patrón *Builder* Fluido para Objetos Complejos: Implementa un
 *     `ReporteFinancieroBuilder` con métodos encadenables (`->paraPeriodo(...)`,
 *     `->enMoneda(...)`, `->incluirImpuestos()`, `->build(): ReporteFinanciero`).
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
