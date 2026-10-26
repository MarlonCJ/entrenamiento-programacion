<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 29: CLEAN CODE, PRINCIPIOS SOLID Y PATRONES DE DISEÑO EN PHP 8.x
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Diseño de Software)
 * ----------------------------------------------------------------------------
 * Escribir código que la máquina entienda es fácil; escribir código que otros
 * ingenieros puedan entender, probar y extender dentro de 2 años sin miedo a
 * romper producción es el arte de la Ingeniería de Software Senior.
 *
 * Los 5 Principios SOLID en PHP 8:
 * - **S - Single Responsibility (SRP)**: Una clase debe tener una sola razón de
 *   cambio (ej. `CalculadoraNomina` calcula; `ExportadorNominaPdf` formatea;
 *   `RepositorioNomina` persiste).
 * - **O - Open/Closed (OCP)**: Extiende el comportamiento agregando nuevas
 *   clases que implementen una `interface` (o casos con métodos en un `enum`),
 *   no modificando un `if / elseif` interminable.
 * - **L - Liskov Substitution (LSP)**: Toda implementación de una interfaz debe
 *   respetar el contrato de entrada, salida y excepciones prometido.
 * - **I - Interface Segregation (ISP)**: Interfaces pequeñas y enfocadas por rol
 *   del consumidor (`LectorArchivoInterface`, `EscritorArchivoInterface`).
 * - **D - Dependency Inversion (DIP)**: Las clases de negocio reciben sus
 *   dependencias como interfaces en el constructor (*Constructor Injection*).
 *
 * Patrones de Diseño Esenciales en Backend PHP:
 * 1) **Strategy**: Algoritmos intercambiables de precios, impuestos o envíos.
 * 2) **Factory / Named Constructors**: Creación limpia y desacoplada de objetos.
 * 3) **Decorator**: Envolver un servicio con la misma interfaz para añadir
 *    caché, logs o reintentos sin tocar la clase original.
 * 4) **Observer / Event Dispatcher (PSR-14)**: Desacoplar efectos secundarios.
 * 5) **Repository**: Aislar el dominio de la tecnología de persistencia (SQL/Memoria).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Arquitecturas en Laravel / Symfony: Inyección de dependencias en constructores
 *   de Casos de Uso / Actions y despacho de eventos de dominio.
 * - Decoradores de Repositorios o Clientes HTTP: Agregar caché o registro de
 *   auditoría envolviendo la implementación real.
 * - Eliminación de Código Espagueti mediante *Guard Clauses*, métodos pequeños y
 *   objetos de valor tipados.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // Patrón Decorator + Dependency Inversion (DIP) con Constructor Promotion:
 * interface CotizadorDivisaInterface {
 *     public function obtenerTasa(string $moneda): float;
 * }
 *
 * final class CotizadorConCache implements CotizadorDivisaInterface {
 *     private array $cache = [];
 *
 *     public function __construct(
 *         private readonly CotizadorDivisaInterface $decorado,
 *     ) {}
 *
 *     public function obtenerTasa(string $moneda): float {
 *         return $this->cache[$moneda] ??= $this->decorado->obtenerTasa($moneda);
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un servicio de checkout utiliza el patrón **Strategy** inyectado
 * para calcular el descuento según la campaña activa y un **Observer** ligero
 * para reaccionar a la compra confirmada.
 *
 * interface EstrategiaDescuentoInterface {
 *     public function calcularDescuento(float $subtotal): float;
 * }
 *
 * final class DescuentoBlackFriday implements EstrategiaDescuentoInterface {
 *     public function calcularDescuento(float $subtotal): float {
 *         return $subtotal >= 100.0 ? round($subtotal * 0.25, 2) : 0.0;
 *     }
 * }
 *
 * final class CheckoutService {
 *     public function __construct(
 *         private readonly EstrategiaDescuentoInterface $estrategia,
 *     ) {}
 *
 *     public function cobrar(float $subtotal): float {
 *         return $subtotal - $this->estrategia->calcularDescuento($subtotal);
 *     }
 * }
 *
 * $checkout = new CheckoutService(new DescuentoBlackFriday());
 * echo "Total Black Friday sobre $200: $" . $checkout->cobrar(200.0) . PHP_EOL;
 * // Salida esperada:
 * // Total Black Friday sobre $200: $150
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - EVITA EL ANTIPATRÓN SINGLETON (`MiClase::getInstance()`): Es un estado
 *   global disfrazado que oculta las dependencias reales en las firmas de tus
 *   clases y hace difícil aislar las pruebas. Si necesitas una única instancia
 *   compartida, deja que tu Contenedor de Inyección de Dependencias la gestione
 *   e inyéctala por constructor.
 * - CUMPLE LA LEY DE DEMETER (*Principio de Mínimo Conocimiento*): En lugar de
 *   encadenar llamadas que exponen las tripas de un objeto
 *   (`$pedido->getCliente()->getBilletera()->setSaldo(...)`), pídele a la entidad
 *   raíz que ejecute la operación de negocio (`$pedido->cobrarAlCliente()`).
 * - APLICA *KISS* Y *YAGNI*: Usa patrones para resolver dolores reales de
 *   acoplamiento o ramificación, no por deporte.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Refactorización Clean Code: Reescribe una función confusa llena de
 *    abreviaturas, banderas booleanas y `else` anidados hacia funciones pequeñas
 *    con nombres de intención clara y Guard Clauses.
 * 2. Principio de Responsabilidad Única (SRP): Separa una clase `GestorUsuariosDios`
 *    (que valida datos, hashea contraseñas, guarda en memoria y formatea emails)
 *    en colaboradores especializados.
 * 3. Principio Abierto/Cerrado (OCP) con `enum` o Polimorfismo: Reemplaza un
 *    bloque de cálculo de comisiones por tipo de vendedor usando polimorfismo.
 *
 * [Intermedio]
 * 4. Principio de Sustitución de Liskov (LSP): Muestra cómo una clase
 *    `ArchivoSoloLectura extends ArchivoEditable` que lanza excepción en
 *    `escribir()` viola LSP, y corrígelo segregando las interfaces
 *    `LegibleInterface` y `EscribibleInterface` (ISP).
 * 5. Patrón **Strategy** para Cálculo de Impuestos Internacionales: Implementa
 *    `ImpuestoColombia`, `ImpuestoEspana` e `ImpuestoExento` bajo una misma
 *    interfaz e inyéctalos en un `CalculadorOrden`.
 * 6. Patrón **Factory** con Mapa de Registro: Crea una `FabricaNotificadores`
 *    que permita registrar creadores (`Closure`) por tipo (`'email'`, `'sms'`,
 *    `'push'`) e instanciarlos sin usar `switch`.
 * 7. Patrón **Repository** (Contrato + Adaptador en Memoria): Define
 *    `RepositorioProductosInterface` (`guardar`, `buscarPorSku`, `todos`) y su
 *    implementación en memoria desacoplada del servicio de dominio.
 *
 * [Senior / Producción]
 * 8. Patrón **Decorator** Apilable (Logging + Caché + Reintentos): Envuelve un
 *    `ServicioClimaInterface` con un `ClimaConCacheDecorator` y un
 *    `ClimaConAuditoriaDecorator`, demostrando cómo ambos cumplen el mismo
 *    contrato de forma transparente para el consumidor.
 * 9. Patrón **Observer / Event Dispatcher (Estilo PSR-14)**: Implementa un
 *    `DespachadorEventos` donde puedes suscribir múltiples listeners a una clase
 *    de evento inmutable (`readonly class PedidoPagadoEvent`) y dispararlos al
 *    confirmar un pago.
 * 10. Patrón **Specification** (Reglas de Negocio Combinables): Crea una
 *     interfaz `EspecificacionCandidatoInterface` con `esSatisfechaPor(array $c): bool`
 *     y combinadores `AndSpecification` y `OrSpecification` para armar filtros de
 *     negocio complejos como piezas de Lego.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
