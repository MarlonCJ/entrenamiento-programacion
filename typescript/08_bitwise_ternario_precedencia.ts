/*
 * ============================================================================
 * TEMA 08: OPERADORES BIT A BIT, TERNARIO (Y TIPOS CONDICIONALES), PRECEDENCIA
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: enteros de 32 bits y tipos que eligen)
 * ----------------------------------------------------------------------------
 * 1) **Bitwise en runtime es JavaScript puro**: todo `number` es un double IEEE
 *    754, pero `&`, `|`, `^`, `~`, `<<` y `>>` convierten primero el operando a
 *    un ENTERO CON SIGNO DE 32 BITS (ToInt32), operan y devuelven otro number.
 *    Consecuencias: `1 << 31` es `-2147483648`, `2 ** 32 | 0` es `0` y los
 *    decimales se truncan. `>>>` usa ToUint32 (sin signo): `(1 << 31) >>> 0`
 *    es `2147483648`. Para más de 32 bits usa `bigint` (`1n << 40n`), que no
 *    se puede mezclar con `number` (TS lo marca como error).
 * 2) **TS tipa el resultado como `number`**, nunca como el literal: la unión de
 *    flags `1 | 2` da `number`. Por eso los conjuntos de flags se modelan con
 *    un objeto `as const` o un `enum` y funciones que reciben solo flags
 *    válidos.
 * 3) **Enums vs objetos `as const`**: un `enum` numérico genera código real en
 *    runtime (un objeto con mapeo inverso) y admite cualquier number en
 *    versiones antiguas de TS. `const enum` se inlinea pero no funciona con
 *    `isolatedModules` / herramientas que solo quitan tipos (esbuild, swc,
 *    `node --experimental-strip-types`). El objeto `as const` + tipo derivado
 *    `(typeof X)[keyof typeof X]` es JS estándar y 100 % compatible.
 * 4) **El ternario `cond ? a : b` es una EXPRESIÓN**: TS infiere la unión de
 *    ambas ramas (`edad >= 18 ? 'adulto' : 0` es `'adulto' | 0` en un const) y
 *    estrecha `cond` dentro de cada rama.
 * 5) **El ternario a nivel de tipos**: los tipos condicionales `T extends U ? X
 *    : Y` son la base de `Exclude`, `Extract`, `NonNullable` y `ReturnType`.
 *    Con un `T` genérico desnudo son DISTRIBUTIVOS sobre uniones, e `infer`
 *    permite extraer partes de un tipo.
 * 6) **Precedencia**: `**` > `* / %` > `+ -` > `<< >> >>>` > `< > <=` >
 *    `=== !==` > `&` > `^` > `|` > `&&` > `||` / `??` > `? :` > `=`. Trampa
 *    clásica: `flags & MASCARA === 0` se agrupa como `flags & (MASCARA === 0)`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - IoT y firmware: registros de estado de sensores empaquetados en un byte.
 * - Permisos compactos (lectura/escritura/admin) guardados en una columna
 *   entera, y máscaras de red IPv4 (`ip & mascara`).
 * - Protocolos binarios con `DataView`/`Uint8Array` (colores RGB565, CRC).
 * - Ternarios cortos en plantillas JSX y mensajes (`n === 1 ? 'ítem' : 'ítems'`).
 * - Tipos condicionales en librerías: respuestas de API tipadas según el
 *   endpoint, `Awaited<T>`, extraer el tipo de los elementos de un arreglo.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * 0b1100 & 0b1010;   // 8  (AND: bits comunes)
 * 0b1100 | 0b1010;   // 14 (OR: unión de bits)
 * 0b1100 ^ 0b1010;   // 6  (XOR: bits distintos)
 * ~5;                // -6 (NOT: -(n + 1) en complemento a dos)
 * -16 >> 2;          // -4 (desplazamiento con signo)
 * -16 >>> 28;        // 15 (sin signo)
 *
 * const Permiso = { LEER: 1, ESCRIBIR: 2, ADMIN: 4 } as const;
 * type Permiso = (typeof Permiso)[keyof typeof Permiso];  // 1 | 2 | 4
 * const puedeEscribir = (p: number) => (p & Permiso.ESCRIBIR) !== 0; // ¡paréntesis!
 *
 * const etiqueta = stock === 0 ? 'Agotado' : 'Disponible'; // 'Agotado' | 'Disponible'
 *
 * type EsTexto<T> = T extends string ? 'sí' : 'no';
 * type A = EsTexto<'hola'>;            // 'sí'
 * type B = EsTexto<string | number>;   // 'sí' | 'no' (distributivo)
 * type Elemento<T> = T extends readonly (infer E)[] ? E : never;
 * type C = Elemento<number[]>;         // number
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un gateway IoT recibe el estado de un sensor de cámara frigorífica
 * como un entero de 4 bits, activa/desactiva flags y decide el nivel de alerta.
 *
 * const Sensor = {
 *     ENCENDIDO: 1 << 0,    // 0b0001 = 1
 *     WIFI: 1 << 1,         // 0b0010 = 2
 *     BATERIA_BAJA: 1 << 2, // 0b0100 = 4
 *     SOBRECALOR: 1 << 3,   // 0b1000 = 8
 * } as const;
 * type FlagSensor = (typeof Sensor)[keyof typeof Sensor];
 *
 * const tiene = (estado: number, flag: FlagSensor): boolean => (estado & flag) !== 0;
 * const activar = (estado: number, flag: FlagSensor): number => estado | flag;
 * const desactivar = (estado: number, flag: FlagSensor): number => estado & ~flag;
 * const binario = (n: number): string => `0b${n.toString(2).padStart(4, '0')}`;
 *
 * let estado: number = Sensor.ENCENDIDO | Sensor.WIFI;
 * estado = activar(estado, Sensor.SOBRECALOR);
 * console.log(`Estado: ${estado} (${binario(estado)})`);
 *
 * const alerta = tiene(estado, Sensor.SOBRECALOR)
 *     ? 'CRÍTICA'
 *     : tiene(estado, Sensor.BATERIA_BAJA)
 *       ? 'AVISO'
 *       : 'OK';
 * console.log(`Alerta: ${alerta}`);
 *
 * estado = desactivar(estado, Sensor.WIFI);
 * console.log(`Sin WiFi: ${estado} (${binario(estado)}) wifi=${tiene(estado, Sensor.WIFI)}`);
 *
 * console.log(2 + 3 * 4 ** 2, (2 + 3) * 4, 1 << 31, (1 << 31) >>> 0, 2 ** 32 | 0);
 * console.log(0b1010n & 0b0110n, (1n << 40n).toString());
 *
 * // Salida esperada:
 * // Estado: 11 (0b1011)
 * // Alerta: CRÍTICA
 * // Sin WiFi: 9 (0b1001) wifi=false
 * // 50 20 -2147483648 2147483648 0
 * // 2n 1099511627776
 *
 * (`alerta` se infiere como `'CRÍTICA' | 'AVISO' | 'OK'`. Las dos últimas
 * líneas muestran precedencia, el desbordamiento de 32 bits y BigInt.)
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - PARÉNTESIS SIEMPRE AL COMPROBAR FLAGS: `(estado & flag) !== 0`. Sin ellos,
 *   `===` se evalúa antes que `&`. TS lo detecta (operar `number & boolean` es
 *   error de compilación), pero en un `.js` sin tipos el bug pasa en silencio.
 * - NO USES BITWISE PARA REDONDEAR: `x | 0` o `~~x` truncan y se rompen por
 *   encima de 2^31. Usa `Math.trunc`, `Math.floor` o `Math.round`.
 * - NO CONFUNDAS `&`/`|` CON `&&`/`||`: los primeros no cortocircuitan y
 *   devuelven number. El lint `no-bitwise` ayuda en bases de código de
 *   negocio donde casi nunca se necesitan.
 * - DOCUMENTA LAS MÁSCARAS EN BINARIO (`0b0100`) o con `1 << n`, nunca con
 *   "números mágicos" decimales.
 * - TERNARIOS: uno por expresión. Si anidas más de dos niveles, usa
 *   `if/return`, `switch` o un `Record<Clave, Valor>`. Nunca uses el ternario
 *   solo por sus efectos (`ok ? guardar() : avisar();`): eso es un `if`.
 * - `??` NO PUEDE MEZCLARSE CON `||`/`&&` SIN PARÉNTESIS (SyntaxError).
 * - TIPOS CONDICIONALES: si no quieres distribución sobre uniones, envuelve en
 *   tupla: `[T] extends [string] ? ... : ...`. Y no conviertas cada tipo en
 *   un acertijo: un tipo ilegible es deuda técnica.
 * - ENUMS NUMÉRICOS: prefiere uniones de literales u objetos `as const`; si tu
 *   equipo usa enums, evita `const enum` con `isolatedModules`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Tabla de verdad bit a bit: para `a = 0b1100` y `b = 0b1010`, imprime
 *    `&`, `|`, `^`, `~a` en decimal y binario de 8 dígitos (`padStart`).
 * 2. `esPar(n: number): boolean` con `(n & 1) === 0` y compárala con `n % 2`
 *    para negativos y para `2 ** 33`; explica la diferencia.
 * 3. Plural con ternario: `pluralizar(cantidad: number, singular: string,
 *    plural: string): string` -> `'1 pedido'`, `'3 pedidos'`, `'0 pedidos'`.
 *
 * [Intermedio]
 * 4. Permisos de un CMS con objeto `as const`: `otorgar`, `revocar`,
 *    `alternar` (XOR) y `listarPermisos(mascara): string[]` que devuelva los
 *    nombres activos.
 * 5. Precedencia: escribe 6 expresiones con `**`, `%`, `<<`, `&`, `===`, `&&`
 *    y `??`; predice el resultado, añade paréntesis explícitos y compruébalo.
 * 6. Colores RGB: `aHex(r, g, b)` y `desdeHex(hex): [number, number, number]`
 *    con desplazamientos y máscaras `0xff`.
 * 7. Tipos condicionales: implementa tus propias versiones `MiExclude<T, U>`,
 *    `MiNonNullable<T>` y `TipoPromesa<T>` (con `infer`) y verifícalas con
 *    asignaciones que deban compilar y otras marcadas con `// @ts-expect-error`.
 *
 * [Senior / Producción]
 * 8. Calculadora de subredes IPv4: `ipANumero('192.168.1.10')`, `enMismaRed(ip1,
 *    ip2, prefijo)` usando `>>> 0` para evitar negativos; incluye pruebas.
 * 9. Flags de más de 32 bits: un registro de 64 funcionalidades (feature
 *    flags de un SaaS) usando `bigint`, con serialización a string para JSON.
 * 10. Tipos condicionales en una API: `type Respuesta<E extends Endpoint>` que
 *     devuelva el tipo de cuerpo según el endpoint (`'/usuarios'` -> `Usuario[]`,
 *     `'/usuarios/:id'` -> `Usuario`) y una función `pedir<E>(endpoint: E)`
 *     cuyo retorno se infiera solo.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
