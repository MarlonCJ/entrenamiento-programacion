'use strict';

/*
 * ============================================================================
 * TEMA 15: ÁMBITO LÉXICO (SCOPE), CLOSURES, HOISTING Y MÓDULOS ENCAPSULADOS
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Closures en el Motor V8)
 * ----------------------------------------------------------------------------
 * En JavaScript, el alcance (*Scope*) es **léxico (estático)**: qué variables
 * puede ver una función queda determinado por **el lugar físico del código donde
 * la función fue escrita**, no por el lugar desde donde se la invoca.
 *
 * ¿Qué es un **Closure** (Clausura) en el Motor V8?
 * Cuando una función interna hace referencia a variables de su función externa,
 * y esa función interna es retornada o pasada como callback, el motor V8 mueve
 * esas variables capturadas desde el *Call Stack* hacia un objeto de contexto en
 * el **Heap** (`Context`). Así, la función interna sigue teniendo acceso vivo a
 * esas variables incluso después de que la función externa ya terminó de
 * ejecutarse!
 *
 * Detalles críticos del Ámbito en JS:
 * 1) **Alcance de Bloque (`let` y `const`) vs Alcance de Función (`var`)**:
 *    En un bucle `for (let i = 0; i < 3; i++)`, JavaScript crea un **enlace
 *    `i` nuevo e independiente por cada iteración**, por lo que cualquier
 *    closure creado dentro del bucle recuerda el `i` exacto de su iteración (con
 *    el antiguo `var`, todos los closures compartían la misma variable `i` final!).
 * 2) **Ocultamiento de Variables (*Variable Shadowing*)**:
 *    Si declaras una variable local con el mismo nombre que una externa, la
 *    interna "hace sombra" a la externa dentro de su bloque sin modificarla.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Estado Privado Real sin Clases (*Factory Functions*): Crear contadores,
 *   billeteras o clientes de API cuyas credenciales viven únicamente dentro del
 *   closure y son inaccesibles desde afuera.
 * - Funciones de Orden Superior (*Debounce*, *Throttle*, *Once*, *Memoize*):
 *   Guardar timers o cachés privadas entre ejecuciones usando el closure.
 * - Pre-configuración de Servicios (*Partial Application*): Fijar la URL base o
 *   la tasa de impuesto en una función generadora de cálculos.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Estado 100% privado mediante Closure (Factory Function):
 * function crearContadorSeguro(inicial = 0) {
 *     let cuenta = inicial; // Privada en el Closure (imposible de tocar desde afuera)
 *     return {
 *         incrementar: (paso = 1) => (cuenta += paso),
 *         obtenerValor: () => cuenta,
 *     };
 * }
 *
 * // 2. Fábrica de funciones parametrizadas (Currying):
 * const crearMultiplicador = (factor) => (numero) => numero * factor;
 * const duplicar = crearMultiplicador(2); // Recuerda factor = 2 en su closure
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Implementar un limitador de llamadas (*Rate Limiter* por ventana)
 * usando un closure que encapsula el historial de llamadas sin exponerlo a que
 * código externo pueda reiniciarlo o trucarlo.
 *
 * function crearLimitadorPeticiones(maxPeticiones) {
 *     let consumidas = 0;
 *     return function intentarEjecutar(accionNombre) {
 *         if (consumidas >= maxPeticiones) {
 *             return `[BLOQUEADO] Límite de ${maxPeticiones} alcanzado para: ${accionNombre}`;
 *         }
 *         consumidas++;
 *         return `[OK ${consumidas}/${maxPeticiones}] Ejecutada: ${accionNombre}`;
 *     };
 * }
 *
 * const ejecutar = crearLimitadorPeticiones(2);
 * console.log(ejecutar('Login intento 1'));
 * console.log(ejecutar('Login intento 2'));
 * console.log(ejecutar('Login intento 3'));
 * // Salida esperada:
 * // [OK 1/2] Ejecutada: Login intento 1
 * // [OK 2/2] Ejecutada: Login intento 2
 * // [BLOQUEADO] Límite de 2 alcanzado para: Login intento 3
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - EL CLÁSICO PROBLEMA DE ENTREVISTA TÉCNICA (`for` con `var` vs `for` con `let`):
 *   En `for (var i = 0; i < 3; i++) { fns.push(() => i); }`, las 3 funciones
 *   devuelven `3` porque `var` tiene ámbito de función (hay un solo `i`). Con
 *   `for (let i = 0; i < 3; i++)`, devuelven `0, 1, 2` porque `let` crea un
 *   ámbito nuevo por iteración.
 * - CUIDADO CON LAS FUGAS DE MEMORIA (*MEMORY LEAKS*) EN CLOSURES DE LARGA VIDA:
 *   Si un closure de larga duración captura una referencia a un arreglo gigante
 *   de 100 MB que ya no necesita, el Garbage Collector no podrá liberar esos
 *   100 MB mientras el closure siga vivo.
 * - EL CLOSURE CAPTURA LA **VARIABLE** (REFERENCIA AL ENLACE), NO UNA FOTO CONGELADA:
 *   Si la función externa modifica su variable local después de haber creado el
 *   closure, el closure verá el valor actualizado cuando se ejecute.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Alcance léxico y *Shadowing*: Crea una constante `MONEDA = 'USD'` en el
 *    ámbito superior y otra `const MONEDA = 'COP'` dentro de una función,
 *    demostrando que cada ámbito lee la suya sin interferir.
 * 2. Fábrica de saludos e impuestos con Closure: Crea `crearCalculadorDescuento(porcentaje)`
 *    que retorne una función `(precio) => ...` y crea dos instancias (`descuentoVip`,
 *    `descuentoEmpleado`) comprobando que no mezclan sus estados.
 * 3. Demostración de *Hoisting* y *TDZ*: Muestra que una declaración `function f() {}`
 *    se puede llamar antes de su línea, mientras que una expresión `const g = () => {}`
 *    está en la *Temporal Dead Zone* hasta su línea de inicialización.
 *
 * [Intermedio]
 * 4. El bucle de Closures (`var` vs `let`): Crea un arreglo de 3 callbacks
 *    dentro de un bucle `for` usando `var` (comprueba que todos retornan `3`) y
 *    luego usando `let` (comprueba que retornan `0, 1, 2`).
 * 5. Billetera con estado 100% privado e historial inmutable: Implementa
 *    `crearBilleteraSegura(titular, saldoInicial)` que retorne métodos para
 *    `depositar`, `retirar`, `consultarSaldo` y `obtenerMovimientos` (devolviendo
 *    una copia `[...historial]` para que desde afuera no puedan hacer `.push()`
 *    al historial interno!).
 * 6. Función utilitaria `once(fn)`: Implementa una función de orden superior que
 *    reciba una función de inicialización `fn` y devuelva un closure que solo
 *    ejecute `fn` la primera vez y en llamadas sucesivas devuelva el primer
 *    resultado cacheado.
 * 7. Secuencia generadora con estado en Closure: Crea `crearGeneradorConsecutivo(prefijo, inicio)`
 *    que en cada llamada devuelva `"FAC-0001"`, `"FAC-0002"`, etc.
 *
 * [Senior / Producción]
 * 8. Implementación de `memoize(fn, resolverClave)` con Límite de Caché:
 *    Crea un decorador que guarde en un `Map` privado del closure los resultados
 *    previos de `fn`, permitiendo además un método `.limpiarCache()` adjunto a
 *    la función retornada.
 * 9. Implementación de `debounce(fn, esperaMs)` o Limitador por Ventana de Tiempo:
 *    Usando closures y marcas de tiempo (`Date.now()`), implementa un *Throttler*
 *    `throttle(fn, intervaloMs)` que impida que una función se ejecute más de
 *    una vez cada `intervaloMs` milisegundos.
 * 10. Inyección de Dependencias Funcional mediante Closures (*Reader / Service Factory*):
 *     Implementa `crearServicioPedidos({ repositorio, notificador, logger })`
 *     que capture sus dependencias en el closure y retorne los casos de uso
 *     listos para invocarse sin usar `this` ni clases.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
