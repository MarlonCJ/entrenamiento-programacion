<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 04: CONVERSIÓN SEGURA, TYPE JUGGLING Y VALIDACIÓN DEFENSIVA (FILTER_VAR)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Coerción vs Validación)
 * ----------------------------------------------------------------------------
 * Todas las entradas que llegan a una aplicación PHP desde el mundo exterior
 * (formularios HTTP `$_POST`, query strings `$_GET`, variables de entorno `$_ENV`,
 * archivos CSV o cabeceras) llegan como **`string`**.
 *
 * El peligro del Casting Ciego `(int)` y `(bool)` en PHP:
 * - Hacer `(int) "abc"` NO lanza ningún error: devuelve `0` silenciosamente!
 *   Si validas un ID o un precio con `(int) $input`, una cadena inválida se
 *   convierte en `0` y puede corromper tu base de datos.
 * - Hacer `(int) "42xyz"` devuelve `42` ignorando la basura al final.
 * - Hacer `(bool) "false"` o `(bool) "0.0"` devuelve **`true`**! (Porque cualquier
 *   string no vacío, excepto `"0"` y `""`, es `true` al hacer cast directo).
 *
 * ¿Cómo valida y convierte datos un desarrollador PHP Senior?
 * Usando la extensión nativa **`filter_var()`** (`FILTER_VALIDATE_INT`,
 * `FILTER_VALIDATE_FLOAT`, `FILTER_VALIDATE_BOOLEAN`, `FILTER_VALIDATE_EMAIL`),
 * que valida el formato completo y devuelve `false` (o `null` con
 * `FILTER_NULL_ON_FAILURE`) si el dato contiene caracteres inválidos o está
 * fuera de rango.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Validación de Parámetros de Paginación en APIs: Convertir `?page=2&limit=20`
 *   asegurando con `min_range` y `max_range` que `page >= 1` y `1 <= limit <= 100`.
 * - Banderas de Configuración (`Feature Flags` desde `.env`): Convertir `"true"`,
 *   `"false"`, `"1"`, `"0"`, `"yes"`, `"no"` a un `bool` real usando
 *   `filter_var($val, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)`.
 * - Validación de Correos, IPs y URLs: Usar los filtros estándar RFC de PHP.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Validación y conversión estricta de entero con rango:
 * $pagina = filter_var("3", FILTER_VALIDATE_INT, [
 *     'options' => ['min_range' => 1, 'max_range' => 1000]
 * ]); // Devuelve int(3) si es válido, o false si falla ("3abc", "0", "-5")
 *
 * // 2. Conversión segura de booleanos de configuración ("false" -> bool(false)):
 * $modoDebug = filter_var("false", FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
 * // Devuelve true, false, o null si no es un valor booleano reconocible
 *
 * // 3. Diferencia entre is_numeric(), ctype_digit() y filter_var():
 * // ctype_digit("12345") -> true (solo dígitos ASCII '0'-'9', ideal para códigos/PINs)
 * // is_numeric("-12.5e3") -> true (acepta notación científica y negativos)
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un validador de frontera para un endpoint de creación de producto
 * convierte y valida un payload crudo de strings, lanzando `InvalidArgumentException`
 * si algún campo no es convertible limpiamente.
 *
 * function parsearEnteroRango(string|int $valor, string $campo, int $min, int $max): int {
 *     $limpio = is_string($valor) ? trim($valor) : $valor;
 *     $resultado = filter_var($limpio, FILTER_VALIDATE_INT, [
 *         'options' => ['min_range' => $min, 'max_range' => $max]
 *     ]);
 *     if ($resultado === false) {
 *         throw new InvalidArgumentException(
 *             "El campo '{$campo}' debe ser un entero entre {$min} y {$max}. Recibido: '{$valor}'"
 *         );
 *     }
 *     return $resultado;
 * }
 *
 * // Ejecución de prueba:
 * // echo "Cantidad válida: " . parsearEnteroRango(" 15 ", "cantidad", 1, 100) . PHP_EOL;
 * // Salida esperada:
 * // Cantidad válida: 15
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA USES `(bool) $cadena` PARA PARSEAR STRINGS BOOLEANOS:
 *   `(bool) "false"` es `true`! Usa siempre `filter_var($v, FILTER_VALIDATE_BOOLEAN)`.
 * - CUIDADO AL VERIFICAR EL RETORNO DE `filter_var` CON `!$resultado`:
 *   Si el usuario envía `"0"` y el `0` es un entero válido en tu negocio,
 *   `filter_var("0", FILTER_VALIDATE_INT)` devuelve `int(0)`. Si haces
 *   `if (!$resultado)`, tratarás el `0` como error porque `0` es *falsy*!
 *   Compara SIEMPRE estrictamente con `if ($resultado === false)`.
 * - `ctype_digit()` REQUIERE UN `string`: Si le pasas un `int` menor a 256 en
 *   versiones antiguas o no controlas el tipo, tenía comportamientos extraños;
 *   asegura siempre que el argumento sea `string`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Trampa del casting directo vs `filter_var`: Compara en consola el resultado
 *    de `(int) "100px"`, `(int) "abc"` y `(bool) "false"` frente a usar
 *    `filter_var` con `FILTER_VALIDATE_INT` y `FILTER_VALIDATE_BOOLEAN`.
 * 2. Validador de edad con rango: Crea `validarEdad(string $entrada): ?int` que
 *    devuelva la edad como `int` si es un entero válido entre `18` y `120`, o
 *    `null` en caso contrario.
 * 3. Validador de código PIN numérico: Usa `ctype_digit()` y `strlen()` para
 *    verificar si un string representa exactamente un PIN bancario de 4 o 6
 *    dígitos (incluyendo los que empiezan por `'0'`, como `"0482"`).
 *
 * [Intermedio]
 * 4. Validador de precio decimal positivo: Implementa `parsearPrecio(string $entrada): float`
 *    que use `FILTER_VALIDATE_FLOAT`, verifique que no sea negativo ni `INF`/`NAN`
 *    y lo redondee a 2 decimales, lanzando `InvalidArgumentException` si falla.
 * 5. Validador de email y dominio corporativo: Usa `FILTER_VALIDATE_EMAIL` para
 *    validar un correo (normalizado con `strtolower(trim($email))`) y comprobar
 *    si pertenece a una lista blanca de dominios permitidos.
 * 6. Normalizador de parámetros de paginación HTTP: Crea una función que reciba
 *    un arreglo `$queryParams` (como `$_GET`) y devuelva `['page' => int, 'limit' => int]`
 *    aplicando valores por defecto seguros (`page = 1`, `limit = 20`, máximo `100`)
 *    cuando los parámetros falten o sean inválidos.
 * 7. Conversión de tipos compuestos y JSON: Toma un string JSON, decodifícalo
 *    y verifica con `is_array()`, `is_string()` e `is_int()` la estructura de sus
 *    campos antes de usarlos.
 *
 * [Senior / Producción]
 * 8. Lector tipado de Variables de Entorno (`EnvReader`): Crea una clase con
 *    métodos estáticos `string(string $key, string $default)`, `int(string $key, int $default)`
 *    y `bool(string $key, bool $default)` que parsee valores simulados de `.env`
 *    y lance `RuntimeException` si una variable tiene un formato corrupto.
 * 9. Sanitización y Validación de DTO de Registro con Recolección de Errores:
 *    Procesa un arreglo asociativo crudo (`nombre`, `email`, `edad`, `acepta_terminos`)
 *    y devuelve un objeto/arreglo con los datos ya tipados o una lista detallada
 *    de todos los errores encontrados por campo (sin detenerse en el primero).
 * 10. Prevención de vulnerabilidades de *Type Juggling* en comparaciones:
 *     Demuestra cómo en PHP antiguo o con `==` expresiones como `0 == "admin"`
 *     (PHP 7) o `"0e12345" == "0e98765"` (hashes en notación científica) causaban
 *     bypasses de autenticación, y cómo `===` y `hash_equals()` lo blindan.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
