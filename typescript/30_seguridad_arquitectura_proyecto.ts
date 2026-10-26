/*
 * ============================================================================
 * TEMA 30: SEGURIDAD (OWASP / NODE:CRYPTO), ARQUITECTURA Y PROYECTO INTEGRADOR
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Seguridad por Diseño y Arquitectura Senior en TS)
 * ----------------------------------------------------------------------------
 * ¡Felicidades por llegar al tema final de la ruta de TypeScript! Regla de oro:
 * **los tipos NO son una barrera de seguridad**. Se borran al compilar; un
 * atacante envía bytes, no interfaces. TS sirve para que, UNA VEZ validado un
 * dato en la frontera, el resto del sistema no pueda usar por error un dato
 * sin validar. Las defensas del OWASP Top 10 siguen siendo de runtime:
 *
 * 1) **Aleatoriedad criptográfica**: `Math.random()` es predecible. Para
 *    tokens, OTP o IDs de sesión usa `node:crypto`: `randomUUID()`,
 *    `randomBytes(32).toString('base64url')`, `randomInt(100_000, 1_000_000)`.
 * 2) **Contraseñas con `scrypt` + salt y comparación en tiempo constante**:
 *    nunca SHA-256 simple. Compara hashes y firmas HMAC con `timingSafeEqual`
 *    (lanza `RangeError` si los buffers difieren en longitud).
 * 3) **Branded types (tipos "marcados")**: `type Email = string & { readonly
 *    [marca]: 'Email' }`. Solo una función validadora puede producir un `Email`,
 *    así que una función que pide `Email` no acepta un `string` crudo. Cero
 *    costo en runtime; simulan tipos nominales en un sistema estructural.
 * 4) **Inyección y ejecución de código**: consultas SQL parametrizadas
 *    (`$1`, `?`), `execFile` en vez de `exec`, nunca `eval`/`new Function`.
 *    *Prototype Pollution* sigue existiendo: `JSON.parse` devuelve `any` y un
 *    `Object.assign(config, body)` con `"__proto__"` no da error de tipos.
 * 5) **Arquitectura hexagonal (puertos y adaptadores)**: el DOMINIO (entidades,
 *    objetos de valor) y los CASOS DE USO solo conocen *puertos* (interfaces).
 *    Los ADAPTADORES (Postgres, Redis, Stripe, memoria) implementan esos puertos
 *    y se conectan en la *raíz de composición*. Las dependencias apuntan hacia
 *    el dominio, nunca al revés.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Fintech y billeteras digitales: registro/login, transferencias y webhooks
 *   de pasarelas verificados con HMAC-SHA256.
 * - APIs multi-tenant donde un `IdEmpresa` confundido con un `IdUsuario` sería
 *   una fuga de datos (branded types evitan el cruce en compilación).
 * - Migrar de base de datos o de proveedor de pagos cambiando solo un adaptador.
 * - Probar casos de uso en milisegundos con adaptadores en memoria.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (node:crypto + tipos)
 * ----------------------------------------------------------------------------
 * import { randomUUID, randomInt, createHmac, timingSafeEqual } from 'node:crypto';
 *
 * // Branded type genérico y "constructor inteligente":
 * declare const marca: unique symbol;
 * type Marca<T, M extends string> = T & { readonly [marca]: M };
 * type Centavos = Marca<number, 'Centavos'>;
 * function aCentavos(n: number): Centavos {
 *     if (!Number.isSafeInteger(n) || n < 0) throw new RangeError('Monto inválido');
 *     return n as Centavos;
 * }
 *
 * // Token y OTP seguros:
 * const token = randomUUID();
 * const otp = randomInt(100_000, 1_000_000).toString();
 *
 * // Copia sin Prototype Pollution:
 * const PELIGROSAS = new Set(['__proto__', 'constructor', 'prototype']);
 * function copiarSeguro(origen: Record<string, unknown>): Record<string, unknown> {
 *     const destino: Record<string, unknown> = Object.create(null);
 *     for (const [k, v] of Object.entries(origen)) if (!PELIGROSAS.has(k)) destino[k] = v;
 *     return destino;
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: El módulo de identidad de una billetera digital. Dominio con
 * branded types, puertos `RepositorioUsuarios` y `Hasheador`, adaptadores
 * (memoria y scrypt), un caso de uso que solo conoce los puertos y la
 * verificación HMAC de un webhook. La raíz de composición vive en
 * `async function main()`, compatible con CommonJS.
 *
 * import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
 *
 * // --- Dominio: branded types (solo existen en compilación) ---
 * declare const marca: unique symbol;
 * type Marca<T, M extends string> = T & { readonly [marca]: M };
 * type Email = Marca<string, 'Email'>;
 * type HashPassword = Marca<string, 'HashPassword'>;
 *
 * function crearEmail(valor: string): Email {
 *     const limpio = valor.trim().toLowerCase();
 *     if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(limpio)) throw new TypeError('EMAIL_INVALIDO');
 *     return limpio as Email; // único lugar donde se "acuña" la marca
 * }
 *
 * interface Usuario {
 *     readonly id: string;
 *     readonly email: Email;
 *     readonly hash: HashPassword;
 * }
 *
 * // --- Puertos (interfaces que el caso de uso necesita) ---
 * interface RepositorioUsuarios {
 *     buscarPorEmail(email: Email): Promise<Usuario | undefined>;
 *     guardar(usuario: Usuario): Promise<void>;
 * }
 * interface Hasheador {
 *     hashear(plano: string): HashPassword;
 *     verificar(plano: string, hash: HashPassword): boolean;
 * }
 *
 * // --- Adaptadores (infraestructura) ---
 * class RepositorioUsuariosMemoria implements RepositorioUsuarios {
 *     readonly #datos = new Map<Email, Usuario>();
 *     async buscarPorEmail(email: Email): Promise<Usuario | undefined> { return this.#datos.get(email); }
 *     async guardar(usuario: Usuario): Promise<void> { this.#datos.set(usuario.email, { ...usuario }); }
 * }
 *
 * class HasheadorScrypt implements Hasheador {
 *     hashear(plano: string): HashPassword {
 *         const salt = randomBytes(16).toString('hex');
 *         return `${salt}:${scryptSync(plano, salt, 64).toString('hex')}` as HashPassword;
 *     }
 *     verificar(plano: string, hash: HashPassword): boolean {
 *         const [salt = '', hex = ''] = hash.split(':');
 *         const guardado = Buffer.from(hex, 'hex');
 *         const intento = scryptSync(plano, salt, 64);
 *         return guardado.length === intento.length && timingSafeEqual(guardado, intento);
 *     }
 * }
 *
 * // --- Caso de uso (depende solo de puertos) ---
 * type ResultadoRegistro = { ok: true; id: string } | { ok: false; error: 'EMAIL_INVALIDO' | 'EMAIL_EN_USO' };
 *
 * class ServicioAutenticacion {
 *     readonly #repo: RepositorioUsuarios;
 *     readonly #hasheador: Hasheador;
 *     readonly #generarId: () => string;
 *
 *     constructor(repo: RepositorioUsuarios, hasheador: Hasheador, generarId: () => string) {
 *         this.#repo = repo;
 *         this.#hasheador = hasheador;
 *         this.#generarId = generarId;
 *     }
 *
 *     async registrar(emailCrudo: string, password: string): Promise<ResultadoRegistro> {
 *         let email: Email;
 *         try { email = crearEmail(emailCrudo); } catch { return { ok: false, error: 'EMAIL_INVALIDO' }; }
 *         if (await this.#repo.buscarPorEmail(email)) return { ok: false, error: 'EMAIL_EN_USO' };
 *         const usuario: Usuario = { id: this.#generarId(), email, hash: this.#hasheador.hashear(password) };
 *         await this.#repo.guardar(usuario);
 *         return { ok: true, id: usuario.id };
 *     }
 *
 *     async login(emailCrudo: string, password: string): Promise<boolean> {
 *         const usuario = await this.#repo.buscarPorEmail(crearEmail(emailCrudo));
 *         return usuario !== undefined && this.#hasheador.verificar(password, usuario.hash);
 *     }
 * }
 *
 * function firmaWebhookValida(cuerpo: string, firmaHex: string, secreto: string): boolean {
 *     const esperada = createHmac('sha256', secreto).update(cuerpo).digest();
 *     const recibida = Buffer.from(firmaHex, 'hex');
 *     return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
 * }
 *
 * // --- Composición (raíz de composición: aquí se eligen los adaptadores) ---
 * async function main(): Promise<void> {
 *     let secuencia = 0;
 *     const auth = new ServicioAutenticacion(
 *         new RepositorioUsuariosMemoria(), new HasheadorScrypt(), () => `USR-${++secuencia}`, // prod: randomUUID
 *     );
 *
 *     console.log('Registro:', await auth.registrar('  Ana@Banco.com ', 'Clave#Segura2026'));
 *     console.log('Duplicado:', await auth.registrar('ana@banco.com', 'otra'));
 *     console.log('Inválido:', await auth.registrar('ana@@banco', 'x'));
 *     console.log('Login correcto:', await auth.login('ANA@banco.com', 'Clave#Segura2026'));
 *     console.log('Login incorrecto:', await auth.login('ana@banco.com', 'clave#segura2026'));
 *
 *     const cuerpo = '{"evento":"pago.aprobado","monto":150000}';
 *     const firma = createHmac('sha256', 'whsec_demo').update(cuerpo).digest('hex');
 *     console.log('Webhook válido:', firmaWebhookValida(cuerpo, firma, 'whsec_demo'));
 *     console.log('Webhook alterado:', firmaWebhookValida(cuerpo.replace('150000', '950000'), firma, 'whsec_demo'));
 * }
 *
 * main().catch((error: unknown) => {
 *     console.error('Fallo inesperado:', error);
 *     process.exitCode = 1;
 * });
 *
 * // Salida esperada:
 * // Registro: { ok: true, id: 'USR-1' }
 * // Duplicado: { ok: false, error: 'EMAIL_EN_USO' }
 * // Inválido: { ok: false, error: 'EMAIL_INVALIDO' }
 * // Login correcto: true
 * // Login incorrecto: false
 * // Webhook válido: true
 * // Webhook alterado: false
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - `as Email` FUERA DEL VALIDADOR ANULA LA MARCA: permite el cast solo dentro
 *   del "constructor inteligente" y prohíbelo en revisiones (o con una regla
 *   de ESLint). Un branded type es tan fiable como su único punto de entrada.
 * - VALIDA EN LA FRONTERA, CONFÍA DENTRO: el body HTTP es `unknown`; conviértelo
 *   en tipos de dominio (Zod/Valibot o guards propios) antes del caso de uso.
 * - `timingSafeEqual` EXIGE MISMA LONGITUD: compara `length` primero; nunca
 *   compares firmas o tokens con `===` (filtra información por tiempo).
 * - NO REGISTRES SECRETOS: logs, errores y `JSON.stringify` deben enmascarar
 *   contraseñas, tokens y PAN de tarjetas; los secretos vienen de variables de
 *   entorno validadas al arrancar, nunca del código fuente.
 * - EL DOMINIO NO IMPORTA INFRAESTRUCTURA: si `Usuario.ts` importa `pg` o
 *   `express`, la arquitectura está invertida. Revisa las dependencias con
 *   `dependency-cruiser` o reglas de ESLint de importación.
 * - `erasableSyntaxOnly` (TS 5.8) y `node --experimental-strip-types`
 *   prohíben *parameter properties* (`constructor(private repo: Repo)`) y
 *   `enum`; por eso el ejemplo asigna campos `#privados` explícitamente.
 * - Mantén `npm audit`, Dependabot y `strict: true` en el CI; una dependencia
 *   comprometida anula cualquier tipo.
 *
 * 6. PROYECTO INTEGRADOR FINAL: 10 RETOS PARA CONSTRUIR UNA BILLETERA DIGITAL SENIOR
 * ----------------------------------------------------------------------------
 * Construirás paso a paso un backend fintech en TypeScript estricto (dominio,
 * casos de uso, puertos, adaptadores y suite de pruebas `node:test` +
 * `node:assert/strict`) integrando todo lo aprendido del Tema 01 al Tema 30:
 *
 * [Fase 1: Dominio Tipado, Inmutable y Seguro]
 * 1. **Objetos de valor con branded types (`Email`, `Centavos`, `IdCuenta`,
 *    `CodigoMoneda`)**: constructores inteligentes que validen (Unicode NFC,
 *    enteros seguros, `as const` para monedas) y un `Dinero` inmutable con
 *    `sumar`, `restar` y `toJSON()` que impida mezclar monedas en compilación.
 * 2. **Servicio criptográfico (`GestorSeguridad`)**: `randomUUID`, OTP con
 *    `randomInt`, hashing `scrypt` + `timingSafeEqual`, firmas HMAC-SHA256 de
 *    webhooks y `copiarSeguro` contra *Prototype Pollution*.
 * 3. **Entidad `Transferencia` con máquina de estados tipada**: unión
 *    discriminada `PENDIENTE -> APROBADA -> LIQUIDADA` o `RECHAZADA`, con
 *    transiciones ilegales imposibles de representar y `switch` exhaustivo.
 *
 * [Fase 2: Puertos, Adaptadores y Control de Concurrencia]
 * 4. **Puertos genéricos `Repositorio<T, Id>`** y adaptadores en memoria
 *    (`Map`) con clonación defensiva (`structuredClone`) y operaciones `async`.
 * 5. **Decoradores de infraestructura**: `CacheLru<K, V>` para saldos y un
 *    *Rate Limiter* por ventana para intentos de login y envío de OTP; más un
 *    `Mutex` por cuenta que evite el doble gasto en retiros simultáneos.
 *
 * [Fase 3: Caso de Uso Transaccional, Patrones e Idempotencia]
 * 6. **Estrategias de comisión (Strategy)**: funciones puras tipadas por tipo
 *    de cuenta y destino (`satisfies Record<TipoCuenta, PoliticaComision>`).
 * 7. **`TransferirFondosUseCase`** asíncrono con `idempotencyKey` (sin doble
 *    cargo si el usuario repite la petición), verificación de saldo, `Result`
 *    tipado de errores de negocio y eventos `'transferencia.liquidada'` en un
 *    `BusEventos<EventosBilletera>` tipado.
 *
 * [Fase 4: Analítica Funcional, Auditoría y Suite de Pruebas]
 * 8. **Reporte ejecutivo funcional**: volumen liquidado en centavos, ticket
 *    promedio, transferencias por estado (`Object.groupBy`) y top 3 cuentas
 *    con más movimientos, todo con funciones puras y `readonly`.
 * 9. **Auditoría en streaming**: exporta los eventos a un `.jsonl` temporal
 *    (`node:fs/promises`, escritura atómica con renombrado) y reimpórtalos con
 *    `readline` + `for await...of`, validando cada línea desde `unknown` y
 *    limpiando en `finally`.
 * 10. **Suite end-to-end con `node:test`**: pruebas AAA de transferencia
 *     exitosa, idempotencia, saldo insuficiente, carrera de retiros
 *     simultáneos, bloqueo de *Prototype Pollution*, firma HMAC inválida y
 *     exactitud del reporte; añade `tsc --noEmit` y ESLint al script de CI.
 */

export {};
// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.
