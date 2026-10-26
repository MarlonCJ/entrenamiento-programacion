/*
 * ============================================================================
 * TEMA 21: HERENCIA, CLASES ABSTRACTAS, POLIMORFISMO Y COMPOSICIÓN
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Herencia en TypeScript)
 * ----------------------------------------------------------------------------
 * HERENCIA (`extends`) reutiliza y especializa comportamiento; POLIMORFISMO
 * permite tratar objetos distintos a través de un mismo contrato y que cada
 * uno responda a su manera. En TypeScript conviven dos niveles:
 *
 * 1) **Runtime (JavaScript)**: `class B extends A` enlaza la cadena de
 *    prototipos: `Object.getPrototypeOf(B.prototype) === A.prototype`. Al
 *    llamar `b.metodo()` el motor busca en la instancia, luego en
 *    `B.prototype`, luego en `A.prototype`... (despacho dinámico). Solo hay
 *    herencia SIMPLE de clases.
 * 2) **Compilación (TypeScript)**: añade `abstract` (clases y métodos que no
 *    se pueden instanciar/llamar directamente), `implements` (verifica que una
 *    clase cumple uno o VARIOS contratos), `override` (marca explícita de
 *    sobrescritura) y modificadores `protected`. Todo esto se BORRA al compilar:
 *    `interface` no existe en runtime, así que `x instanceof Cotizable` es
 *    imposible; las clases abstractas sí existen (son funciones normales).
 *
 * Además, el TIPADO ESTRUCTURAL hace que el polimorfismo no requiera herencia:
 * cualquier objeto con los métodos adecuados cumple la interfaz ("duck typing
 * verificado"). Y las UNIONES DISCRIMINADAS ofrecen una alternativa funcional
 * a las jerarquías, con comprobación exhaustiva mediante `never`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Template Method: una clase abstracta fija el algoritmo (validar ->
 *   calcular -> registrar) y las subclases implementan pasos concretos.
 * - Estrategias intercambiables: pasarelas de pago, transportistas, motores
 *   de notificación que implementan la misma interfaz.
 * - Jerarquías de errores: `class ErrorDominio extends Error` y subclases
 *   (`SaldoInsuficienteError`) para capturar con `instanceof`.
 * - Composición/decoradores: añadir caché, reintentos, logging o seguros a un
 *   servicio sin tocar su código ni crear subclases por cada combinación.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (TS 5.x, `noImplicitOverride: true`)
 * ----------------------------------------------------------------------------
 * interface Notificable { notificar(mensaje: string): Promise<void> }
 * interface Auditable { readonly auditoria: string[] }
 *
 * abstract class Canal implements Notificable {
 *     constructor(protected readonly destino: string) {}
 *     abstract notificar(mensaje: string): Promise<void>;     // sin cuerpo
 *     protected formatear(m: string): string { return `[${this.destino}] ${m}`; }
 * }
 *
 * class CanalSms extends Canal implements Auditable {
 *     readonly auditoria: string[] = [];
 *     constructor(telefono: string) { super(telefono); }      // super() primero
 *     override async notificar(m: string): Promise<void> {
 *         this.auditoria.push(this.formatear(m));
 *     }
 *     protected override formatear(m: string): string {
 *         return super.formatear(m).slice(0, 160);            // reutiliza al padre
 *     }
 * }
 *
 * // Alternativa sin clases: unión discriminada + exhaustividad
 * type Pago = { tipo: 'tarjeta'; ultimos4: string } | { tipo: 'pse'; banco: string };
 * function describir(p: Pago): string {
 *     switch (p.tipo) {
 *         case 'tarjeta': return `**** ${p.ultimos4}`;
 *         case 'pse': return `PSE ${p.banco}`;
 *         default: { const imposible: never = p; return imposible; }
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un marketplace cotiza envíos de 12 kg a 400 km. Una clase
 * abstracta `Transportista` aplica Template Method; `Terrestre` y `Aereo`
 * especializan pasos con `override`, y `ConSeguro` añade un seguro por
 * COMPOSICIÓN a cualquier `Cotizable`, sin heredar.
 *
 * interface Cotizable {
 *     readonly nombre: string;
 *     cotizar(pesoKg: number, distanciaKm: number): number;
 * }
 *
 * abstract class Transportista implements Cotizable {
 *     constructor(readonly nombre: string, private readonly tarifaBase: number) {}
 *
 *     // Template Method: el algoritmo es fijo; las subclases definen los pasos.
 *     cotizar(pesoKg: number, distanciaKm: number): number {
 *         const costo = this.tarifaBase + this.costoVariable(pesoKg, distanciaKm);
 *         return Math.round(costo * this.recargo());
 *     }
 *
 *     protected abstract costoVariable(pesoKg: number, distanciaKm: number): number;
 *
 *     protected recargo(): number {
 *         return 1;
 *     }
 * }
 *
 * class Terrestre extends Transportista {
 *     constructor() {
 *         super('Terrestre', 8_000);
 *     }
 *     protected override costoVariable(pesoKg: number, distanciaKm: number): number {
 *         return pesoKg * 300 + distanciaKm * 45;
 *     }
 * }
 *
 * class Aereo extends Transportista {
 *     constructor(private readonly temporadaAlta: boolean) {
 *         super(temporadaAlta ? 'Aéreo (alta)' : 'Aéreo', 25_000);
 *     }
 *     protected override costoVariable(pesoKg: number): number {   // ignora la distancia
 *         return pesoKg * 1_800;
 *     }
 *     protected override recargo(): number {
 *         return this.temporadaAlta ? 1.2 : 1;
 *     }
 * }
 *
 * // Composición (decorador): añade un seguro a CUALQUIER Cotizable sin heredar.
 * class ConSeguro implements Cotizable {
 *     constructor(private readonly base: Cotizable, private readonly valorDeclarado: number) {}
 *     get nombre(): string {
 *         return `${this.base.nombre} + seguro`;
 *     }
 *     cotizar(pesoKg: number, distanciaKm: number): number {
 *         return this.base.cotizar(pesoKg, distanciaKm) + Math.round(this.valorDeclarado * 0.01);
 *     }
 * }
 *
 * const opciones: readonly Cotizable[] = [
 *     new Terrestre(),
 *     new Aereo(false),
 *     new Aereo(true),
 *     new ConSeguro(new Terrestre(), 2_000_000),
 * ];
 *
 * for (const opcion of opciones) {        // polimorfismo: misma llamada, distinto cálculo
 *     const tipo = opcion instanceof Transportista ? 'herencia' : 'composición';
 *     console.log(`${opcion.nombre.padEnd(20)} ${opcion.cotizar(12, 400)} [${tipo}]`);
 * }
 *
 * const masBarata = opciones.reduce((a, b) => (b.cotizar(12, 400) < a.cotizar(12, 400) ? b : a));
 * console.log(`Más barata: ${masBarata.nombre}`);
 * console.log(Object.getPrototypeOf(Aereo.prototype) === Transportista.prototype);
 *
 * // Salida esperada:
 * // Terrestre            29600 [herencia]
 * // Aéreo                46600 [herencia]
 * // Aéreo (alta)         55920 [herencia]
 * // Terrestre + seguro   49600 [composición]
 * // Más barata: Terrestre
 * // true
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - PREFIERE COMPOSICIÓN SOBRE HERENCIA: jerarquías de más de 2 niveles son
 *   frágiles (cambiar el padre rompe a los hijos: "fragile base class").
 *   `ConSeguro` combina con cualquier transportista; con herencia necesitarías
 *   `TerrestreConSeguro`, `AereoConSeguro`... (explosión de subclases).
 * - ACTIVA `noImplicitOverride`: obliga a escribir `override`; si renombras el
 *   método del padre, el compilador avisa en vez de crear un método huérfano.
 * - NO LLAMES MÉTODOS SOBRESCRITOS DESDE EL CONSTRUCTOR DEL PADRE: se ejecuta
 *   la versión del hijo ANTES de que se inicialicen los campos del hijo
 *   (verás `undefined` en runtime aunque TS compile sin quejas).
 * - `super()` ANTES DE `this`: en clases derivadas es obligatorio en JS
 *   (ReferenceError si no) y TS lo verifica.
 * - `instanceof` NO FUNCIONA CON INTERFACES (no existen en runtime). Usa
 *   predicados de tipo `esCotizable(x): x is Cotizable` o uniones discriminadas.
 * - SUBCLASES DE `Error`: con target ES2015+ funcionan bien; si compilas a
 *   ES5, `instanceof` falla salvo que uses `Object.setPrototypeOf(this, new.target.prototype)`.
 * - PRINCIPIO DE LISKOV: una subclase no debe exigir más ni prometer menos
 *   que su padre (no lances errores donde el padre no lo hacía). TS comprueba
 *   firmas compatibles, pero no la semántica.
 * - Los parámetros de métodos son BIVARIANTES en TS (por compatibilidad);
 *   declara callbacks como propiedades `fn: (x: T) => void` para que
 *   `strictFunctionTypes` los verifique de forma contravariante.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Crea `abstract class Empleado` con `nombre` y `abstract salarioMensual()`,
 *    y las subclases `EmpleadoFijo` y `Contratista` (por horas).
 * 2. Añade a `Empleado` un método `describir()` y sobrescríbelo en
 *    `Contratista` usando `override` y `super.describir()`.
 * 3. Recorre un `Empleado[]` y calcula la nómina total aprovechando el
 *    polimorfismo (sin `if` por tipo).
 *
 * [Intermedio]
 * 4. Interfaces múltiples: `class Dron implements Volador, ConBateria` y una
 *    función genérica `inspeccionar<T extends Volador & ConBateria>(x: T)`.
 * 5. Jerarquía de errores: `ErrorPago` y subclases `TarjetaRechazada` y
 *    `FondosInsuficientes` con un campo `codigo`; captúralas con `instanceof`.
 * 6. Reescribe el ejemplo de transportistas como unión discriminada
 *    (`{ tipo: 'terrestre' } | { tipo: 'aereo'; temporadaAlta: boolean }`) con
 *    un `switch` exhaustivo que use `never`.
 * 7. Demuestra el gotcha del constructor: un padre que llama `this.iniciar()`
 *    sobrescrito por un hijo que usa un campo propio aún no inicializado.
 *
 * [Senior / Producción]
 * 8. Decoradores componibles: `ConReintentos` y `ConCache` que envuelvan
 *    cualquier `ClienteHttp` (interfaz con `obtener(url): Promise<string>`).
 * 9. Mixins tipados: `function ConMarcaDeTiempo<TBase extends new (...args: any[])
 *    => object>(Base: TBase)` que añada `creadoEn`, y aplícalo a dos clases.
 * 10. Plugin de exportación: diseña `abstract class Exportador<T>` con Template
 *     Method (`validar`, `serializar`, `encabezado`) y dos implementaciones
 *     (CSV y JSON Lines) para una lista de pacientes de una clínica.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
