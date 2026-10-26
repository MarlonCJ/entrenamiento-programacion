/*
 * ============================================================================
 * TEMA 09: CONDICIONALES, NARROWING, UNIONES DISCRIMINADAS Y EXHAUSTIVIDAD
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: análisis de flujo de control)
 * ----------------------------------------------------------------------------
 * En runtime, `if`, `else if`, `else`, `switch` y el ternario son exactamente
 * los de JavaScript: evalúan truthiness (`if`) o igualdad ESTRICTA (`switch`
 * compara con `===`). Lo que TypeScript añade es el **control flow analysis**:
 * el compilador recorre cada rama y recalcula el tipo de cada variable.
 *
 * 1) **Narrowing**: dentro de `if (typeof x === 'string')` el tipo de `x` es
 *    `string`; en el `else`, el resto de la unión. Funcionan como guards:
 *    `typeof`, `instanceof`, `in`, `===`/`!==` contra literales, `Array.isArray`,
 *    truthiness, predicados `function esX(v): v is X` y aserciones
 *    `function afirmar(c): asserts c`.
 * 2) **Uniones discriminadas**: varios tipos de objeto con una propiedad
 *    literal común (el "discriminante", p. ej. `estado: 'pendiente' |
 *    'entregado'`). Un `switch` sobre ella estrecha cada `case` al subtipo
 *    exacto, con acceso solo a sus campos. Es la forma idiomática de modelar
 *    estados en TS ("haz que los estados imposibles sean irrepresentables").
 * 3) **Exhaustividad con `never`**: si en el `default` asignas el valor a una
 *    variable de tipo `never`, el código deja de compilar en cuanto alguien
 *    agrega un estado nuevo sin manejarlo. El compilador se convierte en tu
 *    lista de verificación.
 * 4) **Retornos tempranos (guard clauses)**: tras `if (!usuario) return;`, TS
 *    sabe que `usuario` existe en el resto de la función. Menos anidación,
 *    mismos tipos.
 * 5) **Lo que TS NO cambia**: `switch` sin `break` sigue "cayendo" al siguiente
 *    `case` (activa `noFallthroughCasesInSwitch`); `if ('0')` es verdadero; y
 *    los guards solo valen si los datos son reales: un `as` mal puesto miente.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Logística: estados de un envío (pendiente, en tránsito, entregado,
 *   devuelto) con datos distintos en cada uno.
 * - Reducers de Redux/NgRx: `switch (accion.type)` con exhaustividad.
 * - Resultados de operaciones: `{ ok: true; valor: T } | { ok: false; error: E }`
 *   en lugar de lanzar excepciones para errores de negocio esperables.
 * - Reglas de tarificación, impuestos o descuentos por zona y peso.
 * - Mapear códigos HTTP o tipos de evento con `Record<Union, Handler>`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // Guard clauses: validar y salir pronto
 * function procesar(pedido: Pedido | undefined): string {
 *     if (!pedido) return 'Sin pedido';
 *     if (pedido.items.length === 0) return 'Pedido vacío';
 *     return `Procesando ${pedido.id}`;   // aquí pedido: Pedido
 * }
 *
 * // Narrowing con in / instanceof
 * if ('tarjeta' in pago) cobrarTarjeta(pago.tarjeta);
 * if (error instanceof TypeError) console.error(error.message);
 *
 * // Predicado de tipo reutilizable
 * function esTexto(valor: unknown): valor is string {
 *     return typeof valor === 'string';
 * }
 *
 * // Tabla de decisión en vez de if/else en cadena (exhaustiva por tipos)
 * type Zona = 'norte' | 'sur' | 'centro';
 * const recargoPorZona = { norte: 4, sur: 6, centro: 2 } satisfies Record<Zona, number>;
 *
 * // Agrupar varios case
 * switch (codigoHttp) {
 *     case 200:
 *     case 201: return 'éxito';
 *     case 404: return 'no encontrado';
 *     default:  return 'otro';
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: El panel de una empresa de logística describe cada envío según su
 * estado (unión discriminada + `switch` exhaustivo) y calcula tarifas con
 * guard clauses y reglas acumulativas.
 *
 * type Envio =
 *     | { estado: 'pendiente'; horasEnCola: number }
 *     | { estado: 'en_transito'; transportista: string; kmRestantes: number }
 *     | { estado: 'entregado'; firmadoPor: string }
 *     | { estado: 'devuelto'; motivo: string };
 *
 * function assertNunca(valor: never): never {
 *     throw new Error(`Caso no contemplado: ${JSON.stringify(valor)}`);
 * }
 *
 * function describirEnvio(envio: Envio): string {
 *     switch (envio.estado) {
 *         case 'pendiente':
 *             return envio.horasEnCola > 48 ? 'Pendiente (RETRASADO)' : 'Pendiente';
 *         case 'en_transito':
 *             return `En tránsito con ${envio.transportista}, faltan ${envio.kmRestantes} km`;
 *         case 'entregado':
 *             return `Entregado a ${envio.firmadoPor}`;
 *         case 'devuelto':
 *             return `Devuelto: ${envio.motivo}`;
 *         default:
 *             return assertNunca(envio); // no compila si falta un case
 *     }
 * }
 *
 * function tarifaEnvio(pesoKg: number, zona: 'urbana' | 'rural', express: boolean): number {
 *     if (!Number.isFinite(pesoKg) || pesoKg <= 0) {
 *         throw new RangeError(`Peso inválido: ${pesoKg}`);
 *     }
 *     let total = (zona === 'urbana' ? 5 : 9) + pesoKg * 1.5;
 *     if (express) total *= 1.4;
 *     if (pesoKg > 30) total += 20; // recargo por bulto pesado
 *     return Math.round(total * 100) / 100;
 * }
 *
 * const envios: Envio[] = [
 *     { estado: 'pendiente', horasEnCola: 60 },
 *     { estado: 'en_transito', transportista: 'RutaSur', kmRestantes: 42 },
 *     { estado: 'entregado', firmadoPor: 'Carmen Díaz' },
 *     { estado: 'devuelto', motivo: 'dirección incorrecta' },
 * ];
 *
 * for (const envio of envios) console.log(describirEnvio(envio));
 * console.log(tarifaEnvio(2, 'urbana', false), tarifaEnvio(10, 'rural', true), tarifaEnvio(35, 'urbana', false));
 * try {
 *     tarifaEnvio(-1, 'rural', false);
 * } catch (error) {
 *     if (error instanceof RangeError) console.log(`Error: ${error.message}`);
 * }
 *
 * // Salida esperada:
 * // Pendiente (RETRASADO)
 * // En tránsito con RutaSur, faltan 42 km
 * // Entregado a Carmen Díaz
 * // Devuelto: dirección incorrecta
 * // 8 33.6 77.5
 * // Error: Peso inválido: -1
 *
 * (Si mañana se añade `{ estado: 'perdido' }` a `Envio`, la línea
 * `assertNunca(envio)` marca error: "Argument of type '{ estado: "perdido" }'
 * is not assignable to parameter of type 'never'".)
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - EVITA EL "CÓDIGO FLECHA": invierte condiciones y retorna pronto en lugar de
 *   anidar cinco `if`. Cada nivel de sangría es carga cognitiva.
 * - MODELA ESTADOS CON UNIONES DISCRIMINADAS, no con banderas sueltas
 *   (`entregado: boolean; devuelto: boolean; firmadoPor?: string`), que
 *   permiten combinaciones imposibles como "entregado y devuelto".
 * - SIEMPRE `default` CON `never` en switches sobre uniones; y activa
 *   `noFallthroughCasesInSwitch` en `tsconfig.json`.
 * - `switch (true)` funciona y TS 5.3+ estrecha dentro de cada `case`, pero
 *   úsalo con moderación: una cadena `if/else if` suele ser más clara.
 * - CUIDADO CON LA TRUTHINESS: `if (descuento)` descarta `0`; `if (nombre)`
 *   descarta `''`. Compara explícitamente con `undefined`/`null`.
 * - EL NARROWING SE PIERDE EN CALLBACKS: una propiedad estrechada fuera de un
 *   `.forEach(() => ...)` puede volver a su tipo amplio dentro, porque TS no
 *   sabe cuándo se ejecutará. Copia el valor a una constante local.
 * - NO "ARREGLES" ERRORES DE TIPOS CON `as` O `!`: un `envio!.firmadoPor` o
 *   `(envio as Entregado)` desactiva la protección que el `switch` te daba.
 * - TABLAS > CADENAS DE IF: para mapear valores, un objeto con `satisfies
 *   Record<Clave, Valor>` es más corto, testeable y exhaustivo.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. `clasificarIMC(imc: number): 'bajo' | 'normal' | 'sobrepeso' | 'obesidad'`
 *    con `if/else if` y retorno de un tipo literal; valida NaN y negativos.
 * 2. `diaLaboral(dia: number)` con `switch` que agrupe casos (lunes-viernes,
 *    fin de semana) y lance `RangeError` fuera de 1..7.
 * 3. Refactoriza a guard clauses una función con cuatro `if` anidados que
 *    valida un formulario de alta de paciente (nombre, edad, email, seguro).
 *
 * [Intermedio]
 * 4. `type Pago = { metodo: 'tarjeta'; ultimos4: string } | { metodo:
 *    'transferencia'; iban: string } | { metodo: 'efectivo' }` y
 *    `describirPago(p: Pago): string` con `switch` exhaustivo y `assertNunca`.
 * 5. Agrega `{ metodo: 'cripto'; red: string }` al reto 4 y observa el error de
 *    compilación; corrígelo. Documenta en un comentario qué te aportó.
 * 6. `calcularImpuesto(monto, pais)` usando un objeto `satisfies Record<Pais,
 *    number>` en vez de `switch`; añade un país y comprueba qué pasa.
 * 7. Guards personalizados: `esError(v: unknown): v is Error` y
 *    `afirmarDefinido<T>(v: T | undefined, msg: string): asserts v is T`;
 *    úsalos al leer configuración de `process.env`.
 *
 * [Senior / Producción]
 * 8. `type Resultado<T, E> = { ok: true; valor: T } | { ok: false; error: E }`.
 *    Implementa `parsearEdad(texto: string): Resultado<number, string>` y una
 *    cadena de validaciones que se detenga en el primer `ok: false`.
 * 9. Máquina de estados de un pedido de e-commerce: `transicion(estado,
 *    evento)` que solo permita cambios válidos (pagado -> enviado, nunca
 *    entregado -> pagado), con tipos que impidan eventos imposibles por estado.
 * 10. Reducer tipado para un carrito: acciones `agregar`, `quitar`, `vaciar`,
 *     `aplicarCupon` como unión discriminada, estado `Readonly`, exhaustividad
 *     con `never` y pruebas con `node:test` para cada acción.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
