/*
 * ============================================================================
 * TEMA 04: CONVERSIÓN DE TIPOS, NARROWING, TYPE GUARDS Y VALIDACIÓN DEFENSIVA
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: las fronteras del sistema)
 * ----------------------------------------------------------------------------
 * La regla número uno de TypeScript en producción es: **los tipos se borran al
 * compilar (type erasure)**. Una anotación `: Usuario` o un `as number` NO
 * convierte ni valida nada en runtime; solo le dice al compilador qué asumir.
 *
 * 1) **`as Tipo` (type assertion) NO es una conversión**: `("42" as unknown as
 *    number) + 1` produce `"421"` en ejecución porque el valor sigue siendo un
 *    `string` en el motor V8. Para cambiar el valor en memoria debes llamar a
 *    funciones de JS (`Number()`, `String()`, `Boolean()`, `BigInt()`).
 * 2) **Fronteras no confiables (`unknown`)**: todo lo que entra desde fuera
 *    (`JSON.parse`, `req.body`, `process.env`, `readline`, CSV, `localStorage`)
 *    debe tratarse como `unknown`. Con `unknown`, TypeScript prohíbe usar el
 *    valor hasta que demuestres su tipo mediante **narrowing**.
 * 3) **Trampas de conversión en JS**:
 *    - `Number("")`, `Number("   ")`, `Number(null)` y `Number(false)` dan `0`
 *      (¡no `NaN`!). Siempre limpia con `.trim()` y rechaza cadenas vacías antes
 *      de llamar a `Number()`.
 *    - `parseInt("42px", 10)` devuelve `42` ignorando la basura final; `Number("42px")`
 *      devuelve `NaN`. Prefiere `Number(str)` + `Number.isFinite(n)` o regex.
 *    - `Boolean("false")` y `Boolean("0")` son `true` (todo string no vacío es
 *      truthy). Para parsear booleanos de env/query compara contra literales.
 * 4) **Predicados de tipo (`valor is T`) y funciones `asserts`**:
 *    - `function esCliente(v: unknown): v is Cliente` devuelve `boolean` y, si
 *      es `true`, estrecha el tipo en la rama del `if` o en `.filter(esCliente)`.
 *    - `function afirmarNumero(v: unknown): asserts v is number` lanza un error
 *      si falla y estrecha el tipo en todas las líneas posteriores.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Endpoints HTTP / Webhooks: validar el payload (`unknown`) antes de tocar la
 *   base de datos o cobrar una tarjeta.
 * - Variables de entorno (`process.env`): convertir `PORT`, `TIMEOUT_MS` y
 *   `ENABLE_CACHE` de `string | undefined` a `number` y `boolean` al arrancar,
 *   fallando rápido (*fail-fast*) si falta alguna o es inválida.
 * - Importación de catálogos CSV / Excel: distinguir `"0"` legítimo de celdas
 *   vacías `""` y acumular errores por fila sin detener todo el lote.
 * - Librerías de esquemas en producción (Zod, Valibot, ArkType): por dentro
 *   combinan validación en runtime + inferencia estática (`z.infer<typeof S>`).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // Conversión explícita + validación numérica segura
 * function parsearEntero(crudo: string): number | null {
 *     const limpio = crudo.trim();
 *     if (limpio === '') return null;            // evita que Number('') dé 0
 *     const n = Number(limpio);
 *     return Number.isSafeInteger(n) ? n : null; // descarta NaN, Infinity y decimales
 * }
 *
 * // Parseo estricto de booleanos desde texto (env / query params)
 * function parsearBooleano(crudo: string | undefined): boolean | null {
 *     const normalizado = crudo?.trim().toLowerCase();
 *     if (normalizado === 'true' || normalizado === '1') return true;
 *     if (normalizado === 'false' || normalizado === '0') return false;
 *     return null;
 * }
 *
 * // Type guard básico para objetos planos (Record<string, unknown>)
 * function esObjetoPlano(v: unknown): v is Record<string, unknown> {
 *     return typeof v === 'object' && v !== null && !Array.isArray(v);
 * }
 *
 * // Predicado de tipo (v is T) para filtrar arreglos heterogéneos
 * const mixto: (number | null | undefined)[] = [10, null, 25, undefined, 0];
 * const definidos = mixto.filter((x): x is number => x !== null && x !== undefined);
 * // definidos tiene tipo number[] -> [10, 25, 0]
 *
 * // Función de aserción (asserts v is T): lanza o estrecha el resto del bloque
 * function afirmarNoVacio(v: string | undefined, campo: string): asserts v is string {
 *     if (typeof v !== 'string' || v.trim() === '') {
 *         throw new TypeError(`El campo '${campo}' es obligatorio.`);
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un microservicio de pagos recibe solicitudes JSON como `unknown`.
 * Validamos la estructura con un type guard sin usar `any` ni `as`, y rechazamos
 * montos vacíos, negativos o con más de dos decimales.
 *
 * interface SolicitudPago {
 *     readonly idOrden: string;
 *     readonly montoUsd: number;
 *     readonly moneda: 'USD' | 'EUR' | 'COP';
 * }
 *
 * function esObjeto(v: unknown): v is Record<string, unknown> {
 *     return typeof v === 'object' && v !== null && !Array.isArray(v);
 * }
 *
 * function validarSolicitudPago(crudo: unknown):
 *     | { ok: true; datos: SolicitudPago }
 *     | { ok: false; errores: string[] } {
 *     if (!esObjeto(crudo)) {
 *         return { ok: false, errores: ['El payload debe ser un objeto JSON.'] };
 *     }
 *     const errores: string[] = [];
 *     const idOrden = typeof crudo.idOrden === 'string' ? crudo.idOrden.trim() : '';
 *     if (idOrden.length < 4) errores.push('idOrden inválido (mínimo 4 caracteres).');
 *
 *     const monto = typeof crudo.montoUsd === 'number'
 *         ? crudo.montoUsd
 *         : typeof crudo.montoUsd === 'string' && crudo.montoUsd.trim() !== ''
 *             ? Number(crudo.montoUsd)
 *             : NaN;
 *     if (!Number.isFinite(monto) || monto <= 0) {
 *         errores.push('montoUsd debe ser un número finito mayor a 0.');
 *     } else if (!Number.isInteger(Math.round(monto * 100)) || Math.abs(monto * 100 - Math.round(monto * 100)) > 1e-6) {
 *         errores.push('montoUsd admite máximo 2 decimales.');
 *     }
 *
 *     const moneda = crudo.moneda;
 *     const monedaValida = moneda === 'USD' || moneda === 'EUR' || moneda === 'COP';
 *     if (!monedaValida) errores.push('moneda debe ser USD, EUR o COP.');
 *
 *     if (errores.length > 0 || !monedaValida) return { ok: false, errores };
 *     return { ok: true, datos: { idOrden, montoUsd: monto, moneda } };
 * }
 *
 * const lotes: unknown[] = [
 *     { idOrden: 'ORD-101', montoUsd: '149.95', moneda: 'USD' },
 *     { idOrden: '  ', montoUsd: '', moneda: 'BTC' },
 *     'texto suelto',
 * ];
 *
 * for (const item of lotes) {
 *     const res = validarSolicitudPago(item);
 *     if (res.ok) {
 *         console.log(`APROBADO: ${res.datos.idOrden} por ${res.datos.montoUsd} ${res.datos.moneda}`);
 *     } else {
 *         console.log(`RECHAZADO: ${res.errores.join(' | ')}`);
 *     }
 * }
 *
 * // Salida esperada:
 * // APROBADO: ORD-101 por 149.95 USD
 * // RECHAZADO: idOrden inválido (mínimo 4 caracteres). | montoUsd debe ser un número finito mayor a 0. | moneda debe ser USD, EUR o COP.
 * // RECHAZADO: El payload debe ser un objeto JSON.
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA USES `as` PARA "CONVERTIR" DATOS EXTERNOS: `const u = JSON.parse(txt)
 *   as Usuario` desactiva la seguridad de tipos justo donde más la necesitas.
 *   Usa `unknown` y valida antes de construir el tipo de dominio.
 * - `Number("") === 0` Y `Number("   ") === 0`: si un usuario deja un campo de
 *   precio en blanco y haces `const precio = Number(input)`, tendrás `0` gratis.
 *   Comprueba `input.trim() !== ''` antes de convertir.
 * - `typeof null === 'object'`: es un bug histórico de JS desde 1995. En todo
 *   type guard de objetos verifica siempre `v !== null`.
 * - NO USES `isNaN(x)` GLOBAL: hace coerción (`isNaN("hola" as any)` es `true`,
 *   pero `isNaN("" as any)` es `false`). Usa siempre `Number.isNaN(x)` y, mejor
 *   aún, `Number.isFinite(x)` que descarta `NaN`, `Infinity` y `-Infinity`.
 * - CUIDADO CON LA TRAMPA DE LOS PREDICADOS `x is T`: TypeScript confía en la
 *   implementación de tu type guard. Si escribes `return true` por error, el
 *   compilador estrechará el tipo aunque los datos sean inválidos. Prueba tus
 *   guards con casos borde (`null`, `[]`, `{}`).
 * - PARSEA, NO VALIDES A MEDIAS (*Parse, don't validate*): en vez de una función
 *   `esValido(x: unknown): boolean` que obliga a volver a hacer casts después,
 *   devuelve el valor ya transformado (`T | null` o `Resultado<T, Error>`).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Entero seguro: implementa `aEnteroSeguro(crudo: string): number | null`
 *    que rechace cadenas vacías, espacios, decimales (`"12.5"`), basura
 *    (`"12px"`) y números fuera de `Number.isSafeInteger`. Pruébala con 8 casos.
 * 2. Validador de rango: escribe `validarEdad(valor: unknown): number | null`
 *    que acepte `number` o `string` numérico y devuelva la edad solo si es un
 *    entero entre 0 y 120.
 * 3. Diferenciador estricto: crea `clasificarEntrada(v: unknown): string` que
 *    distinga explícitamente cadena vacía `""`, `"0"`, `0` numérico, `null`,
 *    `undefined`, `NaN` y `false` sin usar `any`.
 *
 * [Intermedio]
 * 4. Predicado para `.filter()`: dado un arreglo `(Producto | null | undefined)[]`,
 *    escribe el predicado `esProductoDefinido<T>(v: T | null | undefined): v is T`
 *    y demuestra que el arreglo resultante queda tipado como `Producto[]`.
 * 5. Parseo de `.env` tipado: implementa `leerConfigEnv(env: Record<string,
 *    string | undefined>): Config` que valide `PORT` (1..65535), `NODE_ENV`
 *    (`'development' | 'production' | 'test'`) y `DEBUG` (`boolean`), lanzando
 *    un error descriptivo con todas las variables inválidas.
 * 6. Funciones `asserts`: implementa `afirmarCadenaNoVacia(v: unknown, nombre:
 *    string): asserts v is string` y `afirmarEnteroPositivo(v: unknown, nombre:
 *    string): asserts v is number`, y úsalas en el constructor de un pedido.
 * 7. Conversor de segundos: recibe `unknown`, valida que represente un entero
 *    no negativo de segundos y devuelve `{ horas: number; minutos: number;
 *    segundos: number }` o un error detallado.
 *
 * [Senior / Producción]
 * 8. Type guard profundo: escribe `esFactura(v: unknown): v is Factura` donde
 *    `Factura` contiene `id: string`, `fechaIso: string`, `cliente: { id: number;
 *    email: string }` e `items: ReadonlyArray<{ sku: string; cantidad: number;
 *    precioUnitario: number }>`. Valida cada elemento del arreglo `items`.
 * 9. Importador de lote con reporte: dada una lista `unknown[]` de filas de
 *    inventario, sepáralas en `{ validos: ItemInventario[]; rechazados:
 *    { indice: number; motivos: string[] }[] }` sin abortar al primer fallo.
 * 10. Mini librería de esquemas (estilo Zod): construye combinadores
 *     `esquemaString()`, `esquemaNumero()`, `esquemaObjeto({ ... })` donde cada
 *     validador tenga el tipo `Validador<T> = (v: unknown) => Resultado<T, string>`
 *     y compón un validador de `Usuario` infiriendo su tipo estático con
 *     `type Inferir<V> = V extends Validador<infer T> ? T : never`.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
