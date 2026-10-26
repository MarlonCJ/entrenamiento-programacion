<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 08: BITWISE, TERNARIO, COALESCENCIA NULA (??), NULLSAFE (?->) Y PRECEDENCIA
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en PHP 8.x)
 * ----------------------------------------------------------------------------
 * Este tema reúne los operadores expresivos y de bajo nivel más importantes de
 * PHP moderno:
 *
 * 1) **Operador de Coalescencia Nula (`??`, PHP 7+) vs Elvis (`?:`)**:
 *    - `$a ?? $b`: Devuelve `$a` si existe y **NO es `null`** (no lanza warning
 *      si `$a` es una clave de arreglo inexistente); de lo contrario devuelve `$b`.
 *    - `$a ?: $b` (Elvis / Ternario corto): Devuelve `$a` si es *truthy* (distinto
 *      de `false`, `0`, `""`, `"0"`, `[]`, `null`); de lo contrario devuelve `$b`.
 *    - ¡Diferencia vital!: Si `$descuento = 0`, `$descuento ?? 10` devuelve `0`
 *      (correcto), pero `$descuento ?: 10` devuelve `10` (porque `0` es *falsy*!).
 * 2) **Operador Nullsafe (`?->`, PHP 8.0+)**:
 *    `$pais = $orden?->getCliente()?->getDireccion()?->pais;`
 *    Si cualquiera de los eslabones devuelve `null`, toda la cadena hace
 *    cortocircuito inmediatamente y evalúa a `null` sin lanzar error fatal.
 * 3) **Operadores Bit a Bit (*Bitwise*: `&`, `|`, `^`, `~`, `<<`, `>>`)**:
 *    Operan directamente sobre los bits de un `int`. Son usados extensivamente
 *    en la biblioteca estándar de PHP para combinar banderas de configuración
 *    (*Bitmasks*), como `json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)`
 *    o `error_reporting(E_ALL & ~E_DEPRECATED)`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Banderas de Configuración y Permisos Unix (*Bitmasks*): Almacenar múltiples
 *   permisos (`LEER = 1`, `ESCRIBIR = 2`, `ELIMINAR = 4`, `PUBLICAR = 8`) en un
 *   solo entero y verificarlos en $O(1)$ con `($permisos & LEER) !== 0`.
 * - Navegación Segura de Grafos de Objetos con `?->` + `??`:
 *   `$moneda = $usuario?->getPreferencias()?->getMoneda() ?? 'USD';`
 * - Combinación de Opciones Nativas de PHP: `LOCK_EX | LOCK_NB` en `flock()`,
 *   `JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE` en `json_encode()`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Máscaras de bits (Potencias de 2 usando desplazamiento 1 << n):
 * const PERMISO_LECTURA   = 1 << 0; // 1 (0001 en binario)
 * const PERMISO_ESCRITURA = 1 << 1; // 2 (0010 en binario)
 * const PERMISO_BORRADO   = 1 << 2; // 4 (0100 en binario)
 *
 * $rolEditor = PERMISO_LECTURA | PERMISO_ESCRITURA; // Activa ambos bits (0011 = 3)
 * $puedeEscribir = ($rolEditor & PERMISO_ESCRITURA) !== 0; // true
 * $rolSinEscritura = $rolEditor & ~PERMISO_ESCRITURA; // Apaga el bit de escritura
 *
 * // 2. Coalescencia nula encadenada y Nullsafe (PHP 8.0+):
 * // $nombre = $_POST['nombre'] ?? $_GET['nombre'] ?? 'Invitado';
 * // $ciudad = $pedido?->cliente?->direccion?->ciudad ?? 'Sin ciudad';
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un sistema de auditoría de permisos utiliza máscaras de bits para
 * gestionar permisos de usuario de forma ultrarrápida y navega un perfil
 * opcional con el operador `?->` de PHP 8.
 *
 * final class Permisos {
 *     public const VER      = 1 << 0; // 1
 *     public const CREAR    = 1 << 1; // 2
 *     public const EDITAR   = 1 << 2; // 4
 *     public const ELIMINAR = 1 << 3; // 8
 * }
 *
 * $mascaraUsuario = Permisos::VER | Permisos::CREAR; // 3 (0011)
 * $mascaraUsuario |= Permisos::EDITAR;               // Agrega EDITAR -> 7 (0111)
 *
 * $tieneEditar   = ($mascaraUsuario & Permisos::EDITAR) !== 0;
 * $tieneEliminar = ($mascaraUsuario & Permisos::ELIMINAR) !== 0;
 *
 * echo sprintf(
 *     "Máscara: %04b (%d) | ¿Edita?: %s | ¿Elimina?: %s" . PHP_EOL,
 *     $mascaraUsuario,
 *     $mascaraUsuario,
 *     $tieneEditar ? 'SÍ' : 'NO',
 *     $tieneEliminar ? 'SÍ' : 'NO'
 * );
 * // Salida esperada:
 * // Máscara: 0111 (7) | ¿Edita?: SÍ | ¿Elimina?: NO
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - EN PHP 8.0+, ANIDAR OPERADORES TERNARIOS SIN PARÉNTESIS ES UN ERROR FATAL:
 *   En versiones antiguas de PHP, el ternario `? :` era asociativo por la
 *   izquierda (al revés que todos los demás lenguajes!), produciendo bugs
 *   incomprensibles. En PHP 8, si anidas un ternario debes poner paréntesis
 *   explícitos, o mejor aún, usar **`match`** (Tema 09).
 * - CUIDADO CON LA PRECEDENCIA DE `&` Y `|` FRENTE A `===`:
 *   Escribir `if ($mascara & Permisos::VER === 0)` evalúa primero `Permisos::VER === 0`!
 *   Envuelve SIEMPRE la operación bit a bit entre paréntesis:
 *   `if (($mascara & Permisos::VER) !== 0)`.
 * - NO USES `?->` EN EL LADO IZQUIERDO DE UNA ASIGNACIÓN:
 *   `$usuario?->perfil->nombre = 'Ana';` no es válido porque `?->` es de solo lectura.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Comparación práctica entre `??` y `?:`: Declara un arreglo de producto con
 *    `['stock' => 0, 'descuento' => null, 'etiqueta' => '']` y demuestra qué
 *    devuelve `??` frente a `?:` para cada una de las 3 claves.
 * 2. Operaciones básicas de bits: Muestra en binario (`sprintf('%08b', $n)`) el
 *    resultado de `12 & 10`, `12 | 10`, `12 ^ 10`, `3 << 2` y `16 >> 2`.
 * 3. Paridad y potencias de 2 con Bitwise: Implementa `esImpar(int $n): bool`
 *    usando `($n & 1) === 1` y `esPotenciaDeDos(int $n): bool` usando
 *    `$n > 0 && ($n & ($n - 1)) === 0`.
 *
 * [Intermedio]
 * 4. Gestor completo de Permisos con Bitmask: Crea una clase `GestorPermisos`
 *    con métodos `conceder(int $mascara, int $permiso): int`,
 *    `revocar(int $mascara, int $permiso): int`, `alternar(int $mascara, int $permiso): int`
 *    (con XOR `^`) y `tienePermiso(int $mascara, int $permiso): bool`.
 * 5. Navegación segura con `?->` y `??`: Modela las clases `Empresa`, `Departamento`
 *    y `Gerente` (donde el departamento o el gerente pueden ser `null`) y obtén
 *    el correo del gerente en una sola línea segura con `?->` y `??`.
 * 6. Combinación de banderas nativas en `json_encode`: Demuestra cómo combinar
 *    `JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES` usando
 *    el operador bitwise OR `|`.
 * 7. Precedencia explícita con paréntesis: Corrige tres expresiones ambiguas
 *    que mezclan `+`, `<<`, `&`, `===` y `??` colocando paréntesis claros y
 *    documentando el orden de evaluación.
 *
 * [Senior / Producción]
 * 8. Empaquetado y desempaquetado de color RGB / IPv4 en un entero de 32 bits:
 *    Implementa `empaquetarRgb(int $r, int $g, int $b): int` usando `<<` y `|`,
 *    y `desempaquetarRgb(int $color): array` usando `>>` y `& 0xFF`.
 * 9. Cifrado simétrico ligero de ofuscación con XOR (`^`): Demuestra la
 *    propiedad involutiva del XOR (`(A ^ K) ^ K === A`) implementando una función
 *    que aplique XOR byte por byte a una cadena con una clave repetida y luego
 *    la recupere íntegramente.
 * 10. Evaluador de Feature Flags por Entorno y Rol: Combina máscaras de bits de
 *     características habilitadas, operador `?->` sobre el contexto del usuario
 *     actual y coalescencia nula `??` para decidir si una funcionalidad beta
 *     está activa para una petición dada.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
