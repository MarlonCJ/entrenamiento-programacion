/*
 * ============================================================================
 * TEMA 14: FUNCIONES TIPADAS, SOBRECARGAS, GENÉRICOS Y PARÁMETRO THIS
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: la firma es el contrato)
 * ----------------------------------------------------------------------------
 * En runtime una función de TypeScript es una función de JavaScript normal:
 * objeto de primera clase, `this` dinámico (léxico en las arrow) y ninguna
 * validación de argumentos. TS añade una FIRMA que se comprueba en cada
 * llamada y que desaparece al compilar (type erasure):
 *
 * 1) Parámetros y retorno: en una declaración suelta los parámetros DEBEN
 *    anotarse (`noImplicitAny`); en callbacks se infieren por contexto
 *    (`items.map((x) => ...)`). El retorno se infiere, pero anotarlo en
 *    funciones exportadas fija la API y ubica los errores donde corresponde.
 * 2) Opcionales, por defecto y rest: `p?: T` equivale a `T | undefined`;
 *    `p = 10` infiere `number` y lo vuelve opcional; `...ids: string[]` agrupa
 *    el resto. Los opcionales van siempre al final.
 * 3) Tipos de función: `type Validador = (valor: string) => boolean`. Una
 *    función con MENOS parámetros es asignable a uno que pide más (por eso
 *    `forEach((x) => ...)` compila). Un tipo que retorna `void` acepta
 *    funciones que devuelven algo: el valor simplemente se ignora.
 * 4) `never`: la función nunca retorna (lanza o no termina). Base del chequeo
 *    exhaustivo en `switch`.
 * 5) Sobrecargas: varias firmas públicas + UNA implementación compatible e
 *    invisible para quien llama. Útiles cuando el tipo de RETORNO depende del
 *    argumento. En runtime la implementación distingue los casos a mano.
 * 6) Genéricos: `<T>` conecta entrada y salida sin perder información;
 *    `<K extends PropertyKey>` o `<K extends keyof T>` restringen qué tipos
 *    son válidos. TS infiere `T` desde los argumentos.
 * 7) Parámetro `this`: `registrar(this: Metricas, ...)` es un parámetro falso
 *    (se borra al compilar) que prohíbe invocar el método "suelto" con otro
 *    `this`, el bug clásico de los métodos extraídos.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Servicios de dominio con Options Object tipado en lugar de 5 posiciones.
 * - SDKs: sobrecargas tipo `obtener(id): Usuario` / `obtener(ids[]): Usuario[]`.
 * - Utilidades genéricas reutilizables: `agruparPor`, `reintentar<T>`,
 *   `memoizar`, `debounce`.
 * - Middlewares y handlers: `type Handler = (req: Peticion) => Promise<Respuesta>`.
 * - Validación en fronteras con predicados `(x: unknown): x is Pedido`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * function sumar(a: number, b: number): number { return a + b; }
 * const restar = (a: number, b: number): number => a - b;
 * type Comparador<T> = (a: T, b: T) => number;               // tipo de función
 * interface ConContador { (x: string): void; llamadas: number; } // call signature
 *
 * function saludar(nombre: string, saludo = 'Hola', titulo?: string): string {
 *     return `${saludo}, ${titulo ? titulo + ' ' : ''}${nombre}`;
 * }
 * function log(nivel: 'info' | 'error', ...partes: string[]): void { }
 * function crear({ nombre, activo = true }: { nombre: string; activo?: boolean }) { }
 *
 * function primero<T>(xs: readonly T[]): T | undefined { return xs[0]; }
 * function prop<T, K extends keyof T>(obj: T, k: K): T[K] { return obj[k]; }
 *
 * function fallar(msg: string): never { throw new Error(msg); }
 * function esTexto(x: unknown): x is string { return typeof x === 'string'; }
 * function afirmar(cond: unknown, msg: string): asserts cond { if (!cond) fallar(msg); }
 *
 * function parsear(x: string): number;                       // sobrecarga 1
 * function parsear(x: readonly string[]): number[];           // sobrecarga 2
 * function parsear(x: string | readonly string[]): number | number[] {
 *     return typeof x === 'string' ? Number(x) : x.map(Number);
 * }
 *
 * type P = Parameters<typeof saludar>;   // [nombre: string, saludo?: string, titulo?: string]
 * type R = ReturnType<typeof saludar>;   // string
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un microservicio de notificaciones normaliza destinos con
 * sobrecargas (el retorno depende del canal), agrupa la cola con un genérico
 * restringido, calcula costos con un `switch` exhaustivo y lleva métricas con
 * un método cuyo `this` está tipado.
 *
 * type Canal = 'email' | 'sms';
 * interface Notificacion {
 *     readonly canal: Canal;
 *     readonly destino: string;
 *     readonly prioridad: 'alta' | 'normal';
 * }
 *
 * function normalizarDestino(canal: 'email', destino: string): `${string}@${string}`;
 * function normalizarDestino(canal: 'sms', destino: string): `+${string}`;
 * function normalizarDestino(canal: Canal, destino: string): string {
 *     const limpio = destino.trim();
 *     return canal === 'email' ? limpio.toLowerCase() : `+57${limpio.replace(/\D/g, '')}`;
 * }
 *
 * function agruparPor<T, K extends PropertyKey>(items: readonly T[], clave: (item: T) => K): Map<K, T[]> {
 *     const grupos = new Map<K, T[]>();
 *     for (const item of items) {
 *         const k = clave(item);
 *         const lista = grupos.get(k);
 *         if (lista) lista.push(item);
 *         else grupos.set(k, [item]);
 *     }
 *     return grupos;
 * }
 *
 * function fallarExhaustivo(valor: never): never {
 *     throw new Error(`Caso no contemplado: ${String(valor)}`);
 * }
 * function costoUnitario(canal: Canal): number {
 *     switch (canal) {
 *         case 'email': return 0.001;
 *         case 'sms': return 0.05;
 *         default: return fallarExhaustivo(canal);   // si agregas 'push', no compila
 *     }
 * }
 *
 * interface Metricas {
 *     enviados: number;
 *     registrar(this: Metricas, canal: Canal): string;
 * }
 * const metricas: Metricas = {
 *     enviados: 0,
 *     registrar(canal) {
 *         this.enviados += 1;
 *         return `#${this.enviados} vía ${canal}`;
 *     },
 * };
 *
 * const cola: readonly Notificacion[] = [
 *     { canal: 'email', destino: '  Ana@Empresa.CO ', prioridad: 'alta' },
 *     { canal: 'sms', destino: '300 123 4567', prioridad: 'normal' },
 *     { canal: 'email', destino: 'luis@empresa.co', prioridad: 'normal' },
 * ];
 *
 * const correo = normalizarDestino('email', '  Ana@Empresa.CO ');   // `${string}@${string}`
 * const movil = normalizarDestino('sms', '300 123 4567');          // `+${string}`
 * console.log(correo, movil);
 *
 * const grupos = agruparPor(cola, (n) => n.prioridad);   // Map<'alta' | 'normal', Notificacion[]>
 * console.log([...grupos].map(([k, v]) => `${k}: ${v.length}`).join(' | '));
 *
 * const total = cola.reduce((acc, n) => acc + costoUnitario(n.canal), 0);
 * console.log(`Costo del lote: $${total.toFixed(3)}`);
 *
 * for (const n of cola) console.log(metricas.registrar(n.canal));
 * // const suelto = metricas.registrar; suelto('sms');   // ❌ 'this' de tipo void
 *
 * // Salida esperada:
 * // ana@empresa.co +573001234567
 * // alta: 1 | normal: 2
 * // Costo del lote: $0.052
 * // #1 vía email
 * // #2 vía sms
 * // #3 vía email
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - LOS TIPOS NO VALIDAN EN RUNTIME: si los argumentos vienen de
 *   `JSON.parse` (que es `any`), TS no comprobará nada. Valida en la frontera
 *   con predicados o Zod y confía en los tipos solo hacia adentro.
 * - PREFIERE UNIONES O GENÉRICOS ANTES QUE SOBRECARGAS: la firma de
 *   implementación es laxa y no se comprueba contra cada sobrecarga en detalle.
 *   Úsalas solo si el retorno depende del argumento.
 * - EVITA BANDERAS BOOLEANAS POSICIONALES: `crearUsuario('ana', true, false)`
 *   es ilegible. Usa un Options Object con propiedades opcionales y defaults.
 * - `map(parseInt)` SIGUE ROTO: TS lo acepta, pero `['10', '10'].map(parseInt)`
 *   da `[ 10, NaN ]` porque recibe el índice como `radix`. Escribe
 *   `map((s) => Number.parseInt(s, 10))`.
 * - GENÉRICOS QUE NO RELACIONAN NADA SOBRAN: `<T>(x: T): void` es igual que
 *   `(x: unknown): void`. Un parámetro de tipo debe aparecer al menos dos
 *   veces (entrada y salida, o dos entradas).
 * - NO DEVUELVAS `any` NI ABUSES DE `as`: un `as any` dentro de un genérico
 *   rompe el contrato en silencio; usa `unknown` y estrecha.
 * - ARROW FUNCTIONS COMO MÉTODOS de objeto pierden el `this` del objeto;
 *   úsalas para callbacks y la sintaxis de método cuando dependas de `this`.
 * - FUNCIONES PEQUEÑAS Y PURAS: una responsabilidad, sin efectos ocultos;
 *   son triviales de probar con Vitest.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. IMC tipado: `calcularImc(pesoKg: number, alturaM: number): number` y
 *    `clasificarImc(imc: number): 'Bajo' | 'Normal' | 'Sobrepeso' | 'Obesidad'`.
 * 2. Opcionales y defaults: `formatearNombre(nombre: string, apellido?:
 *    string, mayusculas = false): string`, probado con tres llamadas.
 * 3. Rest y `never`: `promedio(...notas: number[]): number` que use un helper
 *    `fallar(msg): never` cuando no recibe notas.
 *
 * [Intermedio]
 * 4. Options Object: `programarEnvio({ destino, prioridad = 'normal',
 *    reintentos = 3 }: OpcionesEnvio): string` con `prioridad` como unión.
 * 5. Sobrecargas: `buscarEmpleado(id: number): Empleado | undefined` y
 *    `buscarEmpleado(ids: readonly number[]): Empleado[]` con una sola
 *    implementación.
 * 6. Genérico con restricción: `ordenarPor<T, K extends keyof T>(items:
 *    readonly T[], clave: K): T[]` que no mute el arreglo original.
 * 7. Predicado de tipo: `esProducto(x: unknown): x is Producto` usado con
 *    `.filter(esProducto)` sobre datos crudos de una API.
 *
 * [Senior / Producción]
 * 8. `memoizar<A extends readonly unknown[], R>(fn: (...args: A) => R):
 *    (...args: A) => R` que conserve la firma original y use un `Map` con
 *    clave serializada.
 * 9. `reintentar<T>(op: () => Promise<T>, { intentos, esperaMs }: Opciones):
 *    Promise<T>` con espera exponencial y tipo de retorno preservado.
 * 10. `pipe` tipado: implementa `pipe(valor, f1, f2, f3)` con sobrecargas o
 *     genéricos para que el tipo fluya entre funciones, y prueba con
 *     `expectTypeOf` (Vitest) que la inferencia es correcta.
 */

// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.

export {}; // Convierte el archivo en módulo para evitar choques de nombres entre temas.
