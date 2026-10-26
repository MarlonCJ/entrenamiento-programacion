'use strict';

const EventEmitter = require('node:events');

/*
 * ============================================================================
 * TEMA 29: CLEAN CODE, PRINCIPIOS SOLID Y PATRONES DE DISEÑO EN JAVASCRIPT
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Arquitectura en JS)
 * ----------------------------------------------------------------------------
 * En JavaScript moderno, dado que el lenguaje soporta tanto **Clases** como
 * **Funciones de Primera Clase y Closures**, los Principios **SOLID** y los
 * **Patrones de Diseño** se expresan de forma mucho más concisa y limpia que en
 * lenguajes verbosos:
 *
 * 1) **Principios SOLID en JavaScript**:
 *    - **SRP (Responsabilidad Única)**: Un módulo o clase hace una sola cosa bien.
 *    - **OCP (Abierto/Cerrado)**: Extiende el comportamiento inyectando nuevas
 *      funciones estrategia o plugins registrados en un `Map` sin modificar el motor.
 *    - **LSP (Sustitución de Liskov)**: Todo adaptador (ej. `RepositorioMemoria`
 *      vs `RepositorioSql`) respeta las mismas firmas y tipos de retorno/Promesas.
 *    - **ISP (Segregación de Interfaces)**: Pasa solo las capacidades o callbacks
 *      que el consumidor necesita.
 *    - **DIP (Inversión de Dependencias)**: Recibe las dependencias externas en
 *      el constructor o en la función fábrica (`crearServicio({ repo, mailer })`)
 *      en lugar de importarlas y acoplarlas de forma rígida.
 * 2) **Los 5 Patrones Esenciales en el Ecosistema JS / Node.js**:
 *    - **Strategy**: Pasar o seleccionar funciones intercambiables de un diccionario.
 *    - **Factory**: Crear instancias complejas o encapsuladas con closures.
 *    - **Decorator / Higher-Order Function**: Envolver una función o servicio para
 *      añadir logging, caché, validación o reintentos.
 *    - **Observer / Pub-Sub (`EventEmitter`)**: Desacoplar emisores y suscriptores.
 *    - **Proxy / Middleware**: Interceptar accesos u operaciones en cadena.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Desacoplar Casos de Uso mediante Inyección de Dependencias (*Constructor /
 *   Factory Injection*) para facilitar pruebas unitarias instantáneas.
 * - Eventos de Dominio con `node:events` (`EventEmitter`) o buses de eventos.
 * - Decoradores de Funciones para Telemetría, Caché y Manejo de Errores.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Patrón Decorator Funcional (Envuelve cualquier función asíncrona con telemetría):
 * function conAuditoriaTiempo(nombreOperacion, fnAsync) {
 *     return async function (...args) {
 *         const inicio = Date.now();
 *         try {
 *             return await fnAsync(...args);
 *         } finally {
 *             console.log(`[AUDIT] ${nombreOperacion} tardó ${Date.now() - inicio}ms`);
 *         }
 *     };
 * }
 *
 * // 2. Patrón Observer nativo en Node.js con EventEmitter:
 * const busEventos = new EventEmitter();
 * busEventos.on('pedido.pagado', (pedido) => {
 *     console.log(`Enviando factura del pedido #${pedido.id}`);
 * });
 * // busEventos.emit('pedido.pagado', { id: 500 });
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un procesador de órdenes aplica **Inversión de Dependencias (DIP)**,
 * **Strategy** para el cálculo de comisión y **Observer** para notificar a otros
 * módulos cuando se completa la compra.
 *
 * class ServicioOrdenes {
 *     #calcularComision;
 *     #busEventos;
 *
 *     constructor({ calcularComision, busEventos }) {
 *         this.#calcularComision = calcularComision;
 *         this.#busEventos = busEventos;
 *     }
 *
 *     procesar(idOrden, monto) {
 *         const comision = this.#calcularComision(monto);
 *         const neto = monto - comision;
 *         this.#busEventos.emit('orden.procesada', { idOrden, monto, comision, neto });
 *         return neto;
 *     }
 * }
 *
 * const bus = new EventEmitter();
 * bus.on('orden.procesada', (ev) => console.log(`[EVENTO] Orden ${ev.idOrden}: Neto $${ev.neto}`));
 *
 * const servicio = new ServicioOrdenes({
 *     calcularComision: (m) => m * 0.05,
 *     busEventos: bus,
 * });
 * servicio.procesar('ORD-99', 200);
 * // Salida esperada:
 * // [EVENTO] Orden ORD-99: Neto $190
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - EN JAVASCRIPT, UNA ESTRATEGIA NO NECESITA UNA CLASE COMPLETA SI ES UNA SOLA FUNCIÓN:
 *   En lugar de crear `class EstrategiaIvaColombia { calcular(m) { ... } }`,
 *   una simple función pura `const ivaColombia = (m) => m * 0.19;` cumple el
 *   patrón Strategy de forma idiomática. Usa clases cuando la estrategia tenga
 *   estado o múltiples métodos.
 * - CUIDADO CON LAS FUGAS DE LISTENERS EN `EventEmitter` (`MaxListenersExceededWarning`):
 *   Si registras `bus.on(...)` dentro de una función que se llama en cada petición
 *   sin hacer `bus.off(...)` (o usar `bus.once(...)`), acumularás miles de
 *   listeners en memoria.
 * - EVITA MUTAR EL OBJETO DEL EVENTO EN UN LISTENER: Congela el payload del
 *   evento con `Object.freeze(evento)` antes de emitirlo para que el primer
 *   suscriptor no corrompa los datos que recibirá el segundo suscriptor.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Refactorización Clean Code: Reescribe una función de validación y cálculo
 *    con nombres crípticos, números mágicos y 4 niveles de anidamiento hacia
 *    funciones pequeñas autoexplicativas y Guard Clauses.
 * 2. Principio de Responsabilidad Única (SRP): Divide una función/clase que
 *    parsea datos CSV, calcula impuestos y formatea HTML en 3 componentes
 *    independientes y componibles.
 * 3. Patrón **Strategy** con Mapa de Políticas de Precio: Crea un registro de
 *    estrategias de precio (`normal`, `vip`, `liquidacion`) e inyéctalo en un
 *    cotizador.
 *
 * [Intermedio]
 * 4. Patrón **Factory** con Validación y Registro Dinámico: Implementa una
 *    `FabricaMediosNotificacion` donde puedas registrar nuevos canales en tiempo
 *    de ejecución (`registrarCanal(tipo, creador)`) y crearlos bajo demanda.
 * 5. Patrón **Decorator** para Resiliencia y Caché: Crea dos decoradores
 *    componibles `conCache(fn)` y `conReintentos(fn, max)` y aplícalos a una
 *    función simulada de consulta externa.
 * 6. Patrón **Observer / Pub-Sub** Inmutable: Implementa tu propio `BusEventos`
 *    (con métodos `suscribir(evento, listener)` que retorne una función
 *    `desuscribir()`, `unaVez(evento, listener)` y `publicar(evento, datosCongelados)`).
 * 7. Inversión de Dependencias (DIP) y Patrón **Repository**: Crea un caso de
 *    uso `TransferirFondosUseCase` que reciba `{ repositorioCuentas, logger }`
 *    por inyección de dependencias.
 *
 * [Senior / Producción]
 * 8. Patrón **Proxy** Nativo de ES6 para Validación y Observabilidad: Usa
 *    `new Proxy(objetoObjetivo, { get, set })` para crear un modelo reactivo que
 *    valide los tipos en cada asignación (`set`) y emita un evento automático
 *    cada vez que cambie una propiedad.
 * 9. Patrón **Middleware Pipeline** Asíncrono (Estilo Koa / Express): Implementa
 *    `componerMiddlewares(listaMiddlewares)` donde cada middleware es
 *    `async (ctx, next) => { ... await next(); ... }` (modelo "cebolla" / *Onion
 *    Architecture*).
 * 10. Patrón **Circuit Breaker** (Cortacircuitos de Resiliencia en Microservicios):
 *     Implementa un envoltorio con estados `'CERRADO'`, `'ABIERTO'` y
 *     `'SEMI_ABIERTO'` que deje de llamar a un servicio caído tras $N$ fallos
 *     consecutivos y pruebe su recuperación pasado un tiempo de enfriamiento.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
