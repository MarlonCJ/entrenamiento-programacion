'use strict';

/*
 * ============================================================================
 * TEMA 27: EXPRESIONES REGULARES, FECHAS ISO-8601/UTC Y SERIALIZACIÓN JSON
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en JavaScript)
 * ----------------------------------------------------------------------------
 * Este tema aborda tres áreas donde ocurren los bugs más traicioneros de
 * JavaScript en producción si no conoces el comportamiento interno del motor:
 *
 * 1) **Expresiones Regulares (`RegExp`) y la Trampa de `lastIndex` con `/g`**:
 *    - Soportan banderas `g` (global), `i` (insensible a mayúsculas), `u`
 *      (Unicode completo y propiedades `\p{L}`) y grupos con nombre
 *      `(?<anio>\d{4})`.
 *    - **¡GOTCHA MORTAL DE `/g` CON `.test()`!**: Una instancia `RegExp` con la
 *      bandera `/g` (o `/y`) **guarda estado mutable en `regex.lastIndex`**! Si
 *      declaras `const r = /\d+/g;` y llamas a `r.test("123")` dos veces seguidas,
 *      la primera devuelve `true` y **la segunda devuelve `false`** (porque
 *      empieza a buscar desde el índice 3!). Para `.test()` de validación simple
 *      nunca pongas `/g`, y para extraer todas las coincidencias usa siempre
 *      **`texto.matchAll(regexGlobal)`** (ES2020+), que no altera el regex original.
 * 2) **Objeto `Date`, UTC e ISO-8601**:
 *    - Internamente, un `Date` guarda los milisegundos transcurridos desde el
 *      *Unix Epoch* (`1970-01-01T00:00:00.000Z` en UTC).
 *    - **¡Gotchas de `Date`!**:
 *      a) En `new Date(2026, 0, 15)`, **los meses van de `0` (Enero) a `11` (Diciembre)**!
 *      b) `new Date("2026-10-25")` (solo fecha ISO sin hora) se interpreta en **UTC**,
 *         mientras que `new Date("2026-10-25T00:00:00")` (con hora sin `Z`) se
 *         interpreta en **hora local**! Usa siempre formato ISO completo con `Z`
 *         (`"2026-10-25T00:00:00.000Z"`) y `.toISOString()`.
 * 3) **JSON Avanzado (`replacer` y `reviver`)**:
 *    `JSON.stringify(valor, replacer, espacio)` y `JSON.parse(texto, reviver)`
 *    permiten interceptar la serialización para manejar `BigInt`, `Map`, fechas
 *    o redactar contraseñas automáticamente.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Extracción de Datos Estructurados con `matchAll` y Grupos con Nombre (`groups`).
 * - Manejo de Timestamps en APIs: Almacenar e intercambiar siempre strings
 *   ISO-8601 en UTC (`new Date().toISOString()`) o milisegundos Epoch (`Date.now()`),
 *   y formatear a la zona del usuario con `Intl.DateTimeFormat`.
 * - Serialización Segura de `BigInt` y Redacción de Secretos en `JSON.stringify`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Regex con grupos con nombre y propiedad Unicode (\p{L} = cualquier letra con/sin tilde):
 * const patronProducto = /^(?<categoria>\p{L}+)-(?<codigo>\d{4})$/u;
 * const match = patronProducto.exec('Electrónica-2026');
 * console.log(match?.groups); // { categoria: 'Electrónica', codigo: '2026' }
 *
 * // 2. Extracción global segura con matchAll (ES2020+):
 * const texto = 'Facturas: #101 y #205';
 * const numeros = [...texto.matchAll(/#(?<id>\d+)/g)].map((m) => Number(m.groups.id)); // [101, 205]
 *
 * // 3. Fechas en UTC e Intl.DateTimeFormat con timeZone explícita:
 * const instante = new Date('2026-10-25T20:00:00.000Z');
 * const fmtBogota = new Intl.DateTimeFormat('es-CO', {
 *     timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'medium'
 * });
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Serializar a JSON un objeto de transacción que contiene un `BigInt`
 * (el cual por defecto hace que `JSON.stringify` lance `TypeError`) y un campo
 * sensible `token`, usando una función `replacer` personalizada.
 *
 * const transaccion = {
 *     id: 9007199254740999n,
 *     monto: 150.75,
 *     tokenSecreto: 'sk_live_999',
 *     fecha: new Date('2026-10-25T15:00:00.000Z'),
 * };
 *
 * const jsonSeguro = JSON.stringify(transaccion, (clave, valor) => {
 *     if (clave === 'tokenSecreto') return undefined; // Omitir del JSON!
 *     if (typeof valor === 'bigint') return valor.toString();
 *     return valor;
 * });
 *
 * console.log(jsonSeguro);
 * // Salida esperada:
 * // {"id":"9007199254740999","monto":150.75,"fecha":"2026-10-25T15:00:00.000Z"}
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - NUNCA PONGAS LA BANDERA `/g` EN UN REGEX QUE USAS SOLO CON `.test()`:
 *   Evitarás el bug de `lastIndex` alternando entre `true` y `false`.
 * - CUIDADO CON `JSON.stringify( { id: 10n } )`: En JavaScript nativo, intentar
 *   serializar un `BigInt` con `JSON.stringify` sin un `replacer` lanza
 *   **`TypeError: Do not know how to serialize a BigInt`**.
 * - RECUERDA QUE `Date` ES MUTABLE: Si pasas un objeto `Date` a una función y
 *   adentro hacen `fecha.setDate(...)`, modifican el objeto original. Crea
 *   siempre una copia con `new Date(fecha.getTime())`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Demostración del bug de `lastIndex` con `/g`: Crea `const r = /abc/g`,
 *    llama a `r.test("abc")` dos veces seguidas imprimiendo `r.lastIndex` y el
 *    resultado, y corrígelo quitando la bandera `g`.
 * 2. Validación y extracción con Grupos con Nombre: Crea un regex que valide
 *    fechas `"YYYY-MM-DD"` y extraiga `groups.anio`, `groups.mes` y `groups.dia`.
 * 3. Operaciones seguras en UTC con `Date`: Crea una función pura `sumarDiasInmutable(fecha, dias)`
 *    que retorne una nueva instancia `new Date(fecha.getTime() + dias * 86_400_000)`
 *    sin mutar la fecha recibida.
 *
 * [Intermedio]
 * 4. Extracción múltiple con `String.prototype.matchAll`: De un texto que
 *    contiene varios precios `"Precios: $12.50, $100.00 y $8.99"`, extrae todos
 *    los valores numéricos y súmalos usando `matchAll`.
 * 5. Expresiones regulares Unicode (`\p{L}` con bandera `/u`): Valida nombres
 *    propios que acepten letras de cualquier idioma con tildes, `'ñ'` o diéresis
 *    sin escribir rangos manuales `[a-zA-Záéíóú...]`.
 * 6. Formateo en múltiples zonas horarias con `Intl.DateTimeFormat`: Dado un
 *    mismo timestamp UTC, muéstralo formateado simultáneamente en `'America/Bogota'`,
 *    `'America/New_York'`, `'Europe/Madrid'` y `'Asia/Tokyo'`.
 * 7. Uso de `reviver` en `JSON.parse`: Implementa un `reviver` que al parsear un
 *    JSON convierta automáticamente cualquier string que coincida con el formato
 *    ISO-8601 (`^\d{4}-\d{2}-\d{2}T...Z$`) en una instancia real de `Date`.
 *
 * [Senior / Producción]
 * 8. Calculadora de Días Hábiles y Vencimiento de SLA: Implementa
 *    `calcularFechaVencimientoHabiles(fechaInicioUtc, diasHabiles, festivosIsoSet)`
 *    usando métodos UTC (`getUTCDay()`, `setUTCDate()`) para no verse afectado
 *    por cambios de horario de verano (*DST*).
 * 9. Redactor Universal en `JSON.stringify` contra Fuga de Datos Sensibles:
 *    Crea `stringifySeguro(objeto)` cuyo `replacer` enmascare cualquier clave
 *    sensible (`password`, `cvv`, `secret`, `authorization`), convierta `BigInt`
 *    a string y maneje referencias circulares usando un `WeakSet`!
 * 10. Analizador de Logs de Servidor con Regex y Ventanas de Tiempo: Parsea un
 *     bloque de logs Apache/Nginx con grupos con nombre (`ip`, `fecha`, `metodo`,
 *     `ruta`, `status`, `latenciaMs`) y filtra las peticiones ocurridas dentro
 *     de un rango de tiempo específico.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
