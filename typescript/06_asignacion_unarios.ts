/*
 * ============================================================================
 * TEMA 06: ASIGNACIÓN COMPUESTA, ASIGNACIÓN LÓGICA (??=, ||=, &&=) Y UNARIOS
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: mutación, cortocircuito y tipos)
 * ----------------------------------------------------------------------------
 * En TypeScript, asignar un nuevo valor a una variable no solo cambia la
 * memoria en runtime: también actualiza el **tipo estrechado (narrowed type)**
 * que el compilador mantiene en el análisis de flujo de control:
 *
 * 1) **Reasignación y tipo declarado**: si declaras `let estado: string | null =
 *    null`, tras asignar `estado = 'activo'`, TypeScript sabe que en las líneas
 *    siguientes `estado` es `string` (hasta que vuelva a reasignarse). Pero
 *    nunca puedes asignarle un tipo fuera de su unión original (`estado = 123`
 *    es error TS2322).
 * 2) **Asignación compuesta (`+=`, `-=`, `*=`, `/=`, `%=`, `**=`)**:
 *    - Con números exige que ambos lados sean `number` (o ambos `bigint`).
 *    - Con `+=` y un `string`, concatena.
 * 3) **Asignación lógica (ES2021: `??=`, `||=`, `&&=`) con cortocircuito**:
 *    Evalúan y asignan **solo si es necesario** (no ejecutan el setter ni la
 *    expresión derecha si no aplica):
 *    - `x ??= defecto`: asigna solo si `x` es `null` o `undefined`. Además,
 *      **elimina `null | undefined` del tipo de `x`** de ahí en adelante.
 *    - `x ||= defecto`: asigna si `x` es cualquier falsy (`0`, `''`, `false`...).
 *    - `x &&= reemplazo`: asigna solo si `x` es truthy.
 * 4) **Operadores unarios de runtime vs de TypeScript**:
 *    - Runtime (JS): `-x` (cambio de signo), `+x` (conversión a número), `!x`
 *      (negación booleana), `~x` (NOT bit a bit), `++`/`--` (prefijo y postfijo),
 *      `typeof x`, `delete obj.prop`, `void expr`.
 *    - Compilación (TS): el operador postfijo `valor!` (*non-null assertion*)
 *      borra `null | undefined` del tipo sin comprobar nada en runtime; y
 *      `typeof Variable` en posición de tipo extrae el tipo estático.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Cachés perezosas (*lazy initialization*) y memorización:
 *   ` this.conexion ??= await crearConexion()` o `mapa[clave] ??= []`.
 * - Normalización de formularios y configuraciones:
 *   `usuario.apodo ||= usuario.nombre` y `usuario.email &&= usuario.email.trim().toLowerCase()`.
 * - Acumuladores de métricas, saldos, reintentos con *exponential backoff*
 *   (`esperaMs *= 2`) y contadores de inventario.
 * - Extraer tipos de constantes existentes con `typeof CONFIG` en posición de
 *   tipo para no duplicar interfaces.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // Asignación compuesta
 * let saldo = 1_000;
 * saldo += 250;          // 1250
 * saldo -= 100;          // 1150
 * let esperaMs = 500;
 * esperaMs *= 2;         // 1000 (backoff exponencial)
 *
 * // Asignación lógica con narrowing automático en TypeScript
 * let token: string | undefined;
 * token ??= 'tok_generado_123';
 * // Aquí el tipo de `token` ya es `string` (undefined quedó descartado)
 * console.log(token.toUpperCase());
 *
 * const opciones = { puerto: 0, titulo: '' };
 * opciones.puerto ??= 3000;          // sigue siendo 0 (0 no es nullish)
 * opciones.titulo ||= 'Sin título';  // pasa a 'Sin título' ('' es falsy)
 *
 * // Prefijo vs postfijo en ++ / --
 * let i = 5;
 * const a = ++i; // i pasa a 6 y a vale 6 (prefijo: incrementa antes de evaluar)
 * const b = i++; // b vale 6 e i pasa a 7 (postfijo: evalúa antes de incrementar)
 *
 * // typeof en runtime (devuelve string) vs typeof en posición de tipo (TS)
 * const CFG_DEFECTO = { reintentos: 3, activo: true };
 * type Config = typeof CFG_DEFECTO; // { reintentos: number; activo: boolean }
 * const tipoEnRuntime = typeof CFG_DEFECTO; // 'object'
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un procesador de eventos de inventario agrupa movimientos por SKU
 * inicializando cada cubeta con `??=`, aplica normalización con `&&=` / `||=` y
 * actualiza existencias con asignaciones compuestas.
 *
 * interface ResumenSku {
 *     sku: string;
 *     etiqueta: string;
 *     stockActual: number;
 *     movimientos: number;
 * }
 *
 * interface EventoAlmacen {
 *     sku: string;
 *     etiqueta?: string;
 *     delta: number;
 * }
 *
 * function procesarEventos(eventos: readonly EventoAlmacen[]): Record<string, ResumenSku> {
 *     const catalogo: Record<string, ResumenSku> = {};
 *
 *     for (const ev of eventos) {
 *         let etiqueta = ev.etiqueta;
 *         etiqueta &&= etiqueta.trim();       // solo hace trim si venía definida y no vacía
 *         etiqueta ||= `Producto ${ev.sku}`;  // si quedó vacía o undefined, usa el defecto
 *
 *         // ??= crea el registro si no existe y estrecha `ficha` a `ResumenSku` (sin undefined)
 *         const ficha = (catalogo[ev.sku] ??= {
 *             sku: ev.sku,
 *             etiqueta,
 *             stockActual: 0,
 *             movimientos: 0,
 *         });
 *
 *         ficha.stockActual += ev.delta;
 *         ficha.movimientos += 1;
 *     }
 *     return catalogo;
 * }
 *
 * const resultado = procesarEventos([
 *     { sku: 'TEC-01', etiqueta: '  Teclado Mecánico  ', delta: 20 },
 *     { sku: 'TEC-01', delta: -3 },
 *     { sku: 'MOU-02', etiqueta: '', delta: 10 },
 * ]);
 *
 * for (const ficha of Object.values(resultado)) {
 *     console.log(`${ficha.sku} (${ficha.etiqueta}): stock=${ficha.stockActual}, movs=${ficha.movimientos}`);
 * }
 *
 * // Salida esperada:
 * // TEC-01 (Teclado Mecánico): stock=17, movs=2
 * // MOU-02 (Producto MOU-02): stock=10, movs=1
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - EVITA `++` DENTRO DE OTRA EXPRESIÓN (`arr[i++] = ++j`): obliga a pensar en
 *   el orden exacto de evaluación y es fuente clásica de bugs *off-by-one*.
 *   Escribe `i += 1` en su propia línea.
 * - PROHÍBE LA ASERCIÓN NO NULA `valor!` EN PRODUCCIÓN (regla ESLint
 *   `@typescript-eslint/no-non-null-assertion`): `usuario!.perfil!.email` no
 *   protege nada en runtime y lanza `TypeError: Cannot read properties of
 *   undefined` cuando el dato falta. Usa `?.` + `??` o una guard clause.
 * - PREFIERE `+Number(x)` A `+x` PARA CONVERTIR: el unario `+valor` es críptico
 *   de leer y lanza `TypeError` si alguna vez recibe un `bigint` o un `symbol`.
 *   `Number(valor)` comunica la intención con claridad.
 * - `delete obj.prop` EN TYPESCRIPT ESTRICTO: con `strictNullChecks`, TS solo
 *   permite `delete` si la propiedad fue declarada como opcional (`prop?: T`).
 *   Además, en V8 `delete` altera la *hidden class* del objeto; en código
 *   crítico o inmutable prefiere desestructurar (`const { omitido, ...resto } = obj`).
 * - NO USES `||=` CON NÚMEROS O BOOLEANOS LEGÍTIMOS: `config.timeout ||= 5000`
 *   sobrescribe un `0` válido. Usa siempre `??=` salvo que quieras descartar
 *   explícitamente cadenas vacías `''`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Simulador de cuenta bancaria: parte de un saldo inicial y aplica una lista
 *    de depósitos (`+=`), retiros (`-=`) e interés compuesto (`*=`), rechazando
 *    retiros que dejen el saldo negativo.
 * 2. Prefijo vs postfijo: demuestra con código y aserciones (`node:assert/strict`)
 *    la diferencia entre `let x = 10; const a = x++;` y `let y = 10; const b = ++y;`.
 * 3. Inversión y cambio de signo: escribe `invertirMovimiento(m: { monto: number;
 *    activo: boolean })` usando `-m.monto` y `!m.activo` (cuidado con `-0`:
 *    normaliza `-0` a `0`).
 *
 * [Intermedio]
 * 4. Normalizador de perfil con asignación lógica: implementa `normalizarPerfil(p:
 *    PerfilEntrada)` usando `&&=` para recortar espacios de campos presentes,
 *    `||=` para asignar `'Anónimo'` si el nombre queda vacío y `??=` para fijar
 *    `notificaciones: true` y `intentos: 0` sin pisar `false` ni `0`.
 * 5. Agrupador con `??=`: implementa `agruparPor<T, K extends string>(items:
 *    readonly T[], selector: (item: T) => K): Record<K, T[]>` usando
 *    `(grupos[clave] ??= []).push(item)`.
 * 6. Eliminar `!` (*non-null assertion*): toma una función que usa `mapa.get(id)!.total`
 *    y refactorízala usando `??=` o narrowing para que compile con la máxima
 *    seguridad sin ningún `!`.
 * 7. Backoff exponencial con tope: escribe un calculador de espera de reintentos
 *    que empiece en `200` ms, duplique en cada fallo con `*= 2` y limite el
 *    máximo a `10_000` ms.
 *
 * [Senior / Producción]
 * 8. Caché perezosa (*memoize* de una sola ejecución): implementa una clase
 *    `RecursoPerezoso<T>` con una propiedad privada `#valor: T | undefined` que
 *    use `this.#valor ??= this.#fabrica()` para inicializar el recurso solo en
 *    la primera lectura y devolverlo tipado como `T`.
 * 9. Contador de frecuencias y métricas en una pasada: dado un flujo de logs de
 *    latencia por endpoint, actualiza en un único objeto el conteo (`+= 1`), la
 *    suma de ms (`+=`), el mínimo y el máximo por ruta usando `??=`.
 * 10. Auditoría de mutación vs inmutabilidad: implementa `aplicarParcheMutando`
 *     (con `??=`, `&&=`, `+=`) y `aplicarParcheInmutable` (devolviendo un nuevo
 *     `Readonly<Estado>`), demuestra con tests que ambas producen el mismo
 *     estado final y documenta cuándo elegir cada una.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
