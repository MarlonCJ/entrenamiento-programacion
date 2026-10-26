<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 21: HERENCIA, INTERFACES, TRAITS, POLIMORFISMO Y COMPOSICIÓN
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Polimorfismo en PHP 8.x)
 * ----------------------------------------------------------------------------
 * El polimorfismo permite que un servicio de negocio interactúe con un contrato
 * abstracto (`interface`) sin acoplarse a cómo está implementada cada variante.
 *
 * Las 4 Herramientas de Reutilización y Polimorfismo en PHP:
 * 1) **Interfaces (`interface` + `implements`)**:
 *    Definen un contrato 100% abstracto de métodos públicos. Una clase puede
 *    implementar múltiples interfaces (`implements PasarelaPago, Auditable`).
 * 2) **Clases Abstractas (`abstract class` + `extends`)**:
 *    Proveen estado compartido y métodos plantilla parciales (`abstract protected function ...`).
 *    PHP solo permite herencia simple de clases.
 * 3) **Traits (`trait` + `use MiTrait;`)**:
 *    Mecanismo de reutilización horizontal de código ("copiar y pegar asistido
 *    por el compilador") para compartir métodos entre clases que no comparten
 *    jerarquía de herencia.
 *    ¡Importante!: Un `trait` NO es un tipo (no puedes hacer `function f(MiTrait $x)`).
 *    Si necesitas un contrato de tipo, crea una `interface` y usa el `trait` solo
 *    para ayudar a implementarla.
 * 4) **Late Static Binding (`static::` vs `self::`)**:
 *    En una clase padre, `self::` siempre apunta a la clase donde fue escrito el
 *    código, mientras que `static::` resuelve en tiempo de ejecución la subclase
 *    real que fue invocada.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Contratos de Infraestructura (Interfaces): `NotificadorInterface` con
 *   implementaciones `NotificadorEmail`, `NotificadorSlack`, `NotificadorFalsoTest`.
 * - Plantillas de Procesamiento (`abstract class` - Patrón *Template Method*):
 *   Un exportador base que define los pasos fijos y delega el formato a subclases.
 * - Composición sobre Herencia: Inyectar colaboradores por constructor en lugar
 *   de crear jerarquías profundas de `extends`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Interface (Contrato puro):
 * interface PasarelaPagoInterface {
 *     public function cobrar(int $centavos, string $moneda): string;
 * }
 *
 * // 2. Implementación polimórfica marcando #[\Override] (PHP 8.3+):
 * final class StripePasarela implements PasarelaPagoInterface {
 *     public function cobrar(int $centavos, string $moneda): string {
 *         return "STRIPE_OK_{$centavos}_{$moneda}";
 *     }
 * }
 *
 * // 3. Trait para reutilización horizontal de comportamiento:
 * trait TieneMarcasDeTiempo {
 *     private ?string $creadoEn = null;
 *     public function marcarCreacion(string $isoFecha): void {
 *         $this->creadoEn = $isoFecha;
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un despachador de alertas empresariales envía un mensaje crítico a
 * través de todos los canales configurados de forma polimórfica sin usar un
 * solo `if` o `switch` por tipo de canal.
 *
 * interface CanalAlertaInterface {
 *     public function enviar(string $mensaje): string;
 * }
 *
 * final class AlertaEmail implements CanalAlertaInterface {
 *     public function __construct(private readonly string $correoDestino) {}
 *     public function enviar(string $mensaje): string {
 *         return "[EMAIL -> {$this->correoDestino}] {$mensaje}";
 *     }
 * }
 *
 * final class AlertaWebhook implements CanalAlertaInterface {
 *     public function __construct(private readonly string $url) {}
 *     public function enviar(string $mensaje): string {
 *         return "[WEBHOOK -> {$this->url}] {$mensaje}";
 *     }
 * }
 *
 * /** @param list<CanalAlertaInterface> $canales *\/
 * function difundirIncidente(array $canales, string $incidente): void {
 *     foreach ($canales as $canal) {
 *         echo $canal->enviar($incidente) . PHP_EOL;
 *     }
 * }
 *
 * difundirIncidente([
 *     new AlertaEmail('sre@empresa.com'),
 *     new AlertaWebhook('https://hooks.empresa.com/alertas'),
 * ], 'CPU al 95% en nodo principal');
 * // Salida esperada:
 * // [EMAIL -> sre@empresa.com] CPU al 95% en nodo principal
 * // [WEBHOOK -> https://hooks.empresa.com/alertas] CPU al 95% en nodo principal
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - PREFIERE LA COMPOSICIÓN SOBRE LA HERENCIA: Antes de escribir `class B extends A`,
 *   pregúntate si `B` realmente cumple el Principio de Sustitución de Liskov (LSP)
 *   o si es mucho más flexible pasar `A` (o una interfaz) en el constructor de `B`.
 * - NO ABUSES DE LOS `trait`: Un `trait` que accede a propiedades mágicas que
 *   asume que existen en la clase huésped crea un acoplamiento oculto y frágil.
 *   Si un `trait` necesita algo de la clase que lo usa, debe declararlo como un
 *   método abstracto dentro del trait (`abstract protected function obtenerId(): string;`).
 * - EN PHP 8.3+, USA EL ATRIBUTO `#[\Override]` EN MÉTODOS HEREDADOS: Le indica
 *   al motor que valide que el método existe en la clase padre o interfaz.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Contrato de Cálculo de Envío (`CalculadoraEnvioInterface`): Crea la interfaz
 *    y tres implementaciones (`EnvioLocal`, `EnvioNacional`, `EnvioInternacional`)
 *    y recórrelas polimórficamente para cotizar un paquete de `5 kg`.
 * 2. Clase abstracta con `parent::__construct`: Crea `EmpleadoBase` (abstracta)
 *    con `$nombre` y `$salarioBase`, y las subclases `Desarrollador` y `Vendedor`
 *    que implementen `abstract public function calcularCompensacionTotal(): float`.
 * 3. Creación y uso de un `trait`: Crea el trait `AuditableTrait` que agregue
 *    un historial de acciones en memoria (`registrarAccion(string)`, `obtenerHistorial(): array`)
 *    y úsalo en dos clases distintas.
 *
 * [Intermedio]
 * 4. Patrón *Template Method* con `final public function`: Crea una clase
 *    abstracta `ImportadorDatos` con un método `final public function ejecutar(string $origen): array`
 *    que llame en orden a `validar()`, `parsear()` y `transformar()`, dejando
 *    `parsear()` abstracto para `ImportadorJson` e `ImportadorCsv`.
 * 5. Diferencia entre `self::` y `static::` (*Late Static Binding*): Demuestra
 *    con una clase base `ModeloBase` y una subclase `ModeloUsuario` cómo `self::nombreTabla()`
 *    llama siempre al padre mientras que `static::nombreTabla()` resuelve el hijo.
 * 6. Composición de interfaces múltiples (`Countable` e `IteratorAggregate`):
 *    Crea una clase `ColeccionPedidos implements Countable, IteratorAggregate`
 *    para que un objeto personalizado pueda pasarse a `count($col)` y recorrerse
 *    con `foreach ($col as $pedido)`.
 * 7. Refactorización de Herencia Rígida a Composición: Reemplaza una jerarquía
 *    de clases `ReportePdfPorEmail` / `ReporteCsvPorSlack` por una única clase
 *    `GeneradorReporte` que recibe en su constructor un `FormateadorInterface`
 *    y un `CanalEntregaInterface`.
 *
 * [Senior / Producción]
 * 8. Tipos de Intersección (PHP 8.1+ `InterfaceA&InterfaceB`): Crea una función
 *    `procesarYRegistrar(EjecutableInterface&AuditableInterface $comando): void`
 *    que exija por sistema de tipos que el argumento implemente ambas interfaces.
 * 9. Polimorfismo en `enum` implementando una `interface` (PHP 8.1+): Crea una
 *    interfaz `TasaImpuestoInterface` y haz que un `enum CategoriaFiscal implements TasaImpuestoInterface`
 *    implemente el cálculo de impuesto usando `match ($this)` dentro del enum.
 * 10. Pipeline de Middlewares Polimórficos (Estilo PSR-15): Define `MiddlewareInterface`
 *     con `procesar(array $peticion, callable $siguiente): array` y encadena un
 *     `MiddlewareAutenticacion` y un `MiddlewareAuditoria`.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
