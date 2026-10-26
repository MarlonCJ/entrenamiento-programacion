'use strict';

/*
 * ============================================================================
 * TEMA 21: HERENCIA, CADENA DE PROTOTIPOS, POLIMORFISMO Y COMPOSICIÓN
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Prototipos y Polimorfismo en JS)
 * ----------------------------------------------------------------------------
 * A diferencia de Java o C++, bajo el capó de `class B extends A` en JavaScript
 * existe la **Delegación por Cadena de Prototipos** (*Prototype Chain*):
 * - Cuando invocas `instancia.calcular()`, el motor V8 busca primero `calcular`
 *   en el propio objeto `instancia`; si no está ahí, sube a su prototipo
 *   (`Object.getPrototypeOf(instancia)`, es decir `B.prototype`); si tampoco
 *   está ahí, sube a `A.prototype`, y así hasta llegar a `Object.prototype` y
 *   finalmente a `null`.
 *
 * Polimorfismo y *Duck Typing* en JavaScript:
 * - Como JavaScript no tiene la palabra clave `interface` en tiempo de ejecución,
 *   aplica **Polimorfismo por Contrato / Duck Typing** (*"Si camina como pato y
 *   grazna como pato, es un pato"*): dos clases o fábricas completamente
 *   independientes pueden ser consumidas de manera polimórfica siempre que
 *   expongan los mismos métodos (`procesarPago(monto)`).
 * - Para simular una **Clase Base Abstracta**, en el constructor de la clase
 *   base se verifica `if (new.target === ClaseAbstracta) throw new TypeError(...)`,
 *   impidiendo que se instancie directamente con `new ClaseAbstracta()`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Polimorfismo de Adaptadores (Pagos, Almacenamiento, Notificaciones):
 *   Cualquier objeto con un método `.enviar(destinatario, mensaje)` puede
 *   inyectarse en el servicio de alertas sin necesidad de heredar de la misma clase.
 * - Jerarquías Cortas de Excepciones o Componentes Base (`extends` + `super()`).
 * - **Composición sobre Herencia**: Combinar capacidades mediante objetos
 *   colaboradores inyectados o funciones fábrica en vez de cadenas de herencia
 *   profundas.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Simulación de Clase Abstracta con new.target y herencia con extends/super:
 * class MedioPagoBase {
 *     constructor(nombre) {
 *         if (new.target === MedioPagoBase) {
 *             throw new TypeError('MedioPagoBase es abstracta y no puede instanciarse');
 *         }
 *         this.nombre = nombre;
 *     }
 *
 *     cobrar(_monto) {
 *         throw new Error(`El método cobrar() debe ser implementado por ${this.constructor.name}`);
 *     }
 * }
 *
 * class PagoTarjeta extends MedioPagoBase {
 *     constructor(ultimos4) {
 *         super('Tarjeta de Crédito'); // super() debe llamarse antes de usar `this`!
 *         this.ultimos4 = ultimos4;
 *     }
 *
 *     cobrar(monto) {
 *         return `[${this.nombre} *${this.ultimos4}] Cobrado $${monto}`;
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un exportador de reportes procesa una lista polimórfica de
 * estrategias de almacenamiento (Disco Local y Nube S3) sin usar condicionales
 * por tipo.
 *
 * class AlmacenamientoLocal {
 *     guardar(nombre, bytes) {
 *         return `[DISCO] Guardado ${nombre} (${bytes} bytes)`;
 *     }
 * }
 *
 * class AlmacenamientoNubeS3 {
 *     #bucket;
 *     constructor(bucket) { this.#bucket = bucket; }
 *     guardar(nombre, bytes) {
 *         return `[S3://${this.#bucket}] Subido ${nombre} (${bytes} bytes)`;
 *     }
 * }
 *
 * function respaldarEnDestinos(destinos, archivo, tamano) {
 *     return destinos.map((destino) => destino.guardar(archivo, tamano));
 * }
 *
 * const logs = respaldarEnDestinos(
 *     [new AlmacenamientoLocal(), new AlmacenamientoNubeS3('backups-prod')],
 *     'db_2026.sql',
 *     4096
 * );
 * console.log(logs.join('\n'));
 * // Salida esperada:
 * // [DISCO] Guardado db_2026.sql (4096 bytes)
 * // [S3://backups-prod] Subido db_2026.sql (4096 bytes)
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - EN UN CONSTRUCTOR HIJO (`extends`), NO PUEDES USAR `this` ANTES DE LLAMAR A `super()`:
 *   Si intentas acceder a `this.prop` antes de `super()`, el motor V8 lanzará
 *   `ReferenceError: Must call super constructor in derived class before accessing 'this'`.
 * - NUNCA MODIFIQUES LOS PROTOTIPOS NATIVOS (`Array.prototype`, `Object.prototype`):
 *   Esta práctica antigua (*Monkey Patching*) contamina todos los objetos del
 *   proceso y puede colisionar con futuras versiones de ECMAScript o librerías.
 * - PREFIERE LA COMPOSICIÓN SOBRE LA HERENCIA PROFUNDA: Nunca crees árboles de
 *   herencia de más de 2 niveles (`A -> B -> C -> D`). Inyecta colaboradores en
 *   el constructor (`new Pedido({ calculadoraImpuesto, pasarelaPago })`).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Jerarquía de Empleados con `extends` y `super`: Crea `Empleado` con
 *    `calcularPagoMensual()` y las subclases `EmpleadoAsalariado` y
 *    `EmpleadoPorComision` (que usa `super.calcularPagoMensual() + comision`).
 * 2. Clase abstracta con `new.target`: Crea una clase base `NotificadorBase`
 *    que lance `TypeError` si se intenta instanciar directamente con `new`, pero
 *    permita instanciar sus subclases `NotificadorEmail` y `NotificadorSms`.
 * 3. Inspección de la cadena de prototipos: Usa `Object.getPrototypeOf()` e
 *    `instanceof` para demostrar cómo se conectan una instancia, la subclase,
 *    la superclase y `Object.prototype`.
 *
 * [Intermedio]
 * 4. Polimorfismo por *Duck Typing* y Validador de Contrato: Crea una función
 *    `asegurarContratoPasarela(obj)` que verifique que `obj` tenga los métodos
 *    `autorizar` y `capturar` (`typeof obj?.autorizar === 'function'`) antes de
 *    usarlo polimórficamente.
 * 5. Patrón *Template Method*: Crea una clase base `ProcesadorETL` con un método
 *    orquestador `ejecutar(datos)` que llame en orden a `extraer()`, `transformar()`
 *    y `cargar()`, delegando `transformar()` a las subclases.
 * 6. Refactorización de Herencia Rígida a Composición: Reemplaza una clase
 *    `UsuarioConNotificacionEmailYAuditoriaConsola` por una clase `ServicioUsuario`
 *    que recibe por composición un `notificador` y un `auditor`.
 * 7.Objetos sin prototipo (`Object.create(null)`): Demuestra cómo crear un
 *    diccionario puro sin heredar de `Object.prototype` para que claves como
 *    `"toString"` o `"__proto__"` no colisionen con métodos nativos.
 *
 * [Senior / Producción]
 * 8. Mixins Funcionales de Clases (`const ConMarcasDeTiempo = (Base) => class extends Base { ... }`):
 *    Implementa dos Mixins componibles (`ConAuditoria` y `ConBorradoLogico`) que
 *    puedan aplicarse a cualquier clase base para compartir comportamiento
 *    horizontal sin herencia múltiple.
 * 9. Polimorfismo Funcional vs Polimorfismo Orientado a Objetos: Resuelve el
 *    mismo problema de cálculo de tarifas de envío de 3 tipos de paquetes usando
 *    primero clases polimórficas y luego objetos de datos con un mapa de funciones,
 *    comparando ambos enfoques.
 * 10. Cadena de Responsabilidad Polimórfica (*Middleware Pipeline*): Crea una
 *     arquitectura de validadores de peticiones HTTP donde cada validador cumple
 *     el mismo contrato `manejar(contexto, siguiente)` y puede cortar el flujo
 *     o delegar al siguiente.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
