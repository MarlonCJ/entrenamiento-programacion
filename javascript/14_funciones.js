'use strict';

/*
 * ============================================================================
 * TEMA 14: DISEÑO DE FUNCIONES, ARROW FUNCTIONS, PARÁMETROS OBJETO Y THIS
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Funciones en JS)
 * ----------------------------------------------------------------------------
 * En JavaScript, las funciones son **Objetos de Primera Clase** (*First-Class
 * Citizens*): pueden asignarse a variables, pasarse como argumentos, devolverse
 * desde otras funciones y tener propiedades.
 *
 * Diferencias arquitectónicas entre Declaraciones de Función y Arrow Functions:
 * 1) **`function nombre() {}` (Declaración Clásica)**:
 *    - Sufre *hoisting* completo (puede invocarse antes de su línea de definición).
 *    - Tiene su propio enlace dinámico **`this`** (que depende de *cómo* se
 *      invoque la función: `obj.fn()`, `fn.call(ctx)` o `fn()` suelta donde
 *      `this` es `undefined` en `'use strict'`).
 *    - Puede usarse como constructor con `new` (aunque en JS moderno usamos `class`).
 * 2) **`const fn = (a, b) => a + b` (Arrow Function, ES6+)**:
 *    - **NO tiene `this` propio**: hereda léxicamente el `this` del ámbito donde
 *      fue creada! Por eso es perfecta para callbacks dentro de métodos o timers,
 *      pero **NO debe usarse como método de un objeto literal** si necesitas
 *      acceder a `this.propiedad`.
 *    - No tiene objeto `arguments` (se usa `...args`) y no puede invocarse con `new`.
 * 3) **Patrón *Options Object* (Parámetros con Nombre mediante Desestructuración)**:
 *    JavaScript no tiene *Named Arguments* por sintaxis de llamada como PHP o
 *    Python, pero logra exactamente lo mismo desestructurando un objeto con
 *    valores por defecto en la firma:
 *    `function conectar({ host = 'localhost', puerto = 5432, ssl = true } = {})`
 *    (Observa el `= {}` final: permite llamar a `conectar()` sin argumentos sin
 *    que falle al desestructurar `undefined`!).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Firmas de Funciones Limpias (*Options Object*): Cuando una función recibe
 *   más de 2 o 3 parámetros o banderas booleanas.
 * - Parámetros por Defecto Evaluados en cada Llamada:
 *   `function registrar(evento, timestamp = Date.now())` -> `Date.now()` se
 *   evalúa de nuevo en cada llamada en que se omita `timestamp`!
 * - Parámetros Rest (`...numeros`) para Funciones Variádicas.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Arrow Function concisa (Nota: para devolver un objeto literal directo, envuélvelo en paréntesis!):
 * const crearPunto = (x, y) => ({ x, y });
 *
 * // 2. Patrón Options Object con valores por defecto y = {} al final:
 * function enviarCorreo({
 *     para,
 *     asunto = 'Sin asunto',
 *     prioridad = 'normal',
 *     reintentos = 3,
 * } = {}) {
 *     if (!para) throw new TypeError('El destinatario "para" es obligatorio');
 *     return `Enviando "${asunto}" a ${para} (Prioridad: ${prioridad}, Reintentos: ${reintentos})`;
 * }
 *
 * // 3. Parámetros Rest (...args):
 * const promedio = (...nums) =>
 *     nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un cliente HTTP configurable utiliza el patrón *Options Object* con
 * desestructuración y un parámetro obligatorio validado mediante una función
 * auxiliar en el valor por defecto.
 *
 * function obligatorio(nombreParametro) {
 *     throw new TypeError(`El parámetro obligatorio "${nombreParametro}" no fue proporcionado`);
 * }
 *
 * function construirPeticionHttp({
 *     url = obligatorio('url'),
 *     metodo = 'GET',
 *     timeoutMs = 5000,
 *     headers = {},
 * } = {}) {
 *     return { url, metodo: metodo.toUpperCase(), timeoutMs, headers };
 * }
 *
 * console.log(JSON.stringify(construirPeticionHttp({ url: '/api/v1/ordenes', metodo: 'post' })));
 * // Salida esperada:
 * // {"url":"/api/v1/ordenes","metodo":"POST","timeoutMs":5000,"headers":{}}
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - LOS VALORES POR DEFECTO EN JS SOLO SE ACTIVAN CON `undefined`, NO CON `null`:
 *   En `function f(x = 10)`, `f(undefined)` usa `10`, pero **`f(null)` deja `x`
 *   como `null`**! Si el llamador puede pasar `null`, usa `x = x ?? 10` adentro.
 * - AL DEVOLVER UN OBJETO LITERAL EN UNA ARROW FUNCTION DE UNA LÍNEA, USA `({ ... })`:
 *   Escribir `const fn = () => { id: 1 };` NO devuelve un objeto: JS interpreta
 *   las llaves `{}` como el cuerpo de la función y `id:` como una etiqueta,
 *   devolviendo `undefined`! Escribe siempre `const fn = () => ({ id: 1 });`.
 * - SIEMPRE AGREGA `= {}` AL FINAL DE UN PARÁMETRO OBJETO DESESTRUCTURADO:
 *   Si defines `function f({ a = 1 })` sin `= {}` al final, llamar `f()` sin
 *   argumentos lanzará `TypeError: Cannot destructure property 'a' of 'undefined'`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Arrow Function que retorna objetos: Implementa `crearItemCarrito(sku, precio, cantidad = 1)`
 *    como Arrow Function de expresión directa que devuelva `{ sku, precio, cantidad, subtotal }`.
 * 2. Diferencia entre `undefined` y `null` en parámetros por defecto: Demuestra
 *    qué devuelve `function saludar(nombre = 'Invitado')` cuando se invoca como
 *    `saludar()`, `saludar(undefined)` y `saludar(null)`.
 * 3. Función variádica con `...rest`: Crea `calcularFactura(tasaImpuesto, ...montos)`
 *    que sume todos los montos variables y aplique el impuesto.
 *
 * [Intermedio]
 * 4. Refactorización a *Options Object*: Toma una función ilegible de 6 parámetros
 *    posicionales `buscarProductos('laptop', 100, 2000, true, 'precio_asc', 20)`
 *    y conviértela para recibir un objeto desestructurado con valores por defecto
 *    y `= {}`.
 * 5. Evaluación fresca de valores por defecto en cada llamada: Demuestra que a
 *    diferencia de Python, en JS `function agregarElemento(item, lista = [])`
 *    crea un arreglo `[]` **nuevo e independiente** en cada invocación.
 * 6. El comportamiento de `this` en Función Clásica vs Arrow Function: Crea un
 *    objeto `temporizador` con `prefijo: '[RELOJ]'` y demuestra por qué un
 *    callback con Arrow Function conserva el `this` del método exterior mientras
 *    que una `function()` suelta pierde el `this` (`undefined` en modo estricto).
 * 7. Enlace explícito de contexto con `.call()`, `.apply()` y `.bind()`:
 *    Crea una función de formateo que use `this.moneda` y ejecútala sobre dos
 *    objetos distintos de cuenta bancaria usando `.call()` y creando una versión
 *    fija con `.bind()`.
 *
 * [Senior / Producción]
 * 8. Funciones Puras e Inmutabilidad de Argumentos: Toma una función impura que
 *    mutaba el objeto `pedido` recibido por parámetro y leía una variable externa,
 *    y transfórmala en una función 100% pura y determinista.
 * 9. Sobrecarga polimórfica por inspección de firma: Implementa una función
 *    `crearRango(a, b, paso)` que funcione tanto si se llama con 1 argumento
 *    `crearRango(5)` (`0..4`), con 2 argumentos `crearRango(2, 6)` (`2..5`), o
 *    con un objeto de configuración `crearRango({ inicio: 0, fin: 10, paso: 2 })`.
 * 10. Decorador de Validación de Contratos de Función (*Higher-Order Wrapper*):
 *     Implementa `conContrato(fn, validarEntrada, validarSalida)` que envuelva
 *     cualquier función verificando automáticamente sus argumentos antes de
 *     ejecutarla y validando su valor de retorno antes de entregarlo.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
