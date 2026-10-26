<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 11: CADENAS DE TEXTO, MULTIBYTE (UTF-8) Y PROCESAMIENTO SEGURO
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Strings en PHP)
 * ----------------------------------------------------------------------------
 * En PHP, un `string` es internamente una estructura compuesta por su longitud
 * en bytes y un arreglo contiguo de **bytes** (8 bits por posición).
 *
 * ¡La diferencia crítica entre Bytes (`strlen`) y Caracteres UTF-8 (`mb_strlen`)!:
 * - Las funciones clásicas (`strlen`, `substr`, `strpos`, `strtolower`, `strtoupper`)
 *   operan sobre **bytes individuales** asumiendo ASCII (1 byte = 1 carácter).
 * - En **UTF-8** (el estándar universal de la web), los caracteres con tilde
 *   (`á`, `é`, `ñ`) ocupan **2 bytes**, los símbolos como `€` ocupan **3 bytes**
 *   y los emojis (`🚀`) ocupan **4 bytes**.
 * - Por eso, `strlen("Canción")` devuelve `8` (no `7`!), y `substr("Canción", 0, 6)`
 *   corta el carácter `'ó'` por la mitad produciendo un byte corrupto ``!
 * - En código profesional que procesa nombres de personas, ciudades o textos en
 *   español, usa siempre las funciones **`mb_*`** (`mb_strlen`, `mb_substr`,
 *   `mb_strtolower`, `mb_strtoupper`) para textos de usuario, y usa las funciones
 *   nuevas de PHP 8.0+ (`str_contains`, `str_starts_with`, `str_ends_with`) para
 *   búsquedas exactas de subcadenas.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Normalización de Entradas de Usuario: Limpiar espacios y caracteres invisibles
 *   con `trim()`, unificar capitalización con `mb_strtolower()` o `mb_convert_case()`.
 * - Generación de URLs Amigables (*Slugs*) y Códigos SKU: Transformar
 *   `"Curso de Programación PHP 8!"` en `"curso-de-programacion-php-8"`.
 * - Enmascaramiento y Sanitización de Textos: Ocultar parte de un documento o
 *   escapar caracteres HTML con `htmlspecialchars($txt, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * $texto = "  Ingeniería de Software  ";
 *
 * // 1. Limpieza y transformación Multibyte (UTF-8):
 * $limpio = trim($texto);                         // "Ingeniería de Software"
 * $longitudReal = mb_strlen($limpio, 'UTF-8');    // 22 caracteres (strlen daría 23)
 * $minusculas = mb_strtolower($limpio, 'UTF-8');  // "ingeniería de software"
 * $extracto = mb_substr($limpio, 0, 10, 'UTF-8'); // "Ingeniería"
 *
 * // 2. Funciones modernas de búsqueda (PHP 8.0+):
 * $contiene = str_contains($limpio, 'Software');  // true
 * $empieza  = str_starts_with($limpio, 'Ing');    // true
 * $termina  = str_ends_with($limpio, 'ware');     // true
 *
 * // 3. División y unión de cadenas:
 * $partes = explode(',', 'PHP,SQL,Java');         // ['PHP', 'SQL', 'Java']
 * $unido  = implode(' | ', $partes);              // "PHP | SQL | Java"
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un normalizador de catálogo limpia el título ingresado por un
 * vendedor, genera un resumen truncado sin romper tildes UTF-8 y valida el SKU.
 *
 * function generarResumenSeguro(string $titulo, int $maxCaracteres = 15): string {
 *     $limpio = trim($titulo);
 *     if (mb_strlen($limpio, 'UTF-8') <= $maxCaracteres) {
 *         return $limpio;
 *     }
 *     return rtrim(mb_substr($limpio, 0, $maxCaracteres, 'UTF-8')) . '...';
 * }
 *
 * $tituloOriginal = "  Introducción a la Programación Avanzada  ";
 * echo "Resumen: " . generarResumenSeguro($tituloOriginal, 16) . PHP_EOL;
 * // Salida esperada:
 * // Resumen: Introducción a l...
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - EN PHP 8.0+, NUNCA USES `strpos($a, $b) !== false` SOLO PARA SABER SI CONTIENE
 *   UNA SUBCADENA o SI EMPIEZA POR ELLA: Usa `str_contains($a, $b)`,
 *   `str_starts_with($a, $b)` y `str_ends_with($a, $b)`. Son mucho más legibles
 *   y evitan el clásico bug de olvidar el `!== false`.
 * - SINTAXIS DE INTERPOLACIÓN EN COMILLAS DOBLES (PHP 8.2+):
 *   Usa siempre `"{$variable}"` o `"Hola {$usuario->nombre}"`. La sintaxis
 *   antigua `"${variable}"` (con el signo `$` afuera de las llaves) fue
 *   **deprecada en PHP 8.2** y se eliminará en PHP 9.
 * - CUIDADO CON `explode(',', '')`: Si pasas una cadena vacía `""` a `explode(',', '')`,
 *   ¡NO devuelve un arreglo vacío `[]`, sino `['']` (un arreglo con 1 elemento
 *   vacío)! Verifica antes `$cadena === '' ? [] : explode(',', $cadena)`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Demostración de `strlen` vs `mb_strlen`: Compara la longitud en bytes y en
 *    caracteres UTF-8 de las cadenas `"Bogotá"`, `" pingüino "` y `"¡Éxito! 🚀"`.
 * 2. Búsquedas expresivas en PHP 8: Usa `str_starts_with`, `str_ends_with` y
 *    `str_contains` para verificar si una URL comienza con `"https://"`, contiene
 *    `".gob."` y termina en `".pdf"`.
 * 3. Limpieza y formateo de nombre propio: Convierte `"  jUAN cARLOS pÉREZ  "`
 *    en `"Juan Carlos Pérez"` usando `trim()` y `mb_convert_case(..., MB_CASE_TITLE, 'UTF-8')`.
 *
 * [Intermedio]
 * 4. Generador de *Slugs* para URLs: Crea `generarSlug(string $titulo): string`
 *    que reemplace vocales con tilde y `'ñ'` por su equivalente ASCII (`strtr`),
 *    convierta a minúsculas y cambie espacios por guiones `-`.
 * 5. Parseo seguro de línea CSV sin el bug de cadena vacía: Implementa
 *    `dividirListaComas(string $linea): array` que devuelva `[]` si la línea
 *    está en blanco y limpie los espacios de cada elemento al dividir con `explode`.
 * 6. Enmascarador de tarjetas y correos: Usa `str_repeat()`, `substr()` / `mb_substr()`
 *    y `str_pad()` para ocultar un número de documento dejando visibles solo los
 *    últimos 3 caracteres (`"******789"`).
 * 7. Extractor de dominio y usuario de correo: Usando `explode('@', $email, 2)`
 *    o `strrchr()`, separa de forma segura la parte local y el dominio de un email.
 *
 * [Senior / Producción]
 * 8. Truncador inteligente por palabras completas (`truncarPorPalabras`):
 *    Corta un texto largo a máximo `$limite` caracteres UTF-8 sin partir la
 *    última palabra por la mitad y añadiendo `'…'` al final.
 * 9. Sanitizador HTML y Prevención de XSS: Implementa una función `escaparHtml(string $entrada): string`
 *    usando `htmlspecialchars($entrada, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')` y
 *    demuestra cómo neutraliza un ataque `<script>alert("XSS")</script>`.
 * 10. Motor de Plantillas Ligero (*Template Engine*): Crea una función
 *     `renderizarPlantilla(string $plantilla, array $variables): string` que
 *     reemplace marcadores `{{clave}}` por sus valores escapados usando `strtr()`,
 *     evitando reemplazos recursivos si un valor contiene `{{otra_clave}}`.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
