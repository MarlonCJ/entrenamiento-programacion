'use strict';

const assert = require('node:assert/strict');

/*
 * ============================================================================
 * TEMA 22: PRUEBAS AUTOMATIZADAS (NODE:ASSERT/STRICT, AAA), SPIES Y DEPURACIÓN
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Testing en Node.js Moderno)
 * ----------------------------------------------------------------------------
 * ¡Node.js moderno incluye su propio motor de aserciones y ejecutor de pruebas
 * nativo (**`node:assert/strict`** y **`node:test`**, Node 18/20+) sin necesidad
 * de instalar un solo paquete de `npm`!
 *
 * Modelo Mental de Calidad de Software:
 * 1) **Aserciones Estrictas (`require('node:assert/strict')`)**:
 *    - `assert.equal(actual, esperado)`: Compara primitivos con **`Object.is()`**
 *      (igualdad estricta).
 *    - `assert.deepEqual(actual, esperado)`: Compara recursivamente el contenido
 *      de objetos, arreglos, `Map` y `Set` verificando tipos y prototipos!
 *    - `assert.throws(() => ..., TipoError)`: Verifica que una función síncrona
 *      lance la excepción esperada.
 *    - `await assert.rejects(async () => ..., TipoError)`: Verifica que una
 *      promesa o función `async` sea rechazada con el error esperado.
 * 2) **Patrón AAA (*Arrange - Act - Assert*)**:
 *    Preparar los datos y dobles de prueba (*Arrange*) -> Ejecutar la función
 *    (*Act*) -> Afirmar el resultado con `assert` (*Assert*).
 * 3) **Depuración Científica**:
 *    Aislar el bug en un test pequeño que falle -> Inspeccionar valores y tipos ->
 *    Corregir la causa raíz -> Dejar el test permanente contra regresiones.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Pruebas Unitarias de Lógica de Negocio: Validar cálculos financieros,
 *   transiciones de estado y validadores con `assert.equal` y `assert.deepEqual`.
 * - Pruebas de Frontera (*Boundary Testing*): Probar `0`, `-1`, `[]`, `""`,
 *   `null`, `NaN` y límites máximos.
 * - Dobles de Prueba (*Spies*, *Stubs* y *Fakes*): Aislar llamadas HTTP, bases
 *   de datos o el reloj del sistema (`Date.now`) para que los tests sean 100%
 *   deterministas y corran en 1 milisegundo.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (Node.js Moderno)
 * ----------------------------------------------------------------------------
 * // const assert = require('node:assert/strict');
 *
 * // 1. Aserciones de valores primitivos y objetos profundos:
 * assert.equal(2 + 2, 4, 'Suma básica debe ser 4');
 * assert.deepEqual({ a: [1, 2] }, { a: [1, 2] }, 'Objetos profundos iguales');
 *
 * // 2. Verificar que una función lanza una excepción específica:
 * assert.throws(
 *     () => { throw new RangeError('Fuera de límite'); },
 *     { name: 'RangeError', message: /límite/ }
 * );
 *
 * // 3. Verificar que una Promesa rechaza (asíncrono):
 * // await assert.rejects(async () => servicioAsincronoInvalido(), TypeError);
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Probamos una función de cálculo de propina y división de cuenta de
 * restaurante usando `node:assert/strict` para cubrir caso normal, frontera de
 * 0% de propina y rechazo ante `0` personas.
 *
 * function dividirCuenta(total, porcentajePropina, personas) {
 *     if (!Number.isInteger(personas) || personas <= 0) {
 *         throw new RangeError('El número de personas debe ser un entero positivo');
 *     }
 *     if (total < 0 || porcentajePropina < 0) {
 *         throw new RangeError('Monto o propina negativos');
 *     }
 *     const totalConPropina = total * (1 + porcentajePropina / 100);
 *     return Math.round((totalConPropina / personas + Number.EPSILON) * 100) / 100;
 * }
 *
 * // Suite de pruebas AAA:
 * assert.equal(dividirCuenta(100, 10, 2), 55);
 * assert.equal(dividirCuenta(100, 0, 4), 25);
 * assert.throws(() => dividirCuenta(100, 10, 0), RangeError);
 * console.log('[OK] Todas las pruebas de dividirCuenta pasaron exitosamente');
 * // Salida esperada:
 * // [OK] Todas las pruebas de dividirCuenta pasaron exitosamente
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en Node.js)
 * ----------------------------------------------------------------------------
 * - IMPORTA SIEMPRE `'node:assert/strict'` Y NO `'node:assert'` SIN `/strict`:
 *   En el módulo legado sin `/strict`, `assert.equal(1, "1")` usaba `==` débil!
 *   Con `require('node:assert/strict')`, `assert.equal` y `assert.deepEqual` son
 *   100% estrictos por defecto.
 * - POR QUÉ `assert.equal({ a: 1 }, { a: 1 })` FALLA: Porque `assert.equal`
 *   compara referencias de memoria (`Object.is`). Para comparar el contenido de
 *   objetos o arreglos usa siempre **`assert.deepEqual(actual, esperado)`**.
 * - NUNCA HAGAS QUE UN TEST DEPENDA DE OTRO NI DEL ORDEN DE EJECUCIÓN:
 *   Cada prueba debe construir su propio estado limpio en la fase *Arrange*.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Pruebas con `assert.equal`, `assert.deepEqual` y `assert.throws`:
 *    Implementa `filtrarNumerosValidos(lista)` y escribe 4 pruebas verificando
 *    lista normal, lista con `NaN`/`null`, lista vacía y error si no recibe un Array.
 * 2. Cazador de bugs #1 (Coerción `+` accidental): Una función `calcularTotal(subtotal, envio)`
 *    devuelve `"10015"` cuando `envio` llega como `"15"`. Escribe el test que
 *    reproduce el fallo, corrige la función y comprueba que el test pase.
 * 3. Cazador de bugs #2 (Mutación del argumento de entrada): Una función
 *    `obtenerTop3(puntajes)` usaba `puntajes.sort(...)` desordenando el arreglo
 *    original del llamador. Escribe un test que verifique con `assert.deepEqual`
 *    que el arreglo original no cambie tras llamar a la función, y corrígela
 *    con `.toSorted()`.
 *
 * [Intermedio]
 * 4. Cazador de bugs #3 (`0` tratado como falsy con `||`): Una función
 *    `aplicarTarifa(tarifaPersonalizada)` usaba `const t = tarifaPersonalizada || 10;`
 *    fallando cuando la tarifa personalizada era `0` (gratis). Escribe el test
 *    para el caso frontera `0` y corrígelo con `??`.
 * 5. Pruebas Parametrizadas (*Table-Driven Tests*): Crea una matriz de 6 casos
 *    `{ nombre, entrada, esperado }` para probar exhaustivamente un validador
 *    de contraseñas seguras dentro de un bucle `for...of`.
 * 6. Creación de una función *Spy* (`crearEspia(fn)`): Implementa una utilidad
 *    que envuelva cualquier función registrando en `espia.llamadas` los
 *    argumentos de cada invocación (`[[arg1, arg2], ...]`) para verificar cuántas
 *    veces y con qué datos fue llamado un callback.
 * 7. Pruebas de código asíncrono con `assert.rejects`: Crea una función `async`
 *    que valide un token y escribe pruebas tanto para la resolución exitosa como
 *    para el rechazo usando `await assert.rejects(...)`.
 *
 * [Senior / Producción]
 * 8. Abstracción del Reloj para Pruebas Deterministas: Refactoriza un validador
 *    de sesiones expiradas que llamaba a `Date.now()` directamente para que
 *    reciba `obtenerAhora = () => Date.now()`, y pruébalo pasando un reloj fijo
 *    `() => 1700000000000`.
 * 9. Doble de Prueba (*Fake Repository*) para Servicio de Dominio: Implementa
 *    un repositorio en memoria respaldado por `Map` para probar de extremo a
 *    extremo un servicio de transferencia entre cuentas (éxito, cuenta inexistente
 *    y fondos insuficientes).
 * 10. Mini-Framework Ejecutor de Pruebas (`SuitePruebas`): Construye un runner
 *     que permita registrar pruebas síncronas y asíncronas (`test(nombre, fn)`),
 *     las ejecute todas aislando los fallos en `try / catch`, mida el tiempo en
 *     ms con `performance.now()` e imprima el resumen final.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
