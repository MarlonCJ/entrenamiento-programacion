<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 17: MANEJO DE ERRORES, JERARQUÍA THROWABLE, EXCEPCIONES DE DOMINIO Y FINALLY
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Excepciones en PHP 8.x)
 * ----------------------------------------------------------------------------
 * Desde PHP 7 y perfeccionado en PHP 8, casi todos los errores fatales del motor
 * fueron unificados bajo la interfaz raíz **`Throwable`**, la cual se divide en
 * dos grandes ramas:
 *
 * 1) **`Error` (Errores internos del motor o de programación)**:
 *    - `TypeError`: Fallo de tipos en parámetros o retornos con `strict_types=1`.
 *    - `ValueError` (PHP 8.0+): El tipo es correcto, pero el valor es inválido
 *      (ej. pasar un número negativo donde una función nativa exige positivo).
 *    - `UnhandledMatchError` (PHP 8.0+): Un `match` no encontró ningún caso.
 *    - `DivisionByZeroError`, `ParseError`, `ArithmeticError`.
 * 2) **`Exception` (Condiciones excepcionales de aplicación y negocio)**:
 *    - Excepciones SPL estándar: `InvalidArgumentException`, `DomainException`,
 *      `LogicException`, `RuntimeException`, `OutOfBoundsException`.
 *    - Excepciones personalizadas de tu dominio que heredan de `DomainException`
 *      o `RuntimeException`.
 *
 * Novedades de PHP 8.0+ en Excepciones:
 * - **`catch` sin variable (`catch (TimeoutException)`)**: Si solo necesitas el
 *   tipo de la excepción y no vas a usar el objeto `$e`, puedes omitir la variable.
 * - **`throw` como expresión**: Puedes lanzar excepciones dentro de `??`, `? :`,
 *   Arrow Functions `fn() => throw ...` y brazos de `match`!
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Excepciones de Dominio con Constructores Estáticos con Nombre (*Named Constructors*):
 *   `throw SaldoInsuficienteException::paraCuenta($idCuenta, $saldo, $monto);`
 * - Envoltura de Excepciones entre Capas (*Exception Wrapping / Chaining*):
 *   Capturar un error técnico de base de datos o red y lanzar una excepción de
 *   servicio pasando `$e` como tercer argumento (`previous`) para no perder la
 *   traza original.
 * - Liberación garantizada de recursos o bloqueos en el bloque `finally`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Excepción de Dominio expresiva con Named Constructor:
 * final class StockInsuficienteException extends DomainException {
 *     public static function paraSku(string $sku, int $solicitado, int $disponible): self {
 *         return new self(
 *             "Stock insuficiente para {$sku}: solicitado {$solicitado}, disponible {$disponible}."
 *         );
 *     }
 * }
 *
 * // 2. throw como expresión (PHP 8.0+) y multi-catch:
 * // $apiKey = $config['api_key'] ?? throw new InvalidArgumentException("Falta api_key");
 * // try {
 * //     ...
 * // } catch (InvalidArgumentException | DomainException $e) {
 * //     // Manejo de error de negocio
 * // } catch (Throwable $e) {
 * //     // Manejo global y registro en log
 * // } finally {
 * //     // Limpieza garantizada
 * // }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un servicio de cobro valida sus entradas usando `throw` en una
 * expresión `??`, lanza una excepción de dominio con contexto rico y encadena la
 * causa previa si falla la pasarela externa.
 *
 * final class PagoRechazadoException extends RuntimeException {}
 *
 * function procesarCobro(array $orden): string {
 *     $id = $orden['id'] ?? throw new InvalidArgumentException("La orden requiere un ID");
 *     $monto = $orden['monto'] ?? 0.0;
 *     if ($monto <= 0) {
 *         throw new DomainException("Orden {$id}: el monto ({$monto}) debe ser positivo");
 *     }
 *     return "RECIBO-{$id}-OK";
 * }
 *
 * try {
 *     echo procesarCobro(['id' => 'ORD-10', 'monto' => 150.0]) . PHP_EOL;
 *     echo procesarCobro(['id' => 'ORD-11', 'monto' => -20.0]) . PHP_EOL;
 * } catch (InvalidArgumentException | DomainException $e) {
 *     echo "[ERROR DE NEGOCIO] " . $e->getMessage() . PHP_EOL;
 * }
 * // Salida esperada:
 * // RECIBO-ORD-10-OK
 * // [ERROR DE NEGOCIO] Orden ORD-11: el monto (-20) debe ser positivo
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA USES EL OPERADOR DE SUPRESIÓN DE ERRORES `@` (`@file_get_contents(...)`):
 *   Es un antipatrón severo en PHP: oculta fallos críticos, tiene un costo de
 *   rendimiento interno y hace imposible depurar en producción.
 * - NUNCA DEJES UN BLOQUE `catch (Exception $e) {}` VACÍO (Tragar excepciones):
 *   Si capturas una excepción, debes manejarla genuinamente, registrarla en el
 *   log o relanzarla envuelta en otra excepción pasando `$e` como tercer
 *   argumento: `throw new ServicioException("Mensaje", 0, $e);`.
 * - CAPTURA DE LO MÁS ESPECÍFICO A LO MÁS GENERAL: Pon primero los `catch` de
 *   subclases específicas (`DomainException`) y al final `Throwable` en la capa
 *   más externa (controlador / manejador global).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Validación con `InvalidArgumentException` y `DivisionByZeroError`: Crea una
 *    función `calcularPrecioUnitario(float $total, int $unidades): float` que
 *    valide sus entradas y pruébala con `try / catch`.
 * 2. Uso de `throw` como expresión (PHP 8.0+): Extrae tres valores obligatorios
 *    de un arreglo de configuración usando `$config['clave'] ?? throw new InvalidArgumentException(...)`.
 * 3. Limpieza garantizada con `finally`: Simula la apertura de una sesión de
 *    trabajo que imprime `"[INICIO]"`, lanza una excepción a mitad del proceso y
 *    garantiza imprimir `"[RECURSO LIBERADO]"` en el bloque `finally`.
 *
 * [Intermedio]
 * 4. Jerarquía de excepciones de dominio con *Named Constructors*: Crea una
 *    clase base `InventarioException extends DomainException` y dos subclases
 *    (`ProductoAgotadoException`, `SkuNoEncontradoException`) con métodos
 *    estáticos de creación expresivos.
 * 5. Multi-catch y `catch` sin variable (PHP 8.0+): Procesa un lote de operaciones
 *    capturando múltiples excepciones de validación en un solo bloque
 *    `catch (InvalidArgumentException | ValueError $e)` y otra excepción con
 *    `catch (OutOfBoundsException)`.
 * 6. Encadenamiento de causa (`$e->getPrevious()`): Simula una capa de
 *    infraestructura que lanza `RuntimeException("Error de socket PDO")` y una
 *    capa de aplicación que la captura y lanza `RepositorioException("No se pudo guardar el cliente", 500, $e)`.
 *    Imprime el mensaje principal y el de `getPrevious()`.
 * 7. Captura de `TypeError` y `ValueError` de PHP 8: Demuestra cómo capturar un
 *    `ValueError` nativo de PHP 8 (por ejemplo, al llamar a `json_validate` o
 *    funciones de string/array con argumentos fuera de dominio).
 *
 * [Senior / Producción]
 * 8. Reintentos Inteligentes con Backoff (*Retry Policy*): Implementa una función
 *    `ejecutarConReintentos(callable $operacion, int $maxIntentos): mixed` que
 *    reintente únicamente si se lanza una `ExcepcionTransitoriaRed`, pero aborte
 *    de inmediato sin reintentar si se lanza `DomainException`.
 * 9. Traductor Global de Excepciones a Respuestas HTTP JSON (Estilo Middleware):
 *    Implementa `convertirExcepcionARespuestaHttp(Throwable $e): array` usando
 *    `match (true)` sobre `$e instanceof ...` para mapear excepciones de dominio
 *    a `400/404/422` y errores inesperados a `500` sin filtrar rutas del servidor
 *    ni trazas sensibles al usuario final.
 * 10. Recolector de Errores de Lote (*Notification Pattern*): Procesa una lista
 *     de 10 facturas donde algunas fallan; captura las excepciones por ítem y
 *     devuelve un resumen con `['exitosas' => [...], 'fallidas' => [['id' => ..., 'error' => ...]]]`.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
