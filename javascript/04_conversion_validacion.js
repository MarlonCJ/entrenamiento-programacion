'use strict';

/*
 * ============================================================================
 * TEMA 04: CONVERSIÓN SEGURA, COERCIÓN IMPLÍCITA Y VALIDACIÓN DEFENSIVA
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Coerción en JavaScript)
 * ----------------------------------------------------------------------------
 * La coerción implícita de tipos en JavaScript es una de las mayores fuentes de
 * bugs en producción si no se dominan sus reglas exactas:
 *
 * 1) **El operador `+` prefiere concatenar si CUALQUIERA de los lados es `string`**:
 *    - `"100" + 20` -> `"10020"` (convierte `20` a `"20"` y concatena!).
 *    - `"100" - 20` -> `80` (como `-` solo existe para números, convierte `"100"` a `100`).
 * 2) **`Number(x)` vs `Number.parseInt(x, 10)` vs `Number.parseFloat(x)`**:
 *    - `Number("42px")` -> `NaN` (Estricto: falla si hay cualquier carácter no numérico).
 *    - `Number.parseInt("42px", 10)` -> `42` (Permisivo: lee dígitos iniciales e ignora el resto!).
 *    - ¡Ojo con `Number("")`, `Number("   ")`, `Number(null)` y `Number(false)`!:
 *      Todos ellos devuelven **`0`**! En cambio, `Number.parseInt("", 10)` devuelve `NaN`.
 * 3) **El Peligro de `isNaN(x)` global vs `Number.isNaN(x)` (ES6+)**:
 *    - La función global antigua `isNaN("hola")` convierte primero el argumento
 *      a número y da `true`, pero `isNaN("")` o `isNaN(null)` dan `false`!
 *    - Usa SIEMPRE **`Number.isNaN(x)`** y **`Number.isFinite(x)`**, que nunca
 *      hacen coerción implícita.
 * 4) **Los 8 Valores *Falsy* Exactos de JavaScript**:
 *    Solo estos 8 valores se convierten en `false` dentro de `Boolean(x)` o `if (x)`:
 *    `false`, `0`, `-0`, `0n`, `""` (string vacío), `null`, `undefined` y `NaN`.
 *    ¡Todo lo demás es *Truthy* (incluyendo `"0"`, `"false"`, `[]` y `{}`)!
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Validación de Formularios y Query Params HTTP (`?cantidad=5`): Donde todo
 *   llega como `string` y una cadena vacía `""` no debe convertirse por error en `0`.
 * - Deserialización de Payloads de APIs: Asegurar que los montos sean números
 *   finitos reales (`Number.isFinite(monto) && monto >= 0`) y no `NaN` ni `Infinity`.
 * - Parseo de Variables de Entorno (`process.env`): Convertir `"true"`/`"false"`
 *   y puertos numéricos de forma estricta al arrancar el servidor.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Conversión estricta de string no vacío a número finito:
 * function parsearNumeroEstricto(entrada) {
 *     if (typeof entrada === 'number') {
 *         return Number.isFinite(entrada) ? entrada : null;
 *     }
 *     if (typeof entrada !== 'string' || entrada.trim() === '') {
 *         return null; // Evita que Number("") devuelva 0!
 *     }
 *     const num = Number(entrada);
 *     return Number.isFinite(num) ? num : null;
 * }
 *
 * // 2. Conversión a booleano real para flags de entorno:
 * function parsearBooleanoConfig(valor) {
 *     if (typeof valor === 'boolean') return valor;
 *     const normalizado = String(valor).trim().toLowerCase();
 *     if (['true', '1', 'yes', 'on'].includes(normalizado)) return true;
 *     if (['false', '0', 'no', 'off'].includes(normalizado)) return false;
 *     throw new TypeError(`Valor booleano inválido: ${valor}`);
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Validar y convertir un lote de entradas de stock provenientes de
 * un formulario web, rechazando vacíos, textos con basura y decimales.
 *
 * function validarEnteroPositivo(entrada) {
 *     const num = parsearNumeroEstricto(entrada);
 *     if (num === null || !Number.isInteger(num) || num <= 0) {
 *         throw new TypeError(`Se esperaba un entero positivo, se recibió: ${JSON.stringify(entrada)}`);
 *     }
 *     return num;
 * }
 *
 * for (const prueba of [' 25 ', '', '25unidades', 10.5]) {
 *     try {
 *         console.log(`Válido: ${validarEnteroPositivo(prueba)}`);
 *     } catch (e) {
 *         console.log(`[RECHAZADO] ${e.message}`);
 *     }
 * }
 * // Salida esperada:
 * // Válido: 25
 * // [RECHAZADO] Se esperaba un entero positivo, se recibió: ""
 * // [RECHAZADO] Se esperaba un entero positivo, se recibió: "25unidades"
 * // [RECHAZADO] Se esperaba un entero positivo, se recibió: 10.5
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - NUNCA OLVIDES EL SEGUNDO ARGUMENTO (`radix = 10`) EN `Number.parseInt(str, 10)`:
 *   Explicita siempre la base decimal `10`. Y recuerda que `parseInt("123abc", 10)`
 *   devuelve `123` sin dar error; si quieres validar toda la cadena usa `Number(str)`
 *   combinado con `Number.isInteger()` o una expresión regular `/^\d+$/`.
 * - EL PELIGRO DE `Boolean("false")` Y `Boolean([])`:
 *   - `Boolean("false")` es **`true`** (es un string no vacío!).
 *   - `Boolean([])` y `Boolean({})` son **`true`**! Para saber si un arreglo está
 *     vacío, verifica siempre `arr.length === 0`.
 * - `NaN !== NaN`: `NaN` es el único valor de JavaScript que no es igual a sí
 *   mismo (`NaN === NaN` es `false`). Por eso debes usar `Number.isNaN(valor)` u
 *   `Object.is(valor, NaN)`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Tabla comparativa de conversión numérica: Imprime qué devuelven `Number(x)`,
 *    `Number.parseInt(x, 10)` y `Number.parseFloat(x)` para las entradas:
 *    `"42"`, `"42.8px"`, `""`, `"   "`, `null`, `undefined` y `false`.
 * 2. Demostración de Truthy y Falsy: Crea un arreglo con 12 valores variados
 *    (incluyendo `0`, `"0"`, `""`, `"false"`, `[]`, `{}`, `null`, `NaN`) y
 *    clasifícalos en dos listas según `Boolean(v)`.
 * 3. Diferencia entre `isNaN()` global y `Number.isNaN()`: Demuestra con `"hola"`,
 *    `undefined` y `0 / 0` por qué `Number.isNaN()` es mucho más seguro.
 *
 * [Intermedio]
 * 4. Función `parsearPrecioSeguro(entrada)`: Implementa un conversor que acepte
 *    números o strings numéricos válidos (sin letras ni espacios vacíos), verifique
 *    `Number.isFinite(n) && n >= 0` y redondee a 2 decimales.
 * 5. Validador de rango de puerto TCP: Crea `validarPuertoRed(entrada)` que
 *    convierta y valide que el puerto sea un entero exacto entre `1` y `65535`.
 * 6. Normalizador de teléfonos y códigos con ceros a la izquierda: Explica y
 *    demuestra por qué códigos como `"0045"` o tarjetas de crédito jamás deben
 *    convertirse con `Number()`, e implementa un validador que verifique que
 *    contenga solo dígitos ASCII (`0-9`) conservándolo como `string`.
 * 7. Limpiador de payload de búsqueda HTTP: Dado un objeto de filtros donde
 *    algunos campos vienen como `""`, `"null"`, `"undefined"`, `"15"` o `"true"`,
 *    transfórmalo en un objeto limpio con tipos reales omitiendo los vacíos.
 *
 * [Senior / Producción]
 * 8. Validador Declarativo de Esquemas (Estilo Zod / Joi ligero): Implementa una
 *    función `validarEsquema(datos, esquema)` donde `esquema` define para cada
 *    campo su tipo esperado (`'string'`, `'int'`, `'number'`, `'boolean'`), si es
 *    requerido y una función predicado opcional, devolviendo `{ ok, datos, errores }`.
 * 9. Conversión Segura entre `Number`, `BigInt` y Moneda en Centavos: Implementa
 *    `dolaresACentavosBigInt(montoString)` que reciba `"1234567890.55"` como
 *    string, separe la parte entera y decimal sin pasar por `float` (evitando
 *    pérdida de precisión) y retorne `123456789055n` (`BigInt`).
 * 10. Blindaje contra *Prototype Pollution* y Coerción de Objetos (`Object.create(null)`):
 *     Demuestra qué ocurre cuando alguien pasa un objeto `{ valueOf: () => 1000 }`
 *     o `{ toString: () => "admin" }` a una función que hace coerción implícita, y
 *     cómo la validación estricta de `typeof` lo neutraliza por completo.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
