/*
 * ============================================================================
 * TEMA 29: CLEAN CODE, PRINCIPIOS SOLID Y PATRONES DE DISEÑO TIPADOS
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: depender de contratos, no de clases)
 * ----------------------------------------------------------------------------
 * El código se lee 10 veces más de lo que se escribe. Clean Code y SOLID son
 * reglas para que un sistema pueda cambiar sin romperse. En TypeScript el
 * "contrato" es un `interface` o `type`, y el sistema de tipos es ESTRUCTURAL:
 * cualquier objeto con la forma correcta cumple la interfaz, aunque no use
 * `implements` (no hay herencia nominal como en Java o C#).
 *
 * - **S (Responsabilidad única)**: una clase/módulo tiene una sola razón para
 *   cambiar (calcular, persistir y notificar son tres responsabilidades).
 * - **O (Abierto/Cerrado)**: agregar un canal o un medio de pago debe ser
 *   añadir código nuevo, no editar un `if` gigante. Uniones de literales +
 *   `switch` exhaustivo con `never` hacen que el compilador te avise dónde.
 * - **L (Sustitución de Liskov)**: un subtipo no debe sorprender: si `Ave`
 *   tiene `volar()`, un `Pinguino` que lanza error viola el contrato. TS
 *   detecta firmas incompatibles, pero no comportamientos incompatibles.
 * - **I (Segregación de interfaces)**: muchas interfaces pequeñas
 *   (`Lector<T>`, `Escritor<T>`) mejor que una "interfaz Dios".
 * - **D (Inversión de dependencias)**: la lógica de negocio recibe por el
 *   constructor abstracciones (`Notificador`, `Reloj`, `Repositorio<T>`), lo
 *   que permite inyectar dobles de prueba sin frameworks.
 *
 * Patrones con soporte de tipos: Strategy (funciones o interfaces), Factory
 * (con `switch` exhaustivo o `Record<Tipo, () => T>`), Observer (bus de eventos
 * con mapa de payloads), Decorator/Adapter (envolver una interfaz), Builder
 * (con encadenamiento que devuelve `this`) y Result (`{ ok: true } | { ok: false }`).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - SaaS de facturación: canales de notificación intercambiables (email, SMS,
 *   push, WhatsApp) sin tocar la lógica de cobranza.
 * - Pasarelas de pago múltiples detrás de una interfaz `ProcesadorPago`.
 * - Módulos desacoplados que se comunican con eventos tipados (dominio ->
 *   auditoría, analítica, correo).
 * - Pruebas unitarias rápidas inyectando repositorios y relojes falsos.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // Interfaces pequeñas y genéricas (ISP):
 * interface Lector<T, Id> { buscar(id: Id): Promise<T | undefined>; }
 * interface Escritor<T> { guardar(entidad: T): Promise<void>; }
 * type Repositorio<T, Id> = Lector<T, Id> & Escritor<T>;
 *
 * // Strategy como tipo función + Record exhaustivo (OCP):
 * type PoliticaDescuento = (subtotal: number) => number;
 * type Plan = 'FREE' | 'PRO' | 'ENTERPRISE';
 * const descuentos = {
 *     FREE: () => 0,
 *     PRO: (s) => s * 0.1,
 *     ENTERPRISE: (s) => Math.min(s * 0.2, 500),
 * } satisfies Record<Plan, PoliticaDescuento>; // falta una clave => error
 *
 * // Clases abstractas para comportamiento común (Template Method):
 * abstract class Exportador {
 *     exportar(filas: readonly string[]): string { return this.cabecera() + filas.join('\n'); }
 *     protected abstract cabecera(): string;
 * }
 *
 * // Reloj inyectable (DIP): en pruebas devuelve una fecha fija.
 * interface Reloj { ahora(): Date; }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un SaaS de facturación combina Factory exhaustiva, Strategy por
 * interfaz, Observer con eventos tipados y DIP: `ServicioCobranza` recibe los
 * canales y el bus por el constructor y nunca hace `new CanalEmail()`.
 *
 * type TipoCanal = 'email' | 'sms' | 'push';
 *
 * interface CanalNotificacion {
 *     readonly tipo: TipoCanal;
 *     enviar(destino: string, mensaje: string): string;
 * }
 *
 * class CanalEmail implements CanalNotificacion {
 *     readonly tipo = 'email' as const;
 *     enviar(destino: string, mensaje: string): string { return `[EMAIL ${destino}] ${mensaje}`; }
 * }
 * class CanalSms implements CanalNotificacion {
 *     readonly tipo = 'sms' as const;
 *     enviar(destino: string, mensaje: string): string { return `[SMS ${destino}] ${mensaje.slice(0, 20)}`; }
 * }
 * class CanalPush implements CanalNotificacion {
 *     readonly tipo = 'push' as const;
 *     enviar(destino: string, mensaje: string): string { return `[PUSH ${destino}] ${mensaje}`; }
 * }
 *
 * // Factory con comprobación exhaustiva: añadir un TipoCanal rompe la compilación aquí
 * function crearCanal(tipo: TipoCanal): CanalNotificacion {
 *     switch (tipo) {
 *         case 'email': return new CanalEmail();
 *         case 'sms': return new CanalSms();
 *         case 'push': return new CanalPush();
 *         default: {
 *             const exhaustivo: never = tipo;
 *             throw new Error(`Canal no soportado: ${String(exhaustivo)}`);
 *         }
 *     }
 * }
 *
 * // Observer tipado: cada evento tiene su propio tipo de payload
 * type EventosFacturacion = {
 *     'factura.emitida': { numero: string; total: number };
 *     'factura.vencida': { numero: string; diasMora: number };
 * };
 *
 * class BusEventos<E extends Record<string, object>> {
 *     private readonly oyentes: { [K in keyof E]?: Array<(payload: E[K]) => void> } = {};
 *
 *     on<K extends keyof E>(evento: K, oyente: (payload: E[K]) => void): void {
 *         const lista = this.oyentes[evento] ?? [];
 *         lista.push(oyente);
 *         this.oyentes[evento] = lista;
 *     }
 *
 *     emit<K extends keyof E>(evento: K, payload: E[K]): void {
 *         for (const oyente of this.oyentes[evento] ?? []) oyente(payload);
 *     }
 * }
 *
 * // DIP: el servicio depende de abstracciones inyectadas, no de clases concretas
 * class ServicioCobranza {
 *     readonly #canales: readonly CanalNotificacion[];
 *     readonly #log: string[] = [];
 *
 *     constructor(canales: readonly CanalNotificacion[], bus: BusEventos<EventosFacturacion>) {
 *         this.#canales = canales;
 *         bus.on('factura.vencida', ({ numero, diasMora }) => {
 *             for (const canal of this.#canales) {
 *                 this.#log.push(canal.enviar('cliente-42', `Factura ${numero} vencida hace ${diasMora} días`));
 *             }
 *         });
 *     }
 *
 *     get historial(): readonly string[] { return this.#log; }
 * }
 *
 * const bus = new BusEventos<EventosFacturacion>();
 * const cobranza = new ServicioCobranza((['email', 'sms'] as const).map(crearCanal), bus);
 * bus.on('factura.emitida', (f) => console.log(`Emitida ${f.numero} por ${f.total.toFixed(2)}`));
 *
 * bus.emit('factura.emitida', { numero: 'F-1001', total: 1250 });
 * bus.emit('factura.vencida', { numero: 'F-0999', diasMora: 15 });
 * // bus.emit('factura.vencida', { numero: 'F-1' }); // Error de compilación: falta diasMora
 * console.log(cobranza.historial);
 *
 * // Salida esperada:
 * // Emitida F-1001 por 1250.00
 * // [
 * //   '[EMAIL cliente-42] Factura F-0999 vencida hace 15 días',
 * //   '[SMS cliente-42] Factura F-0999 venci'
 * // ]
 *
 * (Node imprime el arreglo en varias líneas porque supera los 72 caracteres.)
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - NOMBRES QUE REVELAN INTENCIÓN: `diasMora` y no `d`; funciones con verbo
 *   (`calcularMora`), booleanos con `es`/`tiene`/`puede`. Funciones cortas, un
 *   nivel de abstracción y máximo 3 parámetros (si no, un objeto tipado).
 * - `implements` NO HEREDA NADA NI EXISTE EN RUNTIME: solo verifica la forma
 *   en compilación. Tampoco puedes hacer `x instanceof MiInterfaz`; usa
 *   uniones discriminadas (`tipo`) o type guards.
 * - TIPADO ESTRUCTURAL = SIN TIPOS NOMINALES: `type IdCliente = string` e
 *   `type IdFactura = string` son intercambiables; si confundirlos es grave,
 *   usa *branded types* (tema 30).
 * - NO CREES INTERFACES "POR SI ACASO": una abstracción con una sola
 *   implementación y sin necesidad de pruebas es complejidad gratuita (YAGNI).
 * - HERENCIA PROFUNDA ES FRÁGIL: prefiere composición e inyección. `protected`
 *   acopla a las subclases con los detalles internos del padre.
 * - EVITA `enum` NUMÉRICOS: aceptan cualquier número (`const e: Estado = 99`
 *   compila en versiones antiguas) y generan código en runtime. Prefiere uniones
 *   de literales o objetos `as const`; con `erasableSyntaxOnly` (TS 5.8) los
 *   `enum` directamente no se permiten.
 * - PATRONES COMO HERRAMIENTA, NO COMO META: en TS muchas veces una función de
 *   orden superior reemplaza a una jerarquía Strategy de cinco clases.
 * - Automatiza el estilo: ESLint (`typescript-eslint` con `strict-type-checked`)
 *   y Prettier en el CI; las revisiones humanas se centran en el diseño.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Refactoriza una función `procesar(d: any)` de 60 líneas que valida,
 *    calcula impuestos y envía un correo en tres funciones tipadas con nombres
 *    expresivos (SRP).
 * 2. Reemplaza "números mágicos" (`0.19`, `86400000`, `3`) por constantes
 *    `as const` con nombre y un objeto de configuración `Readonly`.
 * 3. Tabla de descuentos por plan con `satisfies Record<Plan, PoliticaDescuento>`
 *    y demuestra el error al olvidar un plan.
 *
 * [Intermedio]
 * 4. Strategy de envío: `CalculadoraEnvio` que reciba una interfaz
 *    `TarifaEnvio` (`Estandar`, `Express`, `Internacional`) sin ningún `if`.
 * 5. Segregación: divide una interfaz `ServicioUsuarios` con 9 métodos en
 *    interfaces pequeñas y muestra qué cliente usa cada una.
 * 6. Decorator: `ConReintentos` que implemente `ProcesadorPago` envolviendo
 *    otro `ProcesadorPago` y reintente ante errores transitorios.
 * 7. Builder tipado de reportes (`new ReporteBuilder().titulo(...).columnas(...)`)
 *    que impida llamar a `construir()` sin título (estado en el tipo genérico).
 *
 * [Senior / Producción]
 * 8. `BusEventos<E>` completo: `on` que devuelva la función para darse de baja,
 *    `once`, aislamiento de errores de oyentes y pruebas con `node:assert/strict`.
 * 9. Inyección de dependencias manual: `crearContenedor()` con raíz de
 *    composición que arme servicios de producción y otro de pruebas con
 *    `RelojFijo` y `RepositorioEnMemoria`.
 * 10. Refactor de legado: transforma una clase `GestorPedidos` de 300 líneas con
 *     `switch` por tipo de cliente en un diseño SOLID con uniones discriminadas,
 *     Strategy y Result, manteniendo verdes las pruebas de caracterización.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
