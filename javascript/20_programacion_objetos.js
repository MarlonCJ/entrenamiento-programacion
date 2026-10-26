'use strict';

/*
 * ============================================================================
 * TEMA 20: PROGRAMACIÓN ORIENTADA A OBJETOS (CLASES ES2022+, #PRIVADOS E INVARIANTES)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Clases y Prototipos en V8)
 * ----------------------------------------------------------------------------
 * Las clases en JavaScript (`class`) se construyen sobre el sistema de herencia
 * prototípica de V8, pero desde **ES2022+** cuentan con capacidades de
 * encapsulación estricta a nivel de motor que todo desarrollador Senior utiliza:
 *
 * 1) **Campos y Métodos Realmente Privados (`#propiedad` y `#metodo()`, ES2022+)**:
 *    Olvida la antigua convención de poner un guion bajo `this._saldo` (que seguía
 *    siendo 100% pública y modificable desde afuera!). En JavaScript moderno,
 *    cualquier campo o método que empiece con **`#`** (`#saldo`) tiene privacidad
 *    fuerte verificada por el compilador de V8: intentar leer `cuenta.#saldo`
 *    fuera de la clase es un **`SyntaxError`** inmediato, y ni siquiera aparece
 *    en `Object.keys()` ni en `JSON.stringify()`.
 * 2) **Getters, Setters y Protección de Invariantes**:
 *    Expón lecturas limpias con `get saldo()` y realiza mutaciones únicamente a
 *    través de métodos de dominio (`depositar(monto)`, `confirmar()`) que
 *    protejan las reglas del negocio.
 * 3) **Métodos Estáticos y *Named Constructors* (`static desdeJson(...)`)**:
 *    Como JavaScript solo permite un único método `constructor` por clase, el
 *    patrón profesional para tener múltiples formas de creación es definir
 *    métodos fábrica estáticos expresivos (`static crearVacio()`, `static desdeCentavos()`).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Entidades de Dominio Blindadas (`CuentaBancaria`, `Orden`, `Suscripcion`):
 *   Usar campos privados `#` para que ningún código externo pueda alterar el
 *   estado saltándose las validaciones.
 * - Objetos de Valor Inmutables (*Value Objects*): Clases como `Dinero` o `Email`
 *   cuyas operaciones retornan siempre una nueva instancia (`new Dinero(...)`).
 * - Personalización de Serialización JSON mediante el método `toJSON()`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript ES2022+)
 * ----------------------------------------------------------------------------
 * class CuentaBancaria {
 *     // Declaración de campos privados con # (ES2022+):
 *     #titular;
 *     #saldoCentavos;
 *
 *     constructor(titular, saldoInicialCentavos = 0) {
 *         if (!titular?.trim()) throw new TypeError('Titular requerido');
 *         if (saldoInicialCentavos < 0) throw new RangeError('Saldo inicial negativo');
 *         this.#titular = titular.trim();
 *         this.#saldoCentavos = saldoInicialCentavos;
 *     }
 *
 *     // Método fábrica estático (Named Constructor):
 *     static desdeDolares(titular, dolares) {
 *         return new CuentaBancaria(titular, Math.round(dolares * 100));
 *     }
 *
 *     depositar(centavos) {
 *         if (centavos <= 0) throw new RangeError('El depósito debe ser positivo');
 *         this.#saldoCentavos += centavos;
 *     }
 *
 *     get saldoDolares() {
 *         return this.#saldoCentavos / 100;
 *     }
 *
 *     // Controla qué devuelve JSON.stringify(cuenta):
 *     toJSON() {
 *         return { titular: this.#titular, saldoDolares: this.saldoDolares };
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un ítem de inventario protege sus existencias con un campo privado
 * `#stock`, impide despachar más de lo disponible y define su representación
 * JSON con `toJSON()`.
 *
 * class ProductoAlmacen {
 *     #sku;
 *     #stock;
 *
 *     constructor(sku, stockInicial = 0) {
 *         if (!sku) throw new TypeError('SKU obligatorio');
 *         if (stockInicial < 0) throw new RangeError('Stock negativo');
 *         this.#sku = sku;
 *         this.#stock = stockInicial;
 *     }
 *
 *     despachar(unidades) {
 *         if (unidades <= 0) throw new RangeError('Unidades deben ser > 0');
 *         if (unidades > this.#stock) {
 *             throw new Error(`Stock insuficiente para ${this.#sku} (Disponible: ${this.#stock})`);
 *         }
 *         this.#stock -= unidades;
 *     }
 *
 *     get stockDisponible() { return this.#stock; }
 *     toJSON() { return { sku: this.#sku, stock: this.#stock }; }
 * }
 *
 * const item = new ProductoAlmacen('MON-4K', 10);
 * item.despachar(4);
 * console.log(JSON.stringify(item));
 * // Salida esperada:
 * // {"sku":"MON-4K","stock":6}
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - USA SIEMPRE `#campo` EN LUGAR DE `_campo` PARA ESTADO PRIVADO: `#campo`
 *   garantiza encapsulación real en tiempo de compilación y ejecución. Incluso
 *   puedes verificar si un objeto es una instancia legítima de tu clase usando
 *   la comprobación ergonómica `#campo in objeto` (ES2022 *Ergonomic Brand Checks*).
 * - ¡CUIDADO AL PASAR UN MÉTODO DE CLASE COMO CALLBACK SUELTO (`setTimeout(obj.metodo, 100)`)!:
 *   En JavaScript, si desprendes un método de su objeto (`const fn = item.despachar; fn(1);`),
 *   `this` dentro del método pasa a ser **`undefined`** (porque las clases siempre
 *   se ejecutan en modo estricto)! Pásalo siempre como Arrow Function
 *   `() => item.despachar(1)` o enlázalo con `item.despachar.bind(item)`.
 * - IMPLEMENTA `toJSON()` EN CLASES CON CAMPOS PRIVADOS `#`: Como los campos `#`
 *   son privados, `JSON.stringify(instancia)` devolverá `{}` a menos que definas
 *   el método `toJSON()` especificando qué datos públicos deseas exponer.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Clase `Cronometro` con campos privados `#`: Implementa `iniciar()`,
 *    `registrarVuelta()`, `reiniciar()` y un getter `vueltas` que devuelva una
 *    copia del arreglo de tiempos (`[...this.#vueltas]`).
 * 2. Constructores estáticos con nombre (*Static Factory Methods*): En una clase
 *    `Temperatura`, ofrece `static desdeCelsius(c)`, `static desdeFahrenheit(f)`
 *    y getters para ambas escalas.
 * 3. Serialización controlada con `toJSON()`: Crea una clase `UsuarioSeguridad`
 *    con `#id`, `#email` y `#passwordHash`, e implementa `toJSON()` para que al
 *    hacer `JSON.stringify(usuario)` jamás se incluya `#passwordHash`.
 *
 * [Intermedio]
 * 4. *Value Object* Inmutable `Dinero`: Crea la clase `Dinero` con `#centavos`
 *    y `#moneda`, métodos `sumar(otro)`, `restar(otro)`, `multiplicar(factor)` y
 *    `esIgualA(otro)` (usando `#centavos in otro`), devolviendo siempre nuevas
 *    instancias sin mutar la actual.
 * 5. Pérdida del contexto `this` al pasar métodos como callbacks: Demuestra cómo
 *    `const f = cuenta.depositar; f(100);` lanza `TypeError` y muéstralo resuelto
 *    con Arrow Function y con `.bind()`.
 * 6. Bloques de inicialización `static { ... }` (ES2022+): Usa un bloque `static`
 *    dentro de una clase `ConfiguracionMoneda` para inicializar y validar un mapa
 *    interno estático `#tasas` al cargar la clase.
 * 7. Encapsulación de colección hija (`CarritoCompras`): Crea una clase que
 *    gestione líneas privadas `#lineas = new Map()`, permitiendo `agregarProducto`,
 *    `cambiarCantidad`, `eliminarProducto` y calcular el total.
 *
 * [Senior / Producción]
 * 8. Máquina de Estados en la Entidad (`OrdenCompra`): Modela una orden cuyos
 *    estados solo pueden avanzar de `'BORRADOR'` -> `'CONFIRMADA'` -> `'PAGADA'` ->
 *    `'ENVIADA'` (o `'CANCELADA'` antes de enviarse), bloqueando agregar ítems si
 *    ya no está en `'BORRADOR'`.
 * 9. Patrón *Fluent Builder* con Validación Final: Implementa `ConsultaSqlBuilder`
 *    con métodos encadenables `.tabla(t)`, `.seleccionar(...cols)`, `.donde(cond)`,
 *    `.limite(n)` y `.construir()` que retorne `this` en cada paso y valide al final.
 * 10. Comprobación de Marca Ergonómica (`#marcaPrivada in obj`, ES2022+):
 *     Demuestra cómo `static esInstanciaLegitima(obj) { return #id in obj; }`
 *     es más seguro que `instanceof` porque no puede ser engañado falsificando
 *     `Object.setPrototypeOf()`.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
