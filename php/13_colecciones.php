<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 13: ARREGLOS ASOCIATIVOS (MAPAS O(1)), SETS POR CLAVE Y COLECCIONES SPL
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Tablas Hash en PHP)
 * ----------------------------------------------------------------------------
 * En PHP, un arreglo asociativo (`['id' => 10, 'nombre' => 'Ana']`) es una
 * **Tabla Hash Ordenada** altamente optimizada en C:
 * - **Acceso, inserción y borrado por clave en $O(1)$**: Consultar `$mapa[$clave]`
 *   o `isset($mapa[$clave])` calcula el hash de la clave en tiempo constante,
 *   sin importar si el arreglo tiene 10 o 1,000,000 de elementos.
 * - **Simulación de Conjuntos (`Set` en $O(1)$) usando las Claves del Arreglo**:
 *   En lugar de guardar elementos únicos en una lista y usar `in_array($x, $lista, true)`
 *   (que es una búsqueda lineal lenta **$O(n)$**!), los ingenieros PHP Senior
 *   guardan los elementos como **claves**: `$set[$x] = true;` (o usan `array_flip($lista)`)
 *   y consultan con `isset($set[$x])` en **$O(1)$** instantáneo!
 * - **Mapas con Objetos como Claves (`SplObjectStorage` y `WeakMap`)**:
 *   Los arreglos nativos de PHP solo aceptan `int` o `string` como claves. Si
 *   necesitas usar un **objeto** como clave de un mapa o conjunto, PHP ofrece
 *   `SplObjectStorage` y, desde PHP 8.0+, **`WeakMap`** (que no impide que el
 *   Garbage Collector libere el objeto cuando ya no se usa en ningún otro lugar).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Indexación rápida de registros de BD (`array_column`): Convertir una lista
 *   de filas `[['id' => 5, 'nombre' => 'A'], ...]` en un diccionario indexado
 *   por `'id'` con `array_column($filas, null, 'id')` para búsquedas en $O(1)$.
 * - Operaciones de Conjuntos Ultrarrápidas (`array_intersect_key`, `array_diff_key`):
 *   Encontrar permisos comunes o faltantes entre dos listas grandes en tiempo lineal.
 * - Conteo de frecuencias instantáneo con `array_count_values($lista)`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Diferencia crítica: isset() vs array_key_exists()
 * $registro = ['nombre' => 'Ana', 'telefono' => null];
 * isset($registro['telefono']);            // false (porque su valor es null!)
 * array_key_exists('telefono', $registro); // true  (la clave SÍ existe en el mapa)
 *
 * // 2. Indexar una lista de registros por su clave primaria en 1 línea:
 * $usuarios = [
 *     ['id' => 101, 'email' => 'ana@test.com'],
 *     ['id' => 102, 'email' => 'luis@test.com'],
 * ];
 * $porId = array_column($usuarios, null, 'id'); // [101 => [...], 102 => [...]]
 *
 * // 3. Convertir lista a Set O(1) con array_flip:
 * $rolesPermitidosSet = array_flip(['ADMIN', 'EDITOR', 'AUDITOR']);
 * $tieneAcceso = isset($rolesPermitidosSet['EDITOR']); // Búsqueda en O(1)
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un cruce de inventario indexa el catálogo de productos por SKU
 * usando `array_column` para enriquecer un pedido en tiempo $O(1)$ por ítem sin
 * hacer bucles anidados.
 *
 * $catalogo = [
 *     ['sku' => 'PROD-1', 'nombre' => 'Monitor 27"', 'precio' => 250.0],
 *     ['sku' => 'PROD-2', 'nombre' => 'Teclado Mecánico', 'precio' => 85.0],
 * ];
 * $catalogoPorSku = array_column($catalogo, null, 'sku');
 *
 * $skusSolicitados = ['PROD-2', 'PROD-999'];
 * foreach ($skusSolicitados as $sku) {
 *     if (isset($catalogoPorSku[$sku])) {
 *         $p = $catalogoPorSku[$sku];
 *         echo "Encontrado {$sku}: {$p['nombre']} (\${$p['precio']})" . PHP_EOL;
 *     } else {
 *         echo "No existe SKU: {$sku}" . PHP_EOL;
 *     }
 * }
 * // Salida esperada:
 * // Encontrado PROD-2: Teclado Mecánico ($85)
 * // No existe SKU: PROD-999
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - ¡CUIDADO CON LA CONVERSIÓN AUTOMÁTICA DE CLAVES EN ARREGLOS DE PHP!:
 *   En un `array` de PHP, una clave string que represente un entero decimal
 *   válido (ej. `"42"`) se convierte automáticamente a `int(42)`! Sin embargo,
 *   `"042"` (con cero a la izquierda) se conserva como `string("042")`. Además,
 *   usar `true` como clave se convierte en `1`, `false` en `0` y `null` en `""`.
 * - `array_merge($a, $b)` VS OPERADOR `+` (`$a + $b`) VS SPREAD `[...$a, ...$b]`:
 *   - En claves **string**: `$a + $b` conserva el valor de la **izquierda** (`$a`),
 *     mientras que `array_merge($a, $b)` y `[...$a, ...$b]` sobrescriben con el
 *     valor de la **derecha** (`$b`).
 *   - En claves **numéricas**: `array_merge` renumera desde `0`, mientras que
 *     `$a + $b` preserva las claves numéricas originales.
 * - CUÁNDO USAR `array_key_exists` EN LUGAR DE `isset`: En un endpoint `PATCH`
 *   donde el cliente envía `{"telefono": null}` para borrar su teléfono,
 *   `isset($payload['telefono'])` dará `false`, ignorando la petición! Debes
 *   usar `array_key_exists('telefono', $payload)` para saber que la clave vino
 *   en el JSON.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Diccionario de configuración y `isset` vs `array_key_exists`: Crea un
 *    arreglo asociativo con una clave cuyo valor sea `null` y demuestra la
 *    diferencia exacta entre `isset()` y `array_key_exists()`.
 * 2. Conteo de frecuencias con `array_count_values()`: Dada una lista de códigos
 *    de estado HTTP (`[200, 404, 200, 500, 200, 404]`), obtén cuántas veces se
 *    repitió cada código.
 * 3. Extracción e indexación con `array_column()`: De una lista de clientes,
 *    extrae primero un arreglo simple solo con los correos, y luego un mapa
 *    asociativo `id => nombre`.
 *
 * [Intermedio]
 * 4. Conjunto (`Set`) en $O(1)$ con `array_flip()`: Dadas dos listas de correos
 *    (registrados vs dados de baja), usa `array_flip()` y `array_diff_key()`
 *    para obtener los correos activos sin usar `in_array()`.
 * 5. Comparativa de fusión de mapas (`array_merge` vs `+` vs `[...$a, ...$b]`):
 *    Demuestra con dos arreglos de opciones cómo actúa cada uno cuando existen
 *    claves string repetidas.
 * 6. Agrupación asociativa de registros (`groupBy`): Crea una función
 *    `agruparPorClave(array $registros, string $clave): array` que agrupe una
 *    lista de productos por su `'categoria'`.
 * 7. Ordenamiento de diccionarios (`asort`, `arsort`, `ksort`, `uksort`):
 *    Ordena un mapa de `vendedor => ventas` de mayor a menor venta conservando
 *    las claves asociativas (`arsort`), y luego por orden alfabético de vendedor (`ksort`).
 *
 * [Senior / Producción]
 * 8. Uso de `WeakMap` para Caché de Metadatos de Objetos (PHP 8.0+): Crea una
 *    instancia de `WeakMap`, asocia metadatos calculados a un objeto `$pedido`,
 *    verifica que `count($weakMap)` es `1`, haz `unset($pedido)` y comprueba
 *    que `count($weakMap)` baja automáticamente a `0` sin fugas de memoria.
 * 9. Índice Invertido de Búsqueda en Memoria: Dado un arreglo de artículos
 *    (`id`, `titulo`), construye un mapa asociativo `$palabra => [$id1 => true, ...]`
 *    que permita buscar qué artículos contienen dos palabras dadas en $O(1)$
 *    usando `array_intersect_key()`.
 * 10. Procesador de `PATCH` parcial: Implementa `aplicarPatchCliente(array $actual, array $cambios): array`
 *     que use `array_key_exists` sobre una lista blanca de campos editables para
 *     permitir tanto actualizar valores como limpiar campos anulables con `null`.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
