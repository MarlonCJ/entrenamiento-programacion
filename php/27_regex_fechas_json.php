<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 27: EXPRESIONES REGULARES (PCRE2), FECHAS INMUTABLES Y JSON SEGURO
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Integraciones de Producción)
 * ----------------------------------------------------------------------------
 * Este tema domina los tres pilares de procesamiento de datos externos en PHP:
 *
 * 1) **Expresiones Regulares PCRE2 (`preg_match`, `preg_match_all`, `preg_replace_callback`)**:
 *    - En PHP, las expresiones regulares van encerradas entre **delimitadores**
 *      (`/patron/`, `#patron#` o `~patron~`) seguidos de modificadores:
 *      - `u` (*UTF-8*): **Obligatorio** cuando procesas texto en español o
 *        Unicode para que `\w`, `.` y los rangos funcionen con caracteres multibyte.
 *      - `i` (*Case-insensitive*): Ignora mayúsculas/minúsculas.
 *      - `x` (*Extended*): Permite escribir regex largas comentadas en varias líneas.
 *      - **`\z` vs `$` (Gotcha de Seguridad Crítico en PHP!)**: En PCRE, el ancla
 *        `$` coincide con el final del string **O antes de un salto de línea `\n`
 *        al final**! Si validas `preg_match('/^[0-9]+$/', "12345\n")`, ¡devuelve `1`
 *        (válido)! Para exigir el final exacto del string sin `\n`, usa siempre
 *        `/\A[0-9]+\z/` o el modificador `D` (`/^[0-9]+$/D`).
 * 2) **Fechas Inmutables (`DateTimeImmutable` y `DateTimeZone`)**:
 *    En PHP moderno **NUNCA uses `DateTime` (mutable)** porque pasar un `DateTime`
 *    a una función que llama a `$fecha->modify('+1 day')` altera silenciosamente
 *    la fecha original en todo tu sistema! Usa siempre **`DateTimeImmutable`**,
 *    que devuelve una nueva instancia en cada modificación.
 * 3) **JSON Seguro (`JSON_THROW_ON_ERROR` y `json_validate` en PHP 8.3+)**:
 *    Por defecto, `json_encode` y `json_decode` NO lanzan excepciones si el JSON
 *    está corrupto: devuelven `false` o `null` silenciosamente! En producción,
 *    pasa SIEMPRE la bandera **`JSON_THROW_ON_ERROR`** (PHP 7.3+) para que lance
 *    `JsonException` ante cualquier error.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Extracción con Grupos con Nombre (*Named Capturing Groups* `(?<nombre>...)`):
 *   Parsear logs, códigos de referencia o facturas poblando `$matches['nombre']`.
 * - Manejo de Zonas Horarias en APIs: Guardar todo en UTC (`new DateTimeZone('UTC')`)
 *   en formato ISO-8601 (`DateTimeInterface::ATOM`) y convertir a `'America/Bogota'`
 *   solo en la capa de presentación.
 * - Serialización/Deserialización estricta de Payloads de Webhooks con `JsonException`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Regex PCRE2 con grupos con nombre y anclas exactas \A y \z:
 * $patron = '/\AFAC-(?<anio>\d{4})-(?<consecutivo>\d{5})\z/u';
 * if (preg_match($patron, 'FAC-2026-00142', $coincidencias) === 1) {
 *     $anio = (int) $coincidencias['anio'];               // 2026
 *     $consecutivo = (int) $coincidencias['consecutivo']; // 142
 * }
 *
 * // 2. Fechas 100% inmutables con DateTimeImmutable y UTC:
 * $utc = new DateTimeZone('UTC');
 * $emision = new DateTimeImmutable('2026-10-25 20:00:00', $utc);
 * $vencimiento = $emision->modify('+30 days'); // $emision NO cambia!
 * $enBogota = $emision->setTimezone(new DateTimeZone('America/Bogota'));
 *
 * // 3. JSON seguro con JSON_THROW_ON_ERROR:
 * $json = json_encode(['ok' => true, 'fecha' => $emision->format(DateTimeInterface::ATOM)],
 *     JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
 * $datos = json_decode($json, associative: true, flags: JSON_THROW_ON_ERROR);
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un procesador de webhooks valida un payload JSON con `JSON_THROW_ON_ERROR`,
 * extrae el código de referencia con grupos con nombre en `preg_match` y calcula
 * su fecha de expiración en UTC usando `DateTimeImmutable`.
 *
 * $payloadCrudo = '{"referencia":"ORD-2026-9876","creado_utc":"2026-10-25T18:30:00+00:00"}';
 * $evento = json_decode($payloadCrudo, associative: true, flags: JSON_THROW_ON_ERROR);
 *
 * if (preg_match('/\AORD-(?<anio>\d{4})-(?<id>\d{4})\z/', $evento['referencia'], $m) === 1) {
 *     $creado = new DateTimeImmutable($evento['creado_utc']);
 *     $expira = $creado->add(new DateInterval('PT2H')); // Suma 2 horas exactas
 *     echo sprintf(
 *         "Orden #%s (Año %s) | Expira UTC: %s" . PHP_EOL,
 *         $m['id'],
 *         $m['anio'],
 *         $expira->format(DateTimeInterface::ATOM)
 *     );
 * }
 * // Salida esperada:
 * // Orden #9876 (Año 2026) | Expira UTC: 2026-10-25T20:30:00+00:00
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - EL BUG DE `$` CON SALTO DE LÍNEA EN `preg_match`: Recuerda siempre que
 *   `/^\d+$/` acepta `"123\n"`! Usa `/\A\d+\z/` o `/^\d+$/D` para validación
 *   estricta de entradas de seguridad.
 * - COMPARA SIEMPRE EL RETORNO DE `preg_match` CON `=== 1`: `preg_match` devuelve
 *   `1` si coincide, `0` si no coincide, y `false` si hubo un error en la expresión.
 * - PROHIBIDO USAR `DateTime` MUTABLE EN ENTIDADES Y SERVICIOS: Si pasas un
 *   objeto `DateTime` a otro método y alguien llama a `->add(...)` o `->modify(...)`,
 *   mutará tu fecha original causando bugs silenciosos en facturación. Usa
 *   siempre `DateTimeImmutable`.
 * - SIEMPRE INCLUYE `JSON_THROW_ON_ERROR`: Nunca dependas de `json_last_error()` manual.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Demostración de `\z` vs `$` en `preg_match`: Comprueba qué devuelve
 *    `preg_match('/^[0-9]+$/', "42\n")` frente a `preg_match('/\A[0-9]+\z/', "42\n")`.
 * 2. Inmutabilidad de `DateTimeImmutable` vs `DateTime`: Demuestra cómo llamar a
 *    `$fecha->modify('+7 days')` sobre `DateTime` altera la variable original,
 *    mientras que sobre `DateTimeImmutable` la preserva intacta.
 * 3. Serialización y deserialización con `JSON_THROW_ON_ERROR`: Codifica un
 *    arreglo con tildes y URLs usando `JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES`
 *    y captura en un `try / catch (JsonException)` el intento de decodificar un
 *    JSON truncado `"{'mal': 1"`.
 *
 * [Intermedio]
 * 4. Extracción con Grupos con Nombre (`(?<nombre>...)`): Parsea líneas de log
 *    con formato `"[2026-10-25 14:00:00] LEVEL=ERROR SERVICE=pagos MSG=Timeout"`
 *    extrayendo `fecha`, `nivel`, `servicio` y `mensaje`.
 * 5. Enmascaramiento dinámico con `preg_replace_callback`: Oculta todos los
 *    correos electrónicos dentro de un párrafo reemplazando los caracteres antes
 *    de la `'@'` por asteriscos de la misma longitud exacta.
 * 6. Conversión entre Zonas Horarias y `DateTimeImmutable::createFromFormat`:
 *    Parsea la cadena `"25/10/2026 15:30:00"` en zona `'America/Bogota'` usando
 *    `!d/m/Y H:i:s` y conviértela a `'UTC'` y `'Europe/Madrid'`.
 * 7. Cálculo de diferencias e iteración de fechas (`diff` y `DatePeriod`):
 *    Calcula la diferencia exacta en años, meses y días entre dos fechas con
 *    `$f1->diff($f2)` y genera todas las fechas de cobro mensual de un año con
 *    `DatePeriod`.
 *
 * [Senior / Producción]
 * 8. Calculadora de Días Hábiles (`sumarDiasHabiles`): Implementa una función
 *    que sume $N$ días hábiles a un `DateTimeImmutable`, saltando sábados y
 *    domingos (`(int) $fecha->format('N') >= 6`) y un arreglo de fechas festivas.
 * 9. Implementación de la interfaz `JsonSerializable`: Crea una clase de dominio
 *    `ResumenTransaccion implements JsonSerializable` con propiedades privadas y
 *    un `DateTimeImmutable`, definiendo `jsonSerialize(): mixed` para controlar
 *    exactamente cómo la convierte `json_encode()`.
 * 10. Validador de Esquema JSON y Prevención de ReDoS: Implementa un validador
 *     para un payload JSON de entrada (validando presencia de campos, tipos,
 *     formato ISO-8601 y longitud máxima antes de aplicar regex para evitar
 *     ataques de denegación de servicio por expresiones regulares).
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
