<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 19: ESPACIOS DE NOMBRES (NAMESPACES), AUTOLOADING PSR-4 Y MODULARIDAD
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Arquitectura Modular en PHP)
 * ----------------------------------------------------------------------------
 * En el PHP antiguo se usaban decenas de llamadas manuales `include` o `require`
 * al inicio de cada archivo, y todas las clases vivían en el espacio global
 * (causando colisiones si dos librerías tenían una clase llamada `User` o `Logger`).
 *
 * En el ecosistema PHP moderno (Composer, Laravel, Symfony, PSR-4):
 * 1) **Espacios de Nombres (`namespace` y `use`)**:
 *    Encapsulan clases, interfaces, traits, enums, funciones y constantes bajo
 *    un prefijo jerárquico (`App\Pagos\Dominio\Factura`), funcionando como
 *    carpetas lógicas que evitan colisiones de nombres.
 * 2) **Estándar de Autocarga PSR-4 (`spl_autoload_register` y Composer)**:
 *    En lugar de escribir `require_once` por cada clase, registras una función
 *    *Autoloader* con `spl_autoload_register()`. Cuando tu código instancia
 *    `new App\Pagos\Factura()`, PHP invoca automáticamente al autoloader
 *    pasándole `'App\Pagos\Factura'`, el autoloader transforma el namespace en
 *    la ruta física `src/Pagos/Factura.php` y carga el archivo **bajo demanda**
 *    (*lazy loading*) solo cuando realmente se necesita!
 * 3) **`require`, `require_once`, `include`, `include_once`**:
 *    - `require` / `require_once`: Lanzan un `Error` fatal si el archivo no
 *      existe (obligatorio para código o configuración crítica).
 *    - `include` / `include_once`: Solo emiten un `Warning` y continúan (usado
 *      rara vez para plantillas opcionales).
 *    - `return [...]` dentro de un archivo requerido: Permite que un archivo de
 *      configuración devuelva un arreglo directamente al asignarlo:
 *      `$config = require __DIR__ . '/config.php';`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Proyectos Profesionales con Composer y PSR-4: Mapear `"App\\": "src/"` en
 *   `composer.json` y requerir únicamente `require_once __DIR__ . '/vendor/autoload.php';`.
 * - Desambiguación con Alias (`use ... as ...`): Cuando un servicio necesita
 *   usar dos clases con el mismo nombre corto de distintos paquetes
 *   (`use App\Dominio\Cliente as ClienteDominio; use Stripe\Customer as ClienteStripe;`).
 * - Archivos de Configuración y Rutas que Retornan Datos (`return [...]`).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Estructura de un archivo con namespace (PSR-12):
 * // <?php
 * // declare(strict_types=1);
 * // namespace App\Facturacion\Servicios;
 * //
 * // use App\Facturacion\Contratos\CalculadoraImpuestoInterface;
 * // use DateTimeImmutable;
 * // use function array_sum;
 * // use const PHP_EOL;
 *
 * // 2. Registro de un Autoloader compatible con PSR-4 sin dependencias externas:
 * spl_autoload_register(function (string $claseCompleta): void {
 *     $prefijo = 'App\\';
 *     $directorioBase = __DIR__ . '/src/';
 *     if (!str_starts_with($claseCompleta, $prefijo)) {
 *         return;
 *     }
 *     $claseRelativa = substr($claseCompleta, strlen($prefijo));
 *     $archivo = $directorioBase . str_replace('\\', DIRECTORY_SEPARATOR, $claseRelativa) . '.php';
 *     if (is_file($archivo)) {
 *         require_once $archivo;
 *     }
 * });
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Demostramos cómo un archivo de configuración en PHP devuelve un
 * arreglo inmutable al hacer `require` y cómo `::class` entrega el nombre
 * calificado completo (*Fully Qualified Class Name - FQCN*).
 *
 * final class ServicioNotificacionesModulo {
 *     public static function obtenerNombreClase(): string {
 *         return self::class;
 *     }
 * }
 *
 * echo "FQCN resuelto: " . ServicioNotificacionesModulo::obtenerNombreClase() . PHP_EOL;
 * // Salida esperada:
 * // FQCN resuelto: ServicioNotificacionesModulo
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - ORDEN ESTRICTO DEL ENCABEZADO SEGÚN PSR-12:
 *   1) `<?php`
 *   2) `declare(strict_types=1);`
 *   3) `namespace MiEmpresa\MiPaquete;`
 *   4) Bloques `use` (primero clases/interfaces, luego `use function`, luego `use const`).
 *   5) Declaración de la clase (una sola clase por archivo con el mismo nombre del archivo).
 * - USA SIEMPRE `MiClase::class` EN LUGAR DE STRINGS LITERALES `'App\MiClase'`:
 *   `MiClase::class` permite que tu IDE refactorice nombres automáticamente y
 *   que herramientas como PHPStan detecten si la clase no existe.
 * - AL USAR `require` O `require_once`, SIEMPRE CONSTRUYE RUTAS ABSOLUTAS CON `__DIR__`:
 *   Nunca escribas `require 'config.php';` (ruta relativa al directorio de
 *   trabajo actual `getcwd()`, que cambia según desde dónde se invoque el script).
 *   Escribe siempre `require __DIR__ . '/config.php';`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Resolución de rutas absolutas de módulo: Construye y normaliza la ruta hacia
 *    un archivo en la misma carpeta y en la carpeta padre usando `__DIR__` y
 *    `dirname(__DIR__)`.
 * 2. Archivo de configuración con `return`: Crea un archivo temporal que contenga
 *    `<?php return ['app' => 'ERP', 'version' => '1.0'];`, cárgalo en una
 *    variable `$config = require $rutaTemp;` y elimina el archivo temporal.
 * 3. Uso de la constante mágica `::class`: Crea dos clases y un diccionario que
 *    mapee `NombreClase::class => 'Descripción del servicio'`.
 *
 * [Intermedio]
 * 4. Implementación de un convertidor PSR-4 (`fqcnARutaArchivo`): Crea una
 *    función que reciba un namespace raíz (`'App\\'`) y una carpeta base (`'/var/www/src/'`),
 *    y convierta `'App\\Ventas\\Dominio\\Factura'` en `'/var/www/src/Ventas/Dominio/Factura.php'`.
 * 5. Autoloader funcional en tiempo real con `spl_autoload_register`: Crea en el
 *    directorio temporal un archivo con una clase `ClaseCargadaDinamicamente`,
 *    registra tu propio autoloader con `spl_autoload_register` e instánciala sin
 *    haber llamado manualmente a `require` antes.
 * 6. Espacio de nombres con bloques o alias: Demuestra cómo resolver el conflicto
 *    entre dos clases o estructuras llamadas `Cliente` (una de facturación y otra
 *    HTTP) mediante alias descriptivos.
 * 7. Inspección de archivos cargados: Usa `get_included_files()` y `class_exists()`
 *    para auditar qué archivos están cargados en el proceso actual de PHP.
 *
 * [Senior / Producción]
 * 8. Contenedor de Servicios Modular (*PSR-11 ContainerInterface* simplificado):
 *    Implementa una clase `ContenedorModulos` con métodos `registrar(string $id, Closure $fabrica): void`
 *    y `obtener(string $id): object` que instancie los servicios perezosamente
 *    (singleton por contenedor) usando `::class` como identificador.
 * 9. Cargador de Configuración Multi-Entorno con Fusión: Crea un cargador que
 *    combine una configuración base con una configuración específica del entorno
 *    (`'desarrollo'` o `'produccion'`) validando que las claves críticas existan.
 * 10. Verificador de Estándar PSR-4 en Directorio: Implementa una función que
 *     analice una lista de nombres de clase y sus rutas relativas para detectar
 *     si alguna viola la correspondencia 1:1 entre Namespace y ruta de carpetas.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
