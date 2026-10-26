/*
 * ============================================================================
 * TEMA 20: CLASES EN TYPESCRIPT (MODIFICADORES, #PRIVADOS, READONLY E INVARIANTES)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: un objeto que se defiende solo)
 * ----------------------------------------------------------------------------
 * Una clase agrupa ESTADO y COMPORTAMIENTO y, sobre todo, protege sus
 * INVARIANTES: reglas que deben cumplirse siempre (un saldo nunca es
 * negativo, un correo siempre es válido). En runtime una clase de TS es una
 * clase de JavaScript (azúcar sobre prototipos); TS añade una capa de
 * modificadores que conviene distinguir con precisión:
 *
 * 1) `public` (por defecto), `protected` (la clase y sus subclases) y
 *    `private`: SOLO existen en compilación. En el `.js` emitido la propiedad
 *    es normal y se ve con `Object.keys` o `obj['campo']`.
 * 2) `#campo` (ES2022): privacidad REAL en runtime, imposible de leer desde
 *    fuera (ni con corchetes ni con `JSON.stringify`). Úsalo para datos que
 *    protegen invariantes; `private` basta para detalles internos.
 * 3) `readonly`: la propiedad solo se asigna en su declaración o en el
 *    constructor. Es superficial (un `readonly items: string[]` aún admite
 *    `push`) y no existe en runtime.
 * 4) Parameter properties: `constructor(readonly id: string, private repo:
 *    Repo) {}` declara y asigna en una línea.
 * 5) `implements Interfaz`: TS comprueba que la clase cumple el contrato
 *    (no hereda código). Las clases son estructurales: cualquier objeto con
 *    la misma forma pública es compatible.
 * 6) Constructores `private` + fábricas `static`: validan antes de crear y
 *    garantizan que nunca exista una instancia inválida.
 * 7) Getters sin setter = propiedad de solo lectura; retornar `this` permite
 *    encadenar métodos (fluent API) sin perder el tipo en subclases.
 * 8) `strictPropertyInitialization` exige inicializar cada propiedad en el
 *    constructor; `campo!: T` desactiva la comprobación (evítalo).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Entidades y value objects de dominio (DDD): `Pedido`, `Dinero`, `Correo`.
 * - Servicios con dependencias inyectadas por constructor (NestJS, Angular).
 * - Clientes de APIs y repositorios que encapsulan conexión y caché.
 * - Errores de dominio (`class SaldoInsuficienteError extends Error`).
 * - Cualquier objeto con reglas que no deben poder saltarse desde fuera.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * interface Identificable { readonly id: string; }
 *
 * class Producto implements Identificable {
 *     static readonly IVA = 0.19;                // propiedad de clase
 *     #stock = 0;                                // privado real (runtime)
 *     protected notas: string[] = [];            // visible en subclases
 *
 *     constructor(
 *         readonly id: string,                    // parameter property pública
 *         private precioBase: number,             // privada (solo compilación)
 *     ) {
 *         if (precioBase <= 0) throw new RangeError('Precio inválido');
 *     }
 *
 *     get precioFinal(): number { return this.precioBase * (1 + Producto.IVA); }
 *     get stock(): number { return this.#stock; }  // lectura pública, escritura no
 *
 *     reponer(unidades: number): this {            // `this` permite encadenar
 *         this.#stock += unidades;
 *         return this;
 *     }
 * }
 *
 * class Correo {                                  // value object con fábrica
 *     private constructor(readonly valor: string) {}
 *     static crear(texto: string): Correo {
 *         const v = texto.trim().toLowerCase();
 *         if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) throw new TypeError('Correo inválido');
 *         return new Correo(v);
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Una fintech modela billeteras digitales. El saldo se guarda en
 * centavos en un campo `#privado` (evita errores de coma flotante y no se
 * puede manipular desde fuera), las billeteras solo se crean con una fábrica
 * que valida, cada operación protege la invariante "saldo >= 0" y el historial
 * se expone como copia de solo lectura.
 *
 * interface Auditable { historial(): readonly string[]; }
 * type Moneda = 'COP' | 'USD';
 *
 * class SaldoInsuficienteError extends Error {
 *     override readonly name = 'SaldoInsuficienteError';
 * }
 *
 * class Billetera implements Auditable {
 *     static #secuencia = 0;                         // contador privado de la clase
 *     #saldoCentavos = 0;                            // privado REAL en runtime
 *     private readonly movimientos: string[] = [];   // privado solo en compilación
 *
 *     private constructor(
 *         readonly id: string,
 *         readonly titular: string,
 *         readonly moneda: Moneda,
 *     ) {}
 *
 *     static abrir(titular: string, moneda: Moneda): Billetera {
 *         const nombre = titular.trim();
 *         if (nombre.length < 3) throw new RangeError('Titular inválido');
 *         Billetera.#secuencia += 1;
 *         return new Billetera(`BIL-${String(Billetera.#secuencia).padStart(3, '0')}`, nombre, moneda);
 *     }
 *
 *     get saldo(): number { return this.#saldoCentavos / 100; }
 *
 *     depositar(monto: number): this {
 *         this.#exigirMontoValido(monto);
 *         this.#saldoCentavos += Math.round(monto * 100);
 *         this.movimientos.push(`+${monto.toFixed(2)}`);
 *         return this;
 *     }
 *
 *     retirar(monto: number): this {
 *         this.#exigirMontoValido(monto);
 *         const centavos = Math.round(monto * 100);
 *         if (centavos > this.#saldoCentavos) {
 *             throw new SaldoInsuficienteError(`Saldo insuficiente en ${this.id}`);
 *         }
 *         this.#saldoCentavos -= centavos;
 *         this.movimientos.push(`-${monto.toFixed(2)}`);
 *         return this;
 *     }
 *
 *     transferir(destino: Billetera, monto: number): void {
 *         if (destino.moneda !== this.moneda) throw new TypeError('Monedas distintas');
 *         this.retirar(monto);                        // si falla, no se deposita nada
 *         destino.depositar(monto);
 *     }
 *
 *     historial(): readonly string[] { return [...this.movimientos]; }
 *
 *     #exigirMontoValido(monto: number): void {
 *         if (!Number.isFinite(monto) || monto <= 0) throw new RangeError(`Monto inválido: ${monto}`);
 *     }
 *
 *     toString(): string {
 *         return `${this.id} ${this.titular}: ${this.moneda} ${this.saldo.toFixed(2)}`;
 *     }
 * }
 *
 * const ana = Billetera.abrir('  Ana Gómez ', 'USD');
 * const luis = Billetera.abrir('Luis Pérez', 'USD');
 * ana.depositar(150).depositar(49.99);                // API encadenable
 * ana.transferir(luis, 80.5);
 * console.log(`${ana}`);
 * console.log(`${luis}`);
 * console.log(ana.historial());
 *
 * try {
 *     luis.retirar(500);
 * } catch (e: unknown) {
 *     if (e instanceof SaldoInsuficienteError) console.log(`${e.name}: ${e.message}`);
 * }
 * try {
 *     ana.depositar(-5);
 * } catch (e: unknown) {
 *     console.log(e instanceof RangeError ? e.message : 'error desconocido');
 * }
 * console.log(Object.keys(ana));   // `private` se ve en runtime; `#saldoCentavos` no
 * // ana.saldo = 1_000_000;         // ❌ 'saldo' es de solo lectura (getter sin setter)
 * // new Billetera('X', 'Y', 'USD'); // ❌ el constructor es privado
 *
 * // Salida esperada:
 * // BIL-001 Ana Gómez: USD 119.49
 * // BIL-002 Luis Pérez: USD 80.50
 * // [ '+150.00', '+49.99', '-80.50' ]
 * // SaldoInsuficienteError: Saldo insuficiente en BIL-002
 * // Monto inválido: -5
 * // [ 'id', 'titular', 'moneda', 'movimientos' ]
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - VALIDA EN EL CONSTRUCTOR O EN LA FÁBRICA: un objeto nunca debe existir en
 *   estado inválido. Si construir puede fallar, usa constructor `private` +
 *   `static crear()` (que también puede devolver un `Result`).
 * - `private` NO ES SEGURIDAD: se borra al compilar. Para invariantes
 *   críticas usa `#campos`; recuerda que `#` no funciona con `Proxy` y no se
 *   hereda a subclases.
 * - NO EXPONGAS COLECCIONES INTERNAS: devolver `this.movimientos` permite
 *   `push` desde fuera. Devuelve una copia o un `readonly string[]`.
 * - EVITA GETTERS/SETTERS TRIVIALES PARA TODO (anémico): expón
 *   comportamiento con intención (`depositar`, `retirar`), no `setSaldo()`.
 * - NO PIERDAS `this`: pasar `billetera.depositar` como callback lo
 *   desvincula. Usa `(m) => billetera.depositar(m)` o una arrow como campo.
 * - DINERO EN ENTEROS (centavos) O `bigint`, nunca sumas de `number` con
 *   decimales sin redondear.
 * - EVITA `campo!: T`: el operador de asignación definitiva oculta
 *   propiedades sin inicializar; inicializa en el constructor.
 * - PREFIERE COMPOSICIÓN A JERARQUÍAS PROFUNDAS (tema 21) y mantén las clases
 *   pequeñas, con una sola responsabilidad.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Rectángulo: clase con `readonly ancho` y `readonly alto` como parameter
 *    properties, validación de valores positivos y getters `area`/`perimetro`.
 * 2. Contador con límite: `class Contador` con `#valor`, `incrementar():
 *    this` y un máximo que nunca se supere.
 * 3. `private` vs `#`: crea una clase con un campo de cada tipo, accede a
 *    ambos con `obj['campo']` y `JSON.stringify` y explica el resultado.
 *
 * [Intermedio]
 * 4. Value object `Correo`: constructor privado, `static crear(texto):
 *    Correo`, método `equals(otro: Correo): boolean` y dominio en un getter.
 * 5. Carrito de compras: `class Carrito` con `Map` privado de líneas,
 *    `agregar(sku, precio, cantidad)`, `quitar(sku)` y `total` calculado,
 *    sin cantidades negativas.
 * 6. `implements`: define `interface Notificador { enviar(destino: string,
 *    mensaje: string): Promise<boolean> }` e implementa `NotificadorEmail` y
 *    `NotificadorFalso` (para pruebas).
 * 7. Inyección por constructor: `class ServicioPedidos` que reciba un
 *    `RepositorioPedidos` y un `Notificador` como `private readonly`.
 *
 * [Senior / Producción]
 * 8. Dinero inmutable: `class Dinero` con `bigint` en centavos, `readonly
 *    moneda`, operaciones `sumar`/`restar`/`asignarProporcional` que
 *    devuelvan instancias nuevas y rechacen monedas distintas.
 * 9. Máquina de estados: `class Pedido` con estados `'borrador' | 'pagado' |
 *    'enviado' | 'cancelado'` y transiciones válidas protegidas (no se puede
 *    enviar un pedido sin pagar), con historial de eventos de solo lectura.
 * 10. Entidad con eventos de dominio: `class Cuenta` que acumule eventos
 *     (`CuentaAbierta`, `FondosDepositados`) en un arreglo privado,
 *     `extraerEventos(): readonly EventoDominio[]` que los vacíe, y pruebas
 *     que verifiquen las invariantes tras cada operación.
 */

// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.

export {}; // Convierte el archivo en módulo para evitar choques de nombres entre temas.
