'use strict';

/*
 * ============================================================================
 * TEMA 03: ENTRADA, SALIDA, FORMATEO INTERNACIONAL (INTL) Y CONSOLA AVANZADA
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de I/O y Formateo en JS)
 * ----------------------------------------------------------------------------
 * En Node.js y navegadores modernos, la comunicación con la consola y el
 * formateo de datos para humanos cuentan con APIs nativas de grado industrial
 * que evitan instalar librerías pesadas:
 *
 * 1) **Niveles Semánticos de Consola y Streams (`stdout` vs `stderr`)**:
 *    - `console.log()` / `console.info()` escriben en **`process.stdout`** (salida
 *      estándar de datos).
 *    - `console.warn()` / `console.error()` escriben en **`process.stderr`**
 *      (flujo de errores, vital para recolectores de logs en Docker/Kubernetes).
 *    - `console.table(datos)`: Renderiza arreglos de objetos como tablas ASCII.
 *    - `console.time('etiqueta')` / `console.timeEnd('etiqueta')`: Mide tiempos.
 * 2) **La API de Internacionalización Nativa (`Intl`)**:
 *    En lugar de concatenar símbolos de moneda o separar miles con expresiones
 *    regulares frágiles, JavaScript incluye el objeto estándar **`Intl`**:
 *    - `Intl.NumberFormat`: Formatea monedas (`USD`, `COP`, `EUR`), porcentajes
 *      y unidades con los separadores exactos de cada país.
 *    - `Intl.DateTimeFormat` y `Intl.ListFormat`: Formatean fechas y listas.
 * 3) **Alineación de Cadenas (`padStart`, `padEnd`) y *Tagged Templates***:
 *    Permiten construir tablas CLI, recibos y sanitizadores de interpolación.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Formateo Financiero Multi-país (`Intl.NumberFormat`): Mostrar `$1,250.50`
 *   para clientes de EE. UU. y `1.250,50 €` para clientes de España sin cambiar
 *   la lógica matemática.
 * - Herramientas CLI en Node.js (`process.argv`, `util.parseArgs`, `readline`):
 *   Leer parámetros de consola y construir reportes alineados con `padStart`/`padEnd`.
 * - Logs Estructurados (JSON Logs para Producción): Emitir una línea JSON por
 *   evento para sistemas como Datadog, CloudWatch o ElasticSearch.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Formateador de moneda reutilizable (Crea la instancia 1 sola vez por rendimiento!):
 * const formatoUsd = new Intl.NumberFormat('en-US', {
 *     style: 'currency',
 *     currency: 'USD',
 * });
 * console.log(formatoUsd.format(1450.5)); // "$1,450.50"
 *
 * // 2. Alineación de columnas de texto con padEnd y padStart:
 * const colConcepto = 'Suscripción Pro'.padEnd(20, ' ');
 * const colCodigo   = String(42).padStart(5, '0'); // "00042"
 *
 * // 3. Lectura interactiva moderna con promesas en Node.js (node:readline/promises):
 * // const rl = require('node:readline/promises').createInterface({
 * //     input: process.stdin, output: process.stdout
 * // });
 * // const respuesta = await rl.question('¿Nombre?: ');
 * // rl.close();
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un generador de extractos financieros formatea una tabla alineada
 * en consola combinando `padEnd`, `padStart` e `Intl.NumberFormat`.
 *
 * const formateadorCop = new Intl.NumberFormat('es-CO', {
 *     style: 'currency',
 *     currency: 'COP',
 *     maximumFractionDigits: 0,
 * });
 *
 * const movimientos = [
 *     { id: 1, concepto: 'Pago Nómina', monto: 4500000 },
 *     { id: 2, concepto: 'Retención Fuente', monto: -350000 },
 * ];
 *
 * for (const mov of movimientos) {
 *     const idTxt = `#${String(mov.id).padStart(3, '0')}`;
 *     const conceptoTxt = mov.concepto.padEnd(18, ' ');
 *     const montoTxt = formateadorCop.format(mov.monto).padStart(14, ' ');
 *     console.log(`${idTxt} | ${conceptoTxt} | ${montoTxt}`);
 * }
 * // Salida esperada (varía el espacio de moneda según versión de ICU):
 * // #001 | Pago Nómina        |   $ 4.500.000
 * // #002 | Retención Fuente   |    -$ 350.000
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - NO INSTANCIES `new Intl.NumberFormat(...)` DENTRO DE UN BUCLE:
 *   Inicializar la configuración regional (*locale*) de `Intl` es costoso en CPU.
 *   Crea la instancia una sola vez como constante fuera del bucle y reutiliza
 *   su método `.format(valor)`.
 * - CUIDADO CON `(10.555).toFixed(2)`: `.toFixed()` devuelve un **`string`**
 *   (no un `number`) y debido a la representación binaria de punto flotante,
 *   `(1.005).toFixed(2)` puede devolver `"1.00"` en lugar de `"1.01"`.
 * - EN PRODUCCIÓN BACKEND, PREFIERE LOGS ESTRUCTURADOS EN JSON SOBRE `console.log`
 *   DE TEXTO LIBRE: Una línea `JSON.stringify({ timestamp, level, msg, traceId })`
 *   permite indexar y buscar errores instantáneamente en la nube.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Recibo alineado con `padStart` y `padEnd`: Crea una función que reciba
 *    `id`, `producto` y `precio` y devuelva una fila de tabla donde el ID tenga
 *    6 dígitos con ceros a la izquierda (`000123`) y el nombre ocupe 20 espacios.
 * 2. Formateo de monedas e impuestos con `Intl.NumberFormat`: Formatea el monto
 *    `12890.5` en dólares (`en-US`, `USD`), euros (`es-ES`, `EUR`) y un porcentaje
 *    `0.195` con `style: 'percent'`.
 * 3. Uso de `console.table` y niveles de consola: Construye un arreglo de 3
 *    servidores con sus métricas y muéstralo con `console.table()`.
 *
 * [Intermedio]
 * 4. Formateador de tamaños de archivo legibles (`formatearBytes(bytes)`):
 *    Convierte un número de bytes (`0`, `512`, `1536`, `10485760`) a su unidad
 *    más adecuada (`B`, `KB`, `MB`, `GB`) con 2 decimales.
 * 5. Listas en lenguaje natural con `Intl.ListFormat`: Usa `new Intl.ListFormat('es', { style: 'long', type: 'conjunction' })`
 *    para convertir `['PHP', 'Java', 'JavaScript']` en `"PHP, Java y JavaScript"`.
 * 6. Procesador de argumentos de línea de comandos (`process.argv`): Implementa
 *    `parsearBanderaCli(args)` que convierta `['--puerto=3000', '--produccion', '--host=0.0.0.0']`
 *    en `{ puerto: '3000', produccion: true, host: '0.0.0.0' }`.
 * 7. Función de entrada con valor por defecto (simulada/interactiva): Crea
 *    `leerOpcion(entradaCruda, valorPorDefecto, opcionesValidas)` que limpie
 *    espacios, aplique el valor por defecto si viene vacío y valide contra la
 *    lista permitida.
 *
 * [Senior / Producción]
 * 8. *Tagged Template Literal* para Sanitización Automática: En JS puedes llamar
 *    a una función como `` sanitizar`Hola ${nombreUsuario}` ``. Implementa la
 *    función *tag* `sanitizar(cadenas, ...valores)` que escape automáticamente
 *    caracteres HTML peligrosos (`<`, `>`, `&`, `"`) en todos los valores interpolados!
 * 9. Logger Estructurado JSON con Niveles y Redacción de Secretos: Crea una
 *    clase o fábrica `crearLogger(servicio)` con métodos `.info(msg, meta)` y
 *    `.error(msg, meta)` que emitan JSON con timestamp ISO-8601 a `stdout`/`stderr`
 *    ocultando cualquier clave llamada `password` o `token` en `meta`.
 * 10. Renderizador Dinámico de Tablas ASCII Auto-ajustables: Implementa una
 *     función que reciba cualquier arreglo de objetos, calcule automáticamente
 *     el ancho máximo de cada columna (entre el encabezado y los valores) y
 *     devuelva el string completo de la tabla con bordes `+---+---+`.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
