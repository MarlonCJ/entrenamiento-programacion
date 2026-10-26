<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 30: SEGURIDAD (OWASP), ARQUITECTURA EN CAPAS Y PROYECTO INTEGRADOR FINAL
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Mentalidad de Seguridad y Arquitectura Senior)
 * ----------------------------------------------------------------------------
 * ¡Felicidades por llegar al tema final de la ruta de PHP! En este módulo
 * consolidarás las defensas de seguridad nativas de PHP 8.x (**OWASP Top 10**) y
 * construirás un sistema empresarial completo con **Arquitectura en Capas /
 * Hexagonal**.
 *
 * Las 6 Reglas de Oro de Seguridad en PHP de Producción:
 * 1) **Hashing de Contraseñas (`password_hash` y `password_verify`)**:
 *    En PHP **JAMÁS uses `md5()` ni `sha1()` ni `hash('sha256', ...)` para
 *    contraseñas** (son algoritmos rápidos que una GPU rompe por fuerza bruta en
 *    segundos). Usa SIEMPRE **`password_hash($clave, PASSWORD_DEFAULT)`** (o
 *    `PASSWORD_ARGON2ID`), que genera un *Salt* criptográfico automático, y
 *    verifícala con **`password_verify($clavePlana, $hashGuardado)`**.
 * 2) **Comparación de Tokens en Tiempo Constante (`hash_equals`)**:
 *    Para comparar firmas HMAC de webhooks, tokens CSRF o API keys, usa siempre
 *    **`hash_equals($esperado, $recibido)`** (nunca `===`), previniendo ataques
 *    de temporización (*Timing Attacks*).
 * 3) **Generación de Aleatoriedad Criptográfica (`random_bytes` y `random_int`)**:
 *    Prohibido usar `rand()`, `mt_rand()` o `uniqid()` para tokens, códigos OTP
 *    o nombres de archivo secretos; son predecibles. Usa siempre `bin2hex(random_bytes(32))`
 *    y `random_int(100000, 999999)`.
 * 4) **Prevención de SQL Injection (`PDO` con Consultas Preparadas)**:
 *    Usa siempre placeholders `?` o `:nombre` con `PDO::ATTR_EMULATE_PREPARES => false`.
 * 5) **Prevención de XSS (`htmlspecialchars` contextual)**:
 *    Escapa toda salida hacia HTML con `ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'`.
 * 6) **Parámetros Sensibles en Stack Traces (`#[\SensitiveParameter]`, PHP 8.2+)**:
 *    Colocar el atributo `#[\SensitiveParameter]` antes de un parámetro como
 *    `$password` o `$apiKey` hace que PHP lo oculte como `Object(SensitiveParameterValue)`
 *    si ocurre una excepción y se genera un Stack Trace en los logs!
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Sistemas de Autenticación, Tokens CSRF y Verificación de Webhooks (HMAC-SHA256).
 * - Diseño de Aplicaciones Empresariales separadas en **Dominio**, **Aplicación
 *   (Casos de Uso)** e **Infraestructura (Adaptadores)**.
 * - Blindaje de Logs para no filtrar contraseñas ni tarjetas de crédito.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Contraseñas con #[\SensitiveParameter] (PHP 8.2+), password_hash y password_verify:
 * function crearHashPassword(#[\SensitiveParameter] string $passwordPlana): string {
 *     return password_hash($passwordPlana, PASSWORD_DEFAULT);
 * }
 *
 * function verificarPassword(#[\SensitiveParameter] string $passwordPlana, string $hash): bool {
 *     return password_verify($passwordPlana, $hash);
 * }
 *
 * // 2. Tokens criptográficos y firma HMAC verificada en tiempo constante:
 * $tokenSesion = bin2hex(random_bytes(32)); // 64 caracteres hexadecimales seguros
 * $firmaEsperada = hash_hmac('sha256', $payload, $secretoWebhook);
 * $firmaValida = hash_equals($firmaEsperada, $firmaRecibida);
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un verificador de seguridad de webhooks valida la firma HMAC-SHA256
 * de una notificación de pago en tiempo constante con `hash_equals` y protege el
 * secreto con `#[\SensitiveParameter]`.
 *
 * function verificarFirmaWebhook(
 *     string $payloadJson,
 *     string $firmaCabecera,
 *     #[\SensitiveParameter] string $secretoCompartido,
 * ): bool {
 *     $firmaCalculada = hash_hmac('sha256', $payloadJson, $secretoCompartido);
 *     return hash_equals($firmaCalculada, $firmaCabecera);
 * }
 *
 * $secreto = 'whsec_clave_super_secreta_2026';
 * $cuerpo = '{"evento":"pago.exitoso","orden_id":105}';
 * $firmaLegitima = hash_hmac('sha256', $cuerpo, $secreto);
 *
 * echo "Firma legítima: " . (verificarFirmaWebhook($cuerpo, $firmaLegitima, $secreto) ? 'VÁLIDA' : 'INVÁLIDA') . PHP_EOL;
 * echo "Firma alterada: " . (verificarFirmaWebhook($cuerpo, 'firma_falsa', $secreto) ? 'VÁLIDA' : 'INVÁLIDA') . PHP_EOL;
 * // Salida esperada:
 * // Firma legítima: VÁLIDA
 * // Firma alterada: INVÁLIDA
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA USES `unserialize()` CON DATOS DEL USUARIO: Puede instanciar clases
 *   arbitrarias del proyecto y ejecutar sus métodos mágicos `__wakeup()` o
 *   `__destruct()` (*PHP Object Injection* -> Ejecución Remota de Código). Usa
 *   siempre `json_decode(..., flags: JSON_THROW_ON_ERROR)` o pasa
 *   `['allowed_classes' => false]` a `unserialize`.
 * - USA `#[\SensitiveParameter]` (PHP 8.2+) EN TODA FUNCIÓN QUE RECIBA CLAVES,
 *   TOKENS O TARJETAS: Evita que un fallo inesperado imprima la contraseña del
 *   usuario en claro dentro de Sentry, Datadog o los archivos de log.
 * - SEPARA EL DOMINIO DE LA INFRAESTRUCTURA: Tus entidades (`Orden`, `Producto`)
 *   y tus objetos de valor (`Dinero`, `Email`) nunca deben contener llamadas a
 *   `$_POST`, `echo` ni `PDO`.
 *
 * 6. PROYECTO INTEGRADOR FINAL: 10 RETOS PARA CONSTRUIR UN SISTEMA E-COMMERCE SENIOR
 * ----------------------------------------------------------------------------
 * Construirás paso a paso una aplicación empresarial completa en PHP 8.x que
 * integra los 30 temas del entrenamiento:
 *
 * [Fase 1: Seguridad y Capa de Dominio Inmutable]
 * 1. **Objetos de Valor Inmutables (`readonly class Dinero`, `Email`, `Sku`)**:
 *    Implementa `Dinero` operando en centavos (`int`) con suma, resta y
 *    multiplicación seguras, `Email` validado con `filter_var` y `Sku` validado
 *    con Regex `\A...\z`.
 * 2. **Servicio de Seguridad Criptográfica (`GestorSeguridad`)**:
 *    Implementa hashing y verificación de contraseñas (`password_hash`/`password_verify`
 *    con `#[\SensitiveParameter]`), generación de tokens con `random_bytes()`,
 *    códigos OTP de 6 dígitos con `random_int()`, verificación HMAC con
 *    `hash_equals()` y escapado HTML contra XSS.
 * 3. **Enums y Entidades de Dominio Ricas (`EstadoOrden`, `Producto`, `Orden`)**:
 *    Modela `EstadoOrden` como *Backed Enum* con reglas de transición válidas y
 *    la entidad `Orden` que encapsula sus líneas, protege sus invariantes y
 *    calcula su total en `Dinero`.
 *
 * [Fase 2: Puertos, Repositorios (Memoria + PDO SQLite En-Memoria) y Caché]
 * 4. **Puertos de Repositorio e Implementación con SQLite en Memoria (`PDO('sqlite::memory:')`)**:
 *    Define `RepositorioProductosInterface` y `RepositorioOrdenesInterface`, e
 *    impleméntalos usando `PDO` con consultas preparadas (`prepare` / `execute`)
 *    para prevenir al 100% cualquier inyección SQL.
 * 5. **Decorador de Caché LRU y Limitador de Tasa (*Rate Limiter*)**:
 *    Envuelve el repositorio de productos con un decorador de caché en $O(1)$ e
 *    implementa un limitador de intentos por usuario.
 *
 * [Fase 3: Caso de Uso Transaccional, Patrones e Idempotencia]
 * 6. **Estrategias Polimórficas de Descuento e Impuestos (Strategy Pattern)**:
 *    Crea `PoliticaPreciosInterface` con implementaciones combinables para clientes
 *    VIP y cupones promocionales.
 * 7. **Caso de Uso `ProcesarCheckoutService` con Idempotencia y Eventos**:
 *    Orquesta el checkout validando clave de idempotencia (`idempotencyKey`),
 *    verificando y descontando stock, persistiendo la orden y disparando un
 *    evento `OrdenPagadaEvent` a los observadores suscritos.
 *
 * [Fase 4: Analítica Funcional, Streaming de Archivos y Suite de Pruebas AAA]
 * 8. **Motor de Reportes Financieros (`array_filter`, `array_map`, `array_reduce`)**:
 *    Genera un cuadro de mando que calcule ingresos totales en centavos, ticket
 *    promedio, ventas por estado y el Top 3 de productos más vendidos.
 * 9. **Exportador e Importador de Auditoría en Streaming (`Generator` + JSON Lines)**:
 *    Exporta las órdenes confirmadas a un archivo temporal `.jsonl` de forma
 *    atómica (`LOCK_EX`) con `DateTimeImmutable` en UTC y `JSON_THROW_ON_ERROR`,
 *    y léelas en memoria constante $O(1)$ usando `yield` y `try / finally`.
 * 10. **Suite de Pruebas Automatizadas End-to-End (Patrón AAA)**:
 *     Ejecuta al final del archivo una batería de pruebas automatizadas que
 *     verifique el flujo completo: registro seguro de usuario, checkout exitoso,
 *     rechazo por stock agotado, protección de idempotencia ante doble cobro,
 *     defensa contra SQL Injection en `PDO` y cuadre exacto del reporte financiero.
 */

// Zona de trabajo: construye y prueba aqui tu Proyecto Integrador Final de PHP.
