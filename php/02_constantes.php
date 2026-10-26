<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 02: CONSTANTES, INMUTABILIDAD, READONLY Y ENUMS (PHP 8.1 / 8.2 / 8.3)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental e Inmutabilidad en PHP)
 * ----------------------------------------------------------------------------
 * Una constante es un identificador cuyo valor queda fijo tras su definición y
 * no puede ser reasignado ni eliminado con `unset()` durante toda la ejecución
 * del script.
 *
 * Modelo Mental de Inmutabilidad en PHP Moderno:
 * 1) **`const` vs `define()`**:
 *    - `const IVA = 0.19;`: Se resuelve en **tiempo de compilación**, soporta
 *      espacios de nombres (`namespace`), puede declararse dentro de clases e
 *      interfaces, y permite tipos explícitos en clases desde PHP 8.3
 *      (`public const float IVA = 0.19;`). Es el estándar preferido.
 *    - `define('NOMBRE', $valor)`: Se evalúa en **tiempo de ejecución**; solo se
 *      usa en archivos de arranque legado cuando el valor proviene de una función
 *      dinámica.
 * 2) **Constantes Mágicas (`__DIR__`, `__FILE__`, `__LINE__`, `__CLASS__`)**:
 *    Son resueltas por el compilador de PHP según la ubicación física del archivo.
 *    `__DIR__` es vital para construir rutas absolutas confiables sin depender
 *    del directorio desde donde se ejecutó el comando `php`.
 * 3) **Propiedades y Clases `readonly` (PHP 8.1 / 8.2) y `enum` (PHP 8.1)**:
 *    Cuando un valor constante pertenece a una instancia (ej. el `$id` de un
 *    pedido creado en tiempo de ejecución), usamos `readonly`. Cuando tenemos un
 *    conjunto cerrado de constantes de dominio (estados, monedas, roles), usamos
 *    `enum` respaldados (*Backed Enums*).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Eliminar "Números Mágicos" y "Strings Mágicos": Reemplazar `if ($intentos > 5)`
 *   y `if ($estado === 'P')` por `MAX_INTENTOS_LOGIN` y `EstadoPedido::Pagado`.
 * - Configuración de Límites Técnicos: Timeouts de HTTP, tamaños máximos de
 *   archivo en bytes (`MAX_UPLOAD_BYTES = 5 * 1024 * 1024`) y versiones de API.
 * - Rutas de Archivos Portables: `require_once __DIR__ . '/config.php';`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Constantes a nivel de archivo / namespace:
 * const VERSION_API = '2.1.0';
 * const TIMEOUT_SEGUNDOS = 30;
 * const MAX_TAMANO_ARCHIVO = 10 * 1024 * 1024; // Expresión constante en compilación
 *
 * // 2. Constantes de clase con visibilidad (PSR-12: UPPER_SNAKE_CASE):
 * final class PoliticaSeguridad {
 *     public const MAX_INTENTOS_FALLIDOS = 5;
 *     public const ROLES_PERMITIDOS = ['ADMIN', 'AUDITOR'];
 * }
 *
 * // 3. Backed Enum (La evolución moderna de las constantes de estado en PHP 8.1+):
 * enum Moneda: string {
 *     case Usd = 'USD';
 *     case Cop = 'COP';
 *     case Eur = 'EUR';
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un calculador de envíos empresarial utiliza constantes de clase
 * con visibilidad explícita y constantes mágicas para auditar el origen del cálculo.
 *
 * final class TarifaEnvioConfig {
 *     public const MONEDA = 'USD';
 *     public const UMBRAL_ENVIO_GRATIS = 100.00;
 *     public const COSTO_BASE_ENVIO = 12.50;
 *     public const IMPUESTO_PORCENTAJE = 0.19;
 * }
 *
 * $subtotalCompra = 80.00;
 * $costoEnvio = ($subtotalCompra >= TarifaEnvioConfig::UMBRAL_ENVIO_GRATIS)
 *     ? 0.00
 *     : TarifaEnvioConfig::COSTO_BASE_ENVIO;
 * $impuesto = $subtotalCompra * TarifaEnvioConfig::IMPUESTO_PORCENTAJE;
 * $total = $subtotalCompra + $costoEnvio + $impuesto;
 *
 * echo sprintf(
 *     "[%s] Subtotal: %.2f | Envío: %.2f | IVA: %.2f | Total: %.2f %s" . PHP_EOL,
 *     basename(__FILE__),
 *     $subtotalCompra,
 *     $costoEnvio,
 *     $impuesto,
 *     $total,
 *     TarifaEnvioConfig::MONEDA
 * );
 * // Salida esperada:
 * // [02_constantes.php] Subtotal: 80.00 | Envío: 12.50 | IVA: 15.20 | Total: 107.70 USD
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - SIEMPRE DECLARA LA VISIBILIDAD EN CONSTANTES DE CLASE (PSR-12):
 *   Escribe `public const MI_CONSTANTE = 1;` o `private const INTERNA = 2;`,
 *   nunca `const MI_CONSTANTE = 1;` sin modificador de acceso.
 * - USA `UPPER_SNAKE_CASE` PARA CONSTANTES: Distingue visualmente de inmediato
 *   una constante (`TASA_IVA`) de una variable o propiedad (`$tasaIva`).
 * - PREFIERE `enum` FRENTE A LISTAS DE CONSTANTES `ESTATUS_*`: En PHP 8.1+, en
 *   lugar de tener `const ESTADO_ACTIVO = 'activo'; const ESTADO_INACTIVO = 'inactivo';`
 *   y recibir `string $estado` en tus funciones, crea un `enum EstadoUsuario: string`
 *   y pide `EstadoUsuario $estado` en la firma del método para tener validación
 *   total de tipos.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Constantes de configuración del sistema: Declara constantes con `const` para
 *    `NOMBRE_SISTEMA`, `PUERTO_HTTP` y `MODO_MANTENIMIENTO` y muéstralas en consola.
 * 2. Expresiones constantes de tiempo y almacenamiento: Define constantes
 *    calculadas a partir de otras constantes: `SEGUNDOS_POR_MINUTO`, `SEGUNDOS_POR_HORA`,
 *    `SEGUNDOS_POR_DIA` y `BYTES_POR_MEGABYTE`.
 * 3. Uso de constantes mágicas: Muestra un mensaje de diagnóstico que imprima
 *    el directorio actual (`__DIR__`), el archivo actual (`__FILE__`), la línea
 *    actual (`__LINE__`) y la versión de PHP (`PHP_VERSION`).
 *
 * [Intermedio]
 * 4. Refactorización de Números Mágicos: Toma un cálculo de nómina que usa
 *    literales sueltos (`0.04`, `0.04`, `1300000`, `162000`) y refactorízalo
 *    usando constantes semánticas en una clase `ParametrosNomina`.
 * 5. Arreglos constantes (`const` arrays): Declara una constante `CODIGOS_HTTP_EXITO = [200, 201, 204]`
 *    y verifica con `in_array($codigo, CODIGOS_HTTP_EXITO, true)` si una respuesta
 *    fue exitosa.
 * 6. Constantes privadas vs públicas en una clase: Crea una clase `ValidadorPassword`
 *    con `public const LONGITUD_MINIMA = 12;` y una constante `private const CARACTERES_PROHIBIDOS`
 *    usada internamente por su método de validación.
 * 7. Verificación dinámica con `defined()` y `constant()`: Demuestra cómo
 *    comprobar si una constante existe por nombre antes de leerla dinámicamente.
 *
 * [Senior / Producción]
 * 8. Evolución a `enum` tipado (PHP 8.1+): Crea un `enum EstadoOrden: string`
 *    con casos `Pendiente`, `Pagada`, `Enviada` y `Cancelada`, e incluye un
 *    método dentro del `enum` llamado `permiteCancelacion(): bool`.
 * 9. Objeto de Configuración Inmutable con `readonly` (PHP 8.1/8.2): Crea una
 *    clase `ConfiguracionBaseDatos` cuyas propiedades (`$host`, `$puerto`,
 *    `$nombreBd`, `$timeoutSegundos`) sean `public readonly` inicializadas en el
 *    constructor, demostrando que garantiza inmutabilidad por instancia.
 * 10. Tabla de tarifas inmutable con cálculo seguro: Diseña una clase `TablaComisiones`
 *     con constantes de clase para tramos y porcentajes que calcule la comisión
 *     exacta de una pasarela de pagos sin usar un solo número mágico en el algoritmo.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
