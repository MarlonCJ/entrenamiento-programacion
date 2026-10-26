'use strict';

/*
 * ============================================================================
 * TEMA 01: VARIABLES, TIPOS PRIMITIVOS VS REFERENCIAS Y MOTOR V8 (STACK / HEAP)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y Motor V8 / ECMAScript)
 * ----------------------------------------------------------------------------
 * En JavaScript moderno (ES6+ / Node.js / V8), las variables son enlaces
 * (*bindings*) que apuntan a valores en memoria. Comprender cómo el motor V8
 * almacena y gestiona estos valores distingue a un desarrollador Senior:
 *
 * 1) **`const` vs `let` vs `var` y la Temporal Dead Zone (TDZ)**:
 *    - `const`: Crea un enlace inmutable (no se puede reasignar). Es la opción
 *      por defecto para el 95% de las declaraciones.
 *    - `let`: Crea un enlace reasignable con alcance de bloque (`{ ... }`),
 *      usado para contadores, acumuladores o estados que cambian.
 *    - Ambos (`const` y `let`) están protegidos por la **TDZ (*Temporal Dead Zone*)**:
 *      si intentas leerlos antes de la línea donde se declaran, el motor lanza
 *      inmediatamente un `ReferenceError` (a diferencia de `var`, que hacía
 *      *hoisting* inicializándose a `undefined` y tenía alcance de función, por
 *      lo que `var` está prohibido en código moderno).
 * 2) **Los 7 Tipos Primitivos (Inmutables, por Valor) vs Objetos (Por Referencia en el Heap)**:
 *    - **7 Primitivos**: `string`, `number` (IEEE 754 de 64 bits), `bigint`
 *      (enteros de precisión arbitraria como `9007199254740993n`), `boolean`,
 *      `undefined` (variable no inicializada o propiedad ausente), `null`
 *      (ausencia intencional de valor) y `symbol` (identificadores únicos).
 *    - **Objetos / Referencias (`object`, `array`, `function`, `Map`, `Set`)**:
 *      Viven en el *Heap*. La variable guarda un puntero de referencia.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Distinguir Semánticamente `null` de `undefined` en APIs: Usar `null` cuando
 *   un campo existe pero está vacío intencionalmente (`fechaBaja: null`) y dejar
 *   `undefined` para propiedades no enviadas.
 * - Manejo de IDs de 64 bits (`BigInt`): Cuando una base de datos (PostgreSQL
 *   `BIGINT` o IDs de Twitter/Snowflake) envía números mayores a
 *   `Number.MAX_SAFE_INTEGER` ($2^{53} - 1 = 9,007,199,254,740,991$), usar
 *   `BigInt` o `string` para que el motor no redondee ni corrompa los últimos dígitos.
 * - Intercambio y Extracción Limpia con Destructuring (`[a, b] = [b, a]`).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * const idTransaccion = 9007199254740999n; // bigint (supera MAX_SAFE_INTEGER)
 * const monto = 1_250_500.75;              // number con separador visual (_)
 * const moneda = 'USD';                    // string
 * const esVerificado = true;               // boolean
 * const fechaCancelacion = null;           // null (ojo: typeof null === 'object'!)
 * let intentosProcesamiento = 0;           // let porque cambiará de valor
 *
 * // Intercambio sin variable temporal (Array Destructuring):
 * let origen = 'Bogotá';
 * let destino = 'Madrid';
 * [origen, destino] = [destino, origen];
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un inspector de diagnóstico de pagos clasifica valores primitivos y
 * corrige el famoso bug histórico de `typeof null === 'object'`.
 *
 * function obtenerTipoReal(valor) {
 *     if (valor === null) return 'null';
 *     if (Array.isArray(valor)) return 'array';
 *     return typeof valor;
 * }
 *
 * const muestra = {
 *     id: 1024n,
 *     total: 99.95,
 *     cupon: null,
 *     items: ['SKU-1'],
 * };
 *
 * console.log(
 *     `id: ${obtenerTipoReal(muestra.id)} | total: ${obtenerTipoReal(muestra.total)} | ` +
 *     `cupon: ${obtenerTipoReal(muestra.cupon)} | items: ${obtenerTipoReal(muestra.items)}`
 * );
 * // Salida esperada:
 * // id: bigint | total: number | cupon: null | items: array
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - EL BUG HISTÓRICO MÁS FAMOSO DE JS (`typeof null === 'object'`):
 *   Desde la primera versión de JavaScript en 1995, `typeof null` devuelve
 *   `'object'`. Antes de verificar si una variable es un objeto real, comprueba
 *   siempre: `typeof x === 'object' && x !== null`.
 * - CUIDADO CON `Number.MAX_SAFE_INTEGER`: En JavaScript todo `number` es un
 *   float de 64 bits. Por eso `9007199254740992 === 9007199254740993` da
 *   `true`! Verifica siempre con `Number.isSafeInteger(n)` o usa `BigInt`.
 * - ACTIVA `'use strict'` (O USA ES MODULES): Impide crear variables globales
 *   por accidente si escribes mal el nombre de una variable al asignarla.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Ficha de telemetría: Declara con `const` y `let` las métricas de un nodo
 *    (`hostname`, `memoriaMb`, `activo`, `ultimoError = null`, `peticionesAtendidas = 0`),
 *    incrementa las peticiones y muestra un resumen con *Template Literals*.
 * 2. Intercambio con destructuring: Declara dos variables `servidorPrimario` y
 *    `servidorRespaldo`, intercambia sus valores en una sola línea con
 *    `[a, b] = [b, a]` y muéstralos.
 * 3. Separadores numéricos y límites: Imprime `Number.MAX_SAFE_INTEGER`, declara
 *    un presupuesto usando guiones bajos (`25_000_000`) y verifica si es un
 *    entero seguro con `Number.isSafeInteger()`.
 *
 * [Intermedio]
 * 4. Detector universal de tipos (`detectarTipoExacto(valor)`): Crea una función
 *    que distinga con precisión entre `'null'`, `'array'`, `'date'`, `'nan'`
 *    (`Number.isNaN`), y los tipos de `typeof`.
 * 5. Demostración de pérdida de precisión vs `BigInt`: Muestra en consola qué
 *    ocurre al sumar `9007199254740991 + 2` con `number` frente a sumar
 *    `9007199254740991n + 2n` con `BigInt`.
 * 6. Paso por valor vs paso por referencia: Demuestra que reasignar o modificar
 *    un primitivo copiado (`let b = a; b += 10;`) no altera `a`, mientras que
 *    mutar una propiedad de un objeto copiado (`const obj2 = obj1; obj2.saldo = 0;`)
 *    sí altera `obj1`.
 * 7. Uso de `Symbol` para claves únicas sin colisión: Crea dos `Symbol('id')`,
 *    comprueba que `Symbol('id') !== Symbol('id')` y úsalos como propiedad de
 *    metadatos ocultos en un objeto de usuario.
 *
 * [Senior / Producción]
 * 8. Demostración de la *Temporal Dead Zone (TDZ)* y alcance de bloque: Crea una
 *    función que demuestre el aislamiento de `let`/`const` dentro de bloques `{}`
 *    y captura en un `try / catch (ReferenceError)` un acceso inválido.
 * 9. Clonación Profunda Nativa (`structuredClone`): Demuestra la diferencia entre
 *    copia superficial (`{ ...objeto }` que comparte sub-objetos anidados) y
 *    copia profunda real con `structuredClone(objeto)` modificando un arreglo u
 *    objeto anidado sin afectar el original.
 * 10. Sanitizador de Estado Inicial de Configuración: Recibe un objeto de
 *     configuración parcial donde algunas propiedades son `undefined`, otras
 *     `null` y otras valores válidos, y retorna un nuevo objeto normalizado y
 *     validado con sus tipos estrictos.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
