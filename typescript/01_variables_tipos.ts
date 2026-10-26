/*
 * ============================================================================
 * TEMA 01: VARIABLES, TIPOS PRIMITIVOS, INFERENCIA Y TIPADO ESTRUCTURAL
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: compilador tsc + runtime JS)
 * ----------------------------------------------------------------------------
 * TypeScript es JavaScript con un sistema de tipos ESTÁTICO que vive solo en
 * tiempo de compilación. Entenderlo exige separar dos mundos:
 *
 * 1) **Borrado de tipos (type erasure)**: `tsc` (o esbuild, swc, Node con
 *    `--experimental-strip-types`) elimina todas las anotaciones y produce
 *    JavaScript normal. En runtime NO existe `number`, `string` ni ninguna
 *    interfaz: si un dato llega de una API con otra forma, TS no lo detectará.
 *    Por eso los datos externos se tipan como `unknown` y se validan (tema 04).
 * 2) **`const` / `let` siguen las reglas de JS**: alcance de bloque, Temporal
 *    Dead Zone (leer antes de declarar lanza `ReferenceError`) y `var`
 *    prohibido. TS añade una capa: el TIPO de la variable.
 * 3) **Inferencia y ensanchamiento (widening)**: `let estado = 'activo'` se
 *    infiere como `string` (puede cambiar); `const estado = 'activo'` se
 *    infiere como el tipo LITERAL `'activo'`. Anota solo cuando la inferencia
 *    no basta (parámetros, valores de retorno públicos, variables sin valor).
 * 4) **Tipos primitivos**: `string`, `number` (IEEE 754 de 64 bits), `bigint`,
 *    `boolean`, `symbol`, `null` y `undefined`. Con `strict: true`
 *    (`strictNullChecks`) `null` y `undefined` NO pertenecen a los demás
 *    tipos: hay que declararlos en una unión (`string | null`).
 * 5) **Tipos especiales**: `unknown` (cualquier valor, pero obliga a
 *    comprobarlo antes de usarlo), `any` (desactiva el compilador: contagia y
 *    oculta errores), `never` (valor imposible) y `void` (sin retorno útil).
 * 6) **Tipado estructural (duck typing estático)**: dos tipos son compatibles
 *    si tienen la misma FORMA, no el mismo nombre. Un objeto `{ id, email,
 *    rol }` sirve donde se pide `{ id, email }`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Contratos entre frontend y backend: tipos compartidos para pedidos,
 *   usuarios o facturas, detectando campos mal escritos al compilar.
 * - Telemetría IoT: lecturas con `number | null` explícito para sensores que
 *   no reportan, obligando a manejar el caso vacío.
 * - IDs de 64 bits (PostgreSQL `BIGINT`, Snowflake de Twitter/Discord): por
 *   encima de `Number.MAX_SAFE_INTEGER` (2^53 - 1) se usa `bigint` o `string`.
 * - Refactors seguros en bases de código grandes: renombrar un campo y que el
 *   compilador señale cada uso roto antes de llegar a producción.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * const sku = 'ZAP-001';                  // tipo literal 'ZAP-001' (inferido)
 * let stock = 25;                         // number (inferido, ensanchado)
 * let precio: number = 129_900.5;         // anotación explícita + separador _
 * const pedidoId: bigint = 9007199254740993n;   // supera MAX_SAFE_INTEGER
 * let cupon: string | null = null;        // ausencia intencional explícita
 * let notas: string[] = [];               // sin anotación sería any[] implícito
 * let ultimaSync: Date | undefined;       // aún sin valor
 * const ID_SESION: unique symbol = Symbol('sesion');
 *
 * let entrada: unknown = JSON.parse('42');
 * // entrada + 1;                         // Error: 'entrada' es de tipo 'unknown'
 * if (typeof entrada === 'number') {
 *     console.log(entrada + 1);           // narrowing: aquí es number
 * }
 *
 * type Cliente = { id: number; email: string };
 * const desdeApi = { id: 7, email: 'ana@tienda.co', rol: 'admin' };
 * const cliente: Cliente = desdeApi;      // OK: compatibilidad estructural
 * // const otro: Cliente = { id: 8, email: 'x@y.co', rol: 'x' };
 * //   Error: excess property check (solo en literales escritos en el sitio)
 *
 * let [origen, destino] = ['Bogotá', 'Lima'];
 * [origen, destino] = [destino, origen];  // intercambio con destructuring
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un gateway IoT recibe la lectura de un sensor de temperatura y
 * debe clasificar el tipo REAL de cada campo en runtime (los tipos de TS ya
 * no existen) para detectar anomalías como `NaN` o `null`.
 *
 * function describirLectura(valor: unknown): string {
 *     if (valor === null) return 'null';             // typeof null === 'object'
 *     if (Array.isArray(valor)) return `array(${valor.length})`;
 *     if (typeof valor === 'number') {
 *         return Number.isNaN(valor) ? 'number(NaN)' : `number(${valor})`;
 *     }
 *     return typeof valor;
 * }
 *
 * const lectura = {
 *     sensorId: 'TMP-0042',
 *     temperatura: 21.5,
 *     humedad: Number.NaN,                           // sensor averiado
 *     pulsos: 18_446_744_073_709_551_615n,           // contador de 64 bits
 *     calibrado: false,
 *     alerta: null,
 *     historial: [21.1, 21.3, 21.5],
 * };
 *
 * let anomalias = 0;
 * for (const [clave, valor] of Object.entries(lectura)) {
 *     const tipo = describirLectura(valor);
 *     if (tipo === 'number(NaN)' || tipo === 'null') anomalias += 1;
 *     console.log(`${clave.padEnd(12)}-> ${tipo}`);
 * }
 * console.log(`Anomalías: ${anomalias} | MAX_SAFE: ${Number.MAX_SAFE_INTEGER}`);
 *
 * // Salida esperada:
 * // sensorId    -> string
 * // temperatura -> number(21.5)
 * // humedad     -> number(NaN)
 * // pulsos      -> bigint
 * // calibrado   -> boolean
 * // alerta      -> null
 * // historial   -> array(3)
 * // Anomalías: 2 | MAX_SAFE: 9007199254740991
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - ACTIVA `"strict": true` EN tsconfig.json: sin `strictNullChecks` y
 *   `noImplicitAny`, TS deja pasar la mayoría de los bugs. Considera también
 *   `noUncheckedIndexedAccess` (acceder a `arr[i]` da `T | undefined`).
 * - `any` ES CONTAGIOSO: `const datos: any = ...; const total = datos.monto;`
 *   hace que `total` también sea `any`. Usa `unknown` y estrecha el tipo.
 * - NO ANOTES LO OBVIO: `const nombre: string = 'Ana'` es ruido y además pierde
 *   el tipo literal. Anota fronteras: parámetros, retornos y estructuras vacías.
 * - LOS TIPOS NO VALIDAN EN RUNTIME: `const u = JSON.parse(txt) as Usuario` es
 *   una promesa sin verificar. Una aserción `as` no convierte ni comprueba nada.
 * - LOS GOTCHAS DE JS SIGUEN AHÍ: `typeof null === 'object'`, `NaN !== NaN`,
 *   `0.1 + 0.2 !== 0.3` y `9007199254740992 === 9007199254740993` es `true`.
 *   TS compila sin quejarse en todos esos casos.
 * - USA LOS TIPOS PRIMITIVOS EN MINÚSCULA: `string`, no `String` (el wrapper
 *   de objeto). `new Number(5)` es un objeto, y `typeof` devuelve 'object'.
 * - `number` Y `bigint` NO SE MEZCLAN: `10n + 1` es error de compilación (y
 *   `TypeError` en runtime). Convierte explícitamente con `BigInt(n)`/`Number(b)`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Ficha de empleado: declara `nombre`, `cargo`, `salario`, `activo` y
 *    `fechaSalida: Date | null` dejando que TS infiera donde sea posible;
 *    anota solo `fechaSalida`. Muestra un resumen con template literals.
 * 2. Literal vs ensanchado: declara `const moneda = 'COP'` y `let divisa =
 *    'COP'`. Pasa el cursor sobre ambas en el editor y explica en un
 *    comentario por qué una es `'COP'` y la otra `string`.
 * 3. Intercambio de turnos: declara `turnoManana` y `turnoNoche` (strings) e
 *    intercámbialos en una línea con destructuring de arreglos.
 *
 * [Intermedio]
 * 4. `detectarTipo(valor: unknown): string` que distinga 'null', 'array',
 *    'date' (`instanceof Date`), 'nan' y el resto de `typeof`. Pruébala con
 *    al menos 8 valores distintos.
 * 5. Precisión de IDs: demuestra que `9007199254740991 + 2` falla con
 *    `number` y funciona con `bigint`; luego escribe
 *    `parsearIdPedido(texto: string): bigint` que rechace textos no numéricos.
 * 6. Compatibilidad estructural: define `type Notificable = { email: string }`
 *    y una función `enviarAviso(destino: Notificable)`. Pásale un cliente, un
 *    proveedor y un empleado con campos extra y explica por qué compila (y por
 *    qué un literal con campos extra escrito en la llamada NO compila).
 * 7. Valor vs referencia: demuestra que copiar un `number` no afecta el
 *    original, pero copiar un objeto `{ saldo: number }` y mutarlo sí. Explica
 *    por qué TS no lo impide.
 *
 * [Senior / Producción]
 * 8. Lector de variables de entorno tipado: `leerEnv(nombre: string): string`
 *    que lance un `Error` descriptivo si `process.env[nombre]` es `undefined`.
 *    Úsala para construir un objeto de configuración `{ puerto: number;
 *    modoDebug: boolean; urlBaseDatos: string }` sin usar `any`.
 * 9. Branded types para IDs: crea `type IdCliente = string & { readonly
 *    __marca: 'IdCliente' }` e `IdPedido` análogo, con funciones constructoras
 *    que validen el formato. Demuestra que pasar un `IdPedido` donde se espera
 *    `IdCliente` es error de compilación aunque ambos sean strings en runtime.
 * 10. Auditoría de `any`: toma un fragmento con 5 usos de `any` (escríbelo tú:
 *     respuesta de API, callback, caché en memoria...) y reescríbelo con
 *     `unknown`, uniones y narrowing. Configura en un comentario las reglas de
 *     ESLint `@typescript-eslint/no-explicit-any` y `no-unsafe-assignment`.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
