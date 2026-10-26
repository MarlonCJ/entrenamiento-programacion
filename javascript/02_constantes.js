'use strict';

/*
 * ============================================================================
 * TEMA 02: CONSTANTES, INMUTABILIDAD SUPERFICIAL VS PROFUNDA (OBJECT.FREEZE)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Inmutabilidad en JS)
 * ----------------------------------------------------------------------------
 * Uno de los errores conceptuales más comunes en JavaScript es creer que `const`
 * hace que un objeto o arreglo sea inmutable.
 *
 * Modelo Mental en el Motor V8:
 * 1) **`const` protege el ENLACE (la flecha), NO el objeto apuntado**:
 *    - Si haces `const IVA = 0.19;`, como `0.19` es un primitivo inmutable y el
 *      enlace `IVA` no puede reasignarse, su valor es 100% constante.
 *    - Pero si haces `const CONFIG = { puerto: 8080 };`, `CONFIG = {}` lanzará
 *      `TypeError: Assignment to constant variable`, ¡mientras que
 *      `CONFIG.puerto = 9000;` es perfectamente legal porque solo muta el interior
 *      del objeto en el Heap!
 * 2) **`Object.freeze(obj)` (Congelación Superficial / *Shallow Freeze*)**:
 *    Congela las propiedades de primer nivel del objeto: en modo estricto
 *    (`'use strict'`), cualquier intento de modificar, agregar o eliminar una
 *    propiedad de primer nivel lanza inmediatamente un `TypeError`.
 * 3) **`deepFreeze(obj)` (Congelación Profunda Recursiva)**:
 *    `Object.freeze` es **superficial**: si el objeto contiene otro objeto o
 *    arreglo adentro (`CONFIG.db.host`), ese sub-objeto sigue siendo mutable a
 *    menos que congeles recursivamente todo el árbol de objetos.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Diccionarios de Estados y Catálogos Fijos (Simulación de `Enum` en JS):
 *   `const ESTADO_PEDIDO = Object.freeze({ PENDIENTE: 'PENDIENTE', PAGADO: 'PAGADO' });`
 * - Configuraciones Globales de Aplicación: Garantizar con `deepFreeze` que
 *   ningún middleware o módulo altere por accidente las tasas de impuestos,
 *   URLs base o límites de seguridad en tiempo de ejecución.
 * - Actualizaciones Inmutables de Estado (Patrón Redux / React / Funcional):
 *   Crear copias actualizadas con `{ ...estado, total: nuevoTotal }` en lugar
 *   de mutar el objeto recibido.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Constantes escalares de dominio (UPPER_SNAKE_CASE):
 * const TIMEOUT_MS = 5_000;
 * const MAX_REINTENTOS = 3;
 *
 * // 2. Enum inmutable en JavaScript con Object.freeze:
 * const ROL_USUARIO = Object.freeze({
 *     ADMIN: 'ADMIN',
 *     EDITOR: 'EDITOR',
 *     LECTOR: 'LECTOR',
 * });
 *
 * // 3. Verificación de estado de congelación:
 * console.log(Object.isFrozen(ROL_USUARIO)); // true
 *
 * // 4. Función de Congelación Profunda (Deep Freeze):
 * function congelarProfundo(obj) {
 *     if (obj === null || typeof obj !== 'object' || Object.isFrozen(obj)) {
 *         return obj;
 *     }
 *     Object.freeze(obj);
 *     for (const clave of Reflect.ownKeys(obj)) {
 *         congelarProfundo(obj[clave]);
 *     }
 *     return obj;
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Definir una tabla de políticas de envío congelada profundamente y
 * verificar que en modo estricto (`'use strict'`) el motor bloquea cualquier
 * intento de sabotaje o mutación accidental en tiempo de ejecución.
 *
 * const POLITICA_ENVIO = Object.freeze({
 *     MONEDA: 'USD',
 *     UMBRAL_GRATIS: 100,
 *     TARIFAS: Object.freeze({ LOCAL: 5, NACIONAL: 12 }),
 * });
 *
 * try {
 *     POLITICA_ENVIO.TARIFAS.LOCAL = 0; // Intento de mutar sub-objeto congelado
 * } catch (error) {
 *     console.log(`[PROTEGIDO] Mutación bloqueada: ${error.name}`);
 * }
 * console.log(`Tarifa local intacta: $${POLITICA_ENVIO.TARIFAS.LOCAL}`);
 * // Salida esperada:
 * // [PROTEGIDO] Mutación bloqueada: TypeError
 * // Tarifa local intacta: $5
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - SIN `'use strict'`, `Object.freeze` FALLA EN SILENCIO: En modo no estricto
 *   (*sloppy mode*), asignar una propiedad a un objeto congelado no hace nada
 *   pero tampoco lanza excepción, ocultando el bug. Usa siempre `'use strict'`
 *   o módulos ES (`import`/`export`, que son estrictos automáticamente).
 * - `Object.freeze` TAMBIÉN FUNCIONA EN ARREGLOS: `const DIAS = Object.freeze(['Lun', 'Mar']);`
 *   impide hacer `DIAS.push('Mie')` o `DIAS[0] = 'Dom'`.
 * - DIFERENCIA ENTRE `Object.seal` Y `Object.freeze`:
 *   - `Object.seal(obj)`: Impide agregar o borrar propiedades, pero **permite
 *     modificar** el valor de las propiedades existentes.
 *   - `Object.freeze(obj)`: Impide agregar, borrar **y modificar** propiedades.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Constantes físicas y financieras: Declara constantes en `UPPER_SNAKE_CASE`
 *    para `TASA_IVA`, `DIAS_ANIO_COMERCIAL` y `MAX_ITEMS_CARRITO`, y calcula el
 *    total de una compra sin usar números mágicos.
 * 2. Mutación de objeto en `const` vs reasignación: Demuestra con un objeto
 *    `const usuario = { nombre: 'Ana' }` que cambiar `usuario.nombre = 'Eva'`
 *    funciona, pero reasignar `usuario = {}` lanza `TypeError`.
 * 3. Creación de Enum inmutable con `Object.freeze`: Crea `ESTADOS_ORDEN` y una
 *    función `esEstadoValido(estado)` usando `Object.values(ESTADOS_ORDEN).includes(estado)`.
 *
 * [Intermedio]
 * 4. Demostración de la limitación superficial de `Object.freeze`: Crea un
 *    objeto con un sub-objeto anidado, aplica `Object.freeze` solo a la raíz y
 *    demuestra que el sub-objeto aún se puede mutar.
 * 5. Implementación de `deepFreeze`: Implementa la función recursiva
 *    `congelarProfundo(objeto)` y comprueba con `try / catch (TypeError)` que
 *    protege tanto objetos anidados como arreglos internos.
 * 6. Comparativa `Object.preventExtensions`, `Object.seal` y `Object.freeze`:
 *    Crea tres objetos de prueba y demuestra exactamente qué permite y qué
 *    prohíbe cada uno de los tres métodos.
 * 7. Arreglos inmutables en ES2023+ (`toSorted`, `toReversed`, `with`):
 *    Congela un arreglo `const numeros = Object.freeze([30, 10, 20])` y demuestra
 *    que mientras `.sort()` falla por mutar in-place, `.toSorted((a, b) => a - b)`
 *    funciona porque devuelve una copia nueva!
 *
 * [Senior / Producción]
 * 8. Propiedades constantes finas con `Object.defineProperty`: Crea un objeto
 *    donde solo la propiedad `id` sea de solo lectura y no enumerable
 *    (`writable: false, configurable: false`), mientras el resto de propiedades
 *    sigan siendo editables.
 * 9. Reductor de Estado Inmutable (Patrón *State Reducer*): Implementa una
 *    función `actualizarCarritoInmutable(carritoActual, accion)` donde
 *    `carritoActual` está congelado con `deepFreeze` y las acciones `'AGREGAR_ITEM'`
 *    y `'VACIAR'` retornan un nuevo estado congelado sin tocar el anterior.
 * 10. Almacén de Configuración Blindado con `Proxy`: Crea una función
 *     `crearConfiguracionSegura(objeto)` que devuelva un `Proxy` inmutable el
 *     cual no solo impida modificar propiedades (`set`), sino que además lance
 *     un `ReferenceError` descriptivo si alguien intenta leer una clave de
 *     configuración que no existe (evitando `undefined` silenciosos por typos!).
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
