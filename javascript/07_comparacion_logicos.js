'use strict';

/*
 * ============================================================================
 * TEMA 07: COMPARACIÓN ESTRICTA (===), OBJECT.IS Y CORTOCIRCUITO LÓGICO
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Igualdad y Lógica en JS)
 * ----------------------------------------------------------------------------
 * En JavaScript existen **tres** algoritmos internos de comparación de igualdad
 * definidos en la especificación ECMAScript:
 *
 * 1) **Igualdad Abstracta / Débil (`==` y `!=`) — PROHIBIDA en código Senior**:
 *    Aplica reglas complejas de coerción implícita antes de comparar:
 *    - `0 == ""` -> `true`!
 *    - `0 == false` -> `true`!
 *    - `"" == false` -> `true`!
 *    - `[1] == 1` -> `true`!
 *    - `[] == ![]` -> **`true`**! (Porque `![]` es `false`, y `[]` se convierte a `""` -> `0 == 0`).
 * 2) **Igualdad Estricta (`===` y `!==`) — El Estándar por Defecto**:
 *    Si los operandos tienen distinto tipo, devuelve `false` de inmediato sin
 *    convertir nada. Para objetos (`{}`, `[]`, funciones), compara si ambas
 *    variables apuntan a la **misma dirección de memoria en el Heap**.
 *    Tiene solo dos casos especiales de IEEE 754: `NaN === NaN` es `false`, y
 *    `+0 === -0` es `true`.
 * 3) **SameValue (`Object.is(a, b)`, ES6+)**:
 *    Idéntico a `===`, pero corrige los dos casos especiales:
 *    `Object.is(NaN, NaN)` es **`true`**, y `Object.is(+0, -0)` es **`false`**.
 *
 * Además, recuerda qué devuelven realmente **`&&`** y **`||`** en JavaScript:
 * ¡NO devuelven `true` o `false` necesariamente, sino **el valor original del
 * último operando evaluado**!
 * - `A && B`: Si `A` es falsy devuelve `A`; si `A` es truthy evalúa y devuelve `B`.
 * - `A || B`: Si `A` es truthy devuelve `A`; si `A` es falsy evalúa y devuelve `B`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Validaciones de Dominio Expresivas: Extraer condiciones complejas a variables
 *   booleanas con nombres claros (`esClienteElegible`, `tieneSaldoSuficiente`).
 * - Evaluación por Cortocircuito: Evitar ejecutar llamadas costosas si la
 *   primera condición ya determinó el resultado.
 * - Comparación Profunda de Objetos: Entender por qué `{ a: 1 } === { a: 1 }` es
 *   `false` y cómo implementar comparadores de valor por propiedad.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Igualdad estricta (===) vs Object.is():
 * console.log(0 === '0');          // false
 * console.log(NaN === NaN);        // false
 * console.log(Object.is(NaN, NaN)); // true
 *
 * // 2. Qué devuelven realmente && y || (El valor del operando, no un booleano forzado):
 * const saludo = '' || 'Hola por defecto'; // 'Hola por defecto' (porque '' es falsy)
 * const permiso = true && 'ACCESO_TOTAL';  // 'ACCESO_TOTAL'
 *
 * // 3. Comparación lexicográfica de strings con localeCompare (no con < o >):
 * // 'canción'.localeCompare('camino', 'es') -> > 0 (maneja tildes y ñ correctamente!)
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un motor de autorización bancaria evalúa si una transferencia puede
 * ejecutarse al instante sin revisión manual aplicando reglas booleanas limpias.
 *
 * function autorizarTransferenciaInstantanea(cuenta, monto, esDestinatarioConfiable) {
 *     const cuentaOperativa = cuenta.activa === true && !cuenta.bloqueadaPorFraude;
 *     const montoDentroDeLimite = monto > 0 && monto <= cuenta.saldoDisponible;
 *     const exentoDeRevision = monto <= 1_000 || esDestinatarioConfiable === true;
 *
 *     return cuentaOperativa && montoDentroDeLimite && exentoDeRevision;
 * }
 *
 * const cuentaDemo = { activa: true, bloqueadaPorFraude: false, saldoDisponible: 5000 };
 * console.log('Transferencia $2500 a confiable:', autorizarTransferenciaInstantanea(cuentaDemo, 2500, true));
 * console.log('Transferencia $2500 a nuevo:', autorizarTransferenciaInstantanea(cuentaDemo, 2500, false));
 * // Salida esperada:
 * // Transferencia $2500 a confiable: true
 * // Transferencia $2500 a nuevo: false
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - EL PELIGRO DE COMPARAR NÚMEROS GUARDADOS COMO STRINGS CON `<` O `>`:
 *   Si ambos operandos son `string`, `<` y `>` comparan **código Unicode carácter
 *   por carácter (orden alfabético)**, NO valor numérico! Por eso:
 *   `"9" > "100"` evalúa a **`true`** (porque el carácter `'9'` > `'1'`).
 *   Convierte siempre a `Number` antes de comparar rangos numéricos.
 * - NUNCA COMPARES OBJETOS O ARREGLOS CON `===` ESPERANDO COMPARAR SU CONTENIDO:
 *   `[1, 2] === [1, 2]` es siempre **`false`** porque son dos instancias distintas
 *   en el Heap.
 * - PRECEDENCIA LÓGICA: `!` (NOT) se evalúa primero, luego `&&` (AND) y al final
 *   `||` (OR). Cuando mezcles `&&` y `||` en la misma expresión, usa siempre
 *   paréntesis explícitos `(a && b) || c` para que nadie tenga que adivinar.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Demostración de las trampas de `==` vs `===`: Imprime una tabla comparando
 *    con `==` y `===` los pares: `(0, false)`, `("", 0)`, `(null, undefined)`,
 *    `([10], 10)` y `(" \t\n ", 0)`.
 * 2. Uso de `Object.is()`: Demuestra los dos únicos casos en todo el lenguaje
 *    donde `Object.is(a, b)` difiere de `a === b` (`NaN` y `-0`).
 * 3. El bug de comparar strings numéricos: Muestra qué devuelve `"20" < "100"`
 *    vs `20 < 100` y corrige una función `esMayorDeEdad(edadInput)`.
 *
 * [Intermedio]
 * 4. Valor retornado por `&&` y `||` y cortocircuito: Sin ejecutar primero,
 *    predice y comprueba qué devuelven `0 || null || "OK" || "Ignorado"` y
 *    `"Paso 1" && 42 && "" && "No llega"`.
 * 5. Comparación alfabética real en español con `localeCompare`: Ordena o compara
 *    palabras con tildes y `'ñ'` (`'ñandú'`, `'nube'`, `'árbol'`, `'avión'`)
 *    comparando el operador `<` crudo frente a `a.localeCompare(b, 'es')`.
 * 6. Simplificación con Leyes de De Morgan: Refactoriza la condición
 *    `!(!usuario.emailVerificado || usuario.suspendido || usuario.intentosFallidos >= 5)`
 *    a su forma positiva equivalente sin negación exterior.
 * 7. Comparador superficial de arreglos (`arreglosIguales(a, b)`): Como
 *    `[1, 2] === [1, 2]` es `false`, implementa una función que verifique si dos
 *    arreglos tienen la misma longitud y los mismos elementos con `===` (o `Object.is`).
 *
 * [Senior / Producción]
 * 8. Comparador de Igualdad Profunda (`sonIgualesProfundo(a, b)`): Implementa
 *    una función recursiva que compare dos valores cualesquiera (primitivos,
 *    arreglos anidados, objetos planos y `Date`) por su contenido real.
 * 9. Detección de cambios de estado (*Shallow Diff* para optimización de UI/APIs):
 *    Implementa `obtenerCamposModificados(estadoAnterior, estadoNuevo)` que
 *    devuelva un arreglo con los nombres de las propiedades cuyo valor cambió
 *    según `Object.is()`.
 * 10. Motor de Reglas de Fraude Componible: Crea una función que evalúe una
 *     transacción contra una lista de predicados booleanos con cortocircuito,
 *     registrando exactamente cuál fue la primera regla que rechazó la operación.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
