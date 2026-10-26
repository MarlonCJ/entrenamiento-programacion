'use strict';

/*
 * ============================================================================
 * TEMA 17: MANEJO DE ERRORES, ERROR CAUSE (ES2022+), JERARQUÍAS Y FINALLY
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Excepciones en JS)
 * ----------------------------------------------------------------------------
 * En JavaScript, técnicamente se puede hacer `throw` de cualquier cosa (incluso
 * un string `throw "fallo"` o un número), pero en ingeniería profesional **JAMÁS
 * se lanza algo que no sea una instancia de `Error`** (porque los primitivos no
 * capturan el *Stack Trace* de la pila de llamadas ni tienen `.name` ni `.message`).
 *
 * Evolución Moderna del Manejo de Errores en ECMAScript (ES2022+):
 * 1) **Clases Nativas de Error**:
 *    `Error`, `TypeError` (tipo incorrecto), `RangeError` (valor numérico fuera
 *    de rango), `ReferenceError`, `SyntaxError`, `URIError` y **`AggregateError`**
 *    (contiene múltiples errores en `err.errors`, usado por `Promise.any` o
 *    validadores de lotes).
 * 2) **Encadenamiento de Causas Nativo (`new Error('Mensaje', { cause: err })`, ES2022+)**:
 *    Cuando capturas un error técnico de bajo nivel (ej. fallo de socket o JSON)
 *    y lanzas un error de dominio más claro para la capa superior, pasas
 *    `{ cause: errorOriginal }`. Así preservas intacta toda la cadena de causas
 *    (`err.cause`) para los logs de producción!
 * 3) **Excepciones de Dominio Personalizadas (`class ... extends Error`)**:
 *    Permiten distinguir con `instanceof` un error de negocio esperado (`400/422`)
 *    de un fallo inesperado del servidor (`500`).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Errores de Negocio Tipados: `SaldoInsuficienteError`, `RecursoNoEncontradoError`,
 *   con propiedades estructuradas (`codigo`, `statusCode`, `detalles`).
 * - Traducción de Errores entre Capas con `{ cause }`: Envolver errores de base
 *   de datos o red sin perder la traza original.
 * - Validación Masiva con `AggregateError`: Reportar todos los fallos de un lote
 *   juntos en una sola excepción estándar.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Clase de Error de Dominio personalizada con soporte para { cause }:
 * class DominioError extends Error {
 *     constructor(mensaje, { codigo = 'ERROR_DOMINIO', causa = undefined } = {}) {
 *         super(mensaje, { cause: causa });
 *         this.name = this.constructor.name;
 *         this.codigo = codigo;
 *     }
 * }
 *
 * // 2. try / catch (con parámetro opcional ES2019+) / finally:
 * // try {
 * //     operacionRiesgosa();
 * // } catch (error) {
 * //     throw new DominioError('Fallo al procesar el pago', { causa: error });
 * // } finally {
 * //     liberarConexion(); // Se ejecuta SIEMPRE
 * // }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un servicio de inventario captura un error de parseo de bajo nivel
 * y lo envuelve en un error de dominio preservando `error.cause` (ES2022+).
 *
 * class InventarioError extends Error {
 *     constructor(mensaje, opciones) {
 *         super(mensaje, opciones);
 *         this.name = 'InventarioError';
 *     }
 * }
 *
 * function cargarStockDesdeJson(jsonCrudo) {
 *     try {
 *         return JSON.parse(jsonCrudo);
 *     } catch (err) {
 *         throw new InventarioError('El archivo de stock está corrupto', { cause: err });
 *     }
 * }
 *
 * try {
 *     cargarStockDesdeJson('{ malformado ');
 * } catch (e) {
 *     console.log(`[${e.name}] ${e.message} | Causa raíz: ${e.cause?.name}`);
 * }
 * // Salida esperada:
 * // [InventarioError] El archivo de stock está corrupto | Causa raíz: SyntaxError
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - NUNCA HAGAS `throw 'Mensaje de texto'` (Lanzar Strings): Pierdes el Stack
 *   Trace (línea y archivo donde ocurrió el fallo) y rompes los manejadores que
 *   esperan `err.message` y `err.stack`.
 * - NO ATRAPES ERRORES SOLO PARA SILENCIARLOS (`catch {}` vacío):
 *   Si en un bloque `catch (err)` descubres que el error NO es del tipo que
 *   sabes manejar (ej. esperabas `InventarioError` pero ocurrió un `TypeError`
 *   por un bug de código), **relánzalo siempre con `throw err;`**!
 * - NUNCA PONGAS `return` DENTRO DE UN BLOQUE `finally`: En JavaScript, un
 *   `return` dentro de `finally` **cancela y se traga silenciosamente** cualquier
 *   excepción que se haya lanzado en el `try` o en el `catch`!
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Validación con `TypeError` y `RangeError`: Implementa `aplicarDescuento(precio, porcentaje)`
 *    que lance `TypeError` si los argumentos no son números finitos y `RangeError`
 *    si el porcentaje no está entre `0` y `100`.
 * 2. Parseo JSON resiliente con fallback: Usa `try / catch` (sin variable en el
 *    `catch` si no la necesitas: `catch { ... }`) para implementar
 *    `parsearJsonSeguro(texto, valorPorDefecto = null)`.
 * 3. Liberación de estado con `finally`: Crea un objeto `recurso = { ocupado: false }`
 *    que pase a `ocupado = true` al iniciar una tarea, falle con un `throw` a
 *    mitad de camino y garantice volver a `ocupado = false` en el `finally`.
 *
 * [Intermedio]
 * 4. Jerarquía de Errores de Negocio: Crea `AppError` como base y dos subclases:
 *    `EntidadNoEncontradaError` (`statusCode = 404`) y `ReglaNegocioError`
 *    (`statusCode = 422`), asignando `this.name = this.constructor.name`.
 * 5. Encadenamiento con `{ cause }` e inspección de la cadena completa: Crea una
 *    función `obtenerCadenaDeCausas(error)` que recorra `let actual = error; while (actual) { ... actual = actual.cause; }`
 *    y devuelva la lista de mensajes desde el error más externo hasta la causa raíz.
 * 6. Re-lanzamiento selectivo (*Selective Catch*): En un bloque `catch (err)`,
 *    maneja únicamente las instancias de `ReglaNegocioError` (`err instanceof ReglaNegocioError`)
 *    y relanza con `throw err` cualquier otro error inesperado.
 * 7. Uso de `AggregateError` (ES2021+): Valida los 4 campos de un pedido; si
 *    fallan varios, acumula todas las instancias de `Error` en un arreglo y
 *    lanza un único `new AggregateError(errores, 'Validación de pedido fallida')`.
 *
 * [Senior / Producción]
 * 8. El Peligro de `return` en `finally`: Escribe una demostración controlada
 *    de cómo un `return` dentro de `finally` suprime una excepción lanzada en
 *    `try`, y documéntalo como antipatrón prohibido.
 * 9. Patrón Funcional `Result` (`{ ok: true, valor } | { ok: false, error }`):
 *    Implementa un envoltorio `intentarEjecutar(fn)` que capture cualquier
 *    excepción y la transforme en un objeto resultado tipado para flujos donde
 *    se prefiere manejo explícito de errores sin `try/catch` en el llamador.
 * 10. Serializador Seguro de Errores para Logs y APIs (`serializarError(err)`):
 *     Dado que `JSON.stringify(new Error('fallo'))` devuelve `"{}"` (porque
 *     `message` y `stack` no son enumerables!), implementa un serializador que
 *     extraiga `name`, `message`, `codigo`, `stack` y serialice recursivamente
 *     `cause` y `errors` (si es `AggregateError`).
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
