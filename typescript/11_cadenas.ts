/*
 * ============================================================================
 * TEMA 11: CADENAS TIPADAS, LITERALES, TEMPLATE LITERAL TYPES Y UNICODE
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: el texto también tiene forma)
 * ----------------------------------------------------------------------------
 * En runtime un `string` de TypeScript es exactamente un string de JavaScript:
 * inmutable, codificado en UTF-16 (`'🚀'.length === 2`) y con los mismos
 * métodos (`trim`, `slice`, `normalize`, `replaceAll`...). Lo que TS aporta es
 * la capacidad de describir QUÉ textos son válidos antes de ejecutar nada:
 *
 * 1) `string` vs tipos literales: `let x = 'hola'` se ensancha a `string`, pero
 *    `const x = 'hola'` tiene el tipo literal `'hola'`. Una unión como
 *    `'USD' | 'EUR' | 'COP'` reemplaza a los "strings mágicos" y el editor
 *    autocompleta y rechaza erratas (`'UDS'`) en compilación.
 * 2) Template literal types (TS 4.1+): `` type Ruta = `/api/${string}` `` o
 *    `` type Evento = `${Entidad}.${Accion}` `` generan el producto cartesiano de
 *    uniones. Permiten tipar ids con prefijo (`PED-${string}`), nombres de
 *    eventos, claves CSS (`${number}px`) o variables de entorno.
 * 3) Tipos intrínsecos de texto: `Uppercase<T>`, `Lowercase<T>`,
 *    `Capitalize<T>` y `Uncapitalize<T>` transforman literales a nivel de tipo
 *    (`Capitalize<'pedido'>` es `'Pedido'`).
 * 4) `noUncheckedIndexedAccess`: `texto[0]` es `string | undefined`, porque un
 *    string vacío no tiene índice 0. Lo mismo con `split(',')[1]`.
 * 5) `string` (primitivo) vs `String` (objeto envoltorio): anota SIEMPRE con
 *    minúscula; `String` acepta objetos `new String()` y es una trampa.
 * 6) Los tipos se borran: TS no valida el contenido de un string que llega de
 *    un formulario o de `JSON.parse`. Para convertir `string` en un literal
 *    seguro necesitas una función de parseo o un predicado `x is T`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Bus de eventos / analítica: `'pedido.creado' | 'pedido.pagado'` evita que
 *   un evento mal escrito se pierda en silencio.
 * - Identificadores con prefijo (estilo Stripe: `cus_...`, `pi_...`): un
 *   `IdCliente` no se confunde con un `IdFactura` al pasar argumentos.
 * - Rutas de API y claves i18n (`'checkout.boton.pagar'`) verificadas.
 * - Normalización de entradas: `trim`, `normalize('NFD')`, `toLowerCase` y
 *   `localeCompare('es')` para buscadores y ordenamiento en español.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * let libre = 'texto';                      // string (se ensancha)
 * const fijo = 'texto';                     // 'texto' (literal)
 * type Moneda = 'USD' | 'EUR' | 'COP';      // unión de literales
 * type Px = `${number}px`;                  // '12px' sí, '12em' no
 * type IdCliente = `cus_${string}`;         // prefijo obligatorio
 * type Metodo = 'get' | 'post';
 * type Handler = `on${Capitalize<Metodo>}`; // 'onGet' | 'onPost'
 * type Grito = Uppercase<'hola'>;           // 'HOLA'
 *
 * const inicial = 'Árbol'[0];               // string | undefined (noUnchecked...)
 * const ultima = 'Árbol'.at(-1) ?? '';      // .at() también puede dar undefined
 * const [usuario = '', dominio = ''] = 'ana@empresa.co'.split('@');
 *
 * const sinTildes = 'Canción'.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
 * const orden = ['Ñandú', 'Oso', 'Nube'].sort((a, b) => a.localeCompare(b, 'es'));
 *
 * function esMoneda(x: string): x is Moneda {   // de string a literal seguro
 *     return x === 'USD' || x === 'EUR' || x === 'COP';
 * }
 * const MONEDAS = ['USD', 'EUR', 'COP'] as const;
 * type Moneda2 = (typeof MONEDAS)[number];      // deriva la unión del arreglo
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un bus de eventos de un e-commerce recibe nombres de eventos como
 * texto libre (desde un webhook). Los normalizamos y solo dejamos pasar los que
 * encajan en el template literal type `${Entidad}.${Accion}`; además generamos
 * ids con prefijo y etiquetas capitalizadas tipadas.
 *
 * const ENTIDADES = ['usuario', 'pedido', 'factura'] as const;
 * const ACCIONES = ['creado', 'actualizado', 'eliminado'] as const;
 * type Entidad = (typeof ENTIDADES)[number];
 * type Accion = (typeof ACCIONES)[number];
 * type NombreEvento = `${Entidad}.${Accion}`;   // 9 combinaciones válidas
 * type IdPedido = `PED-${string}`;
 *
 * function parsearEvento(crudo: string): NombreEvento | null {
 *     const limpio = crudo.trim().toLowerCase();
 *     const [entidad = '', accion = '', ...resto] = limpio.split('.');
 *     const e = ENTIDADES.find((x) => x === entidad);
 *     const a = ACCIONES.find((x) => x === accion);
 *     if (resto.length > 0 || e === undefined || a === undefined) return null;
 *     return `${e}.${a}`;                         // TS comprueba el patrón
 * }
 *
 * function etiqueta<E extends Entidad>(entidad: E): Capitalize<E> {
 *     return (entidad.charAt(0).toUpperCase() + entidad.slice(1)) as Capitalize<E>;
 * }
 *
 * function crearIdPedido(secuencia: number): IdPedido {
 *     return `PED-${String(secuencia).padStart(5, '0')}`;
 * }
 *
 * const entradas = ['  Pedido.Creado ', 'usuario.borrado', 'factura.eliminado', 'pedido.creado.x'];
 * for (const crudo of entradas) {
 *     const evento = parsearEvento(crudo);
 *     console.log(`${JSON.stringify(crudo).padEnd(20)} -> ${evento ?? 'RECHAZADO'}`);
 * }
 * const titulo: 'Factura' = etiqueta('factura'); // el tipo literal se conserva
 * console.log(titulo, crearIdPedido(42));
 *
 * // Salida esperada:
 * // "  Pedido.Creado "   -> pedido.creado
 * // "usuario.borrado"    -> RECHAZADO
 * // "factura.eliminado"  -> factura.eliminado
 * // "pedido.creado.x"    -> RECHAZADO
 * // Factura PED-00042
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - `as NombreEvento` NO VALIDA NADA: `crudo as NombreEvento` silencia al
 *   compilador aunque el texto sea basura. Convierte con una función de parseo
 *   (que puede devolver `null`) o con un predicado `x is T`.
 * - DERIVA LAS UNIONES DE UN ARREGLO `as const`: así tienes una sola fuente de
 *   verdad para el tipo y para la validación en runtime (`includes`/`find`).
 * - CUIDADO CON LA EXPLOSIÓN COMBINATORIA: `${A}${B}${C}` con uniones grandes
 *   puede generar decenas de miles de miembros y ralentizar el compilador (TS
 *   corta a 100 000). Usa `${string}` cuando no necesites enumerar.
 * - `str.replace('a', 'b')` SOLO CAMBIA LA PRIMERA APARICIÓN: usa
 *   `replaceAll` (requiere `lib` ES2021+ en `tsconfig.json`).
 * - `length` CUENTA UNIDADES UTF-16: para contar caracteres visuales usa
 *   `Intl.Segmenter` (ES2022) y normaliza con `normalize('NFC')` antes de
 *   comparar textos que vienen de macOS (NFD).
 * - NO ANOTES CON `String`: el tipo `String` (mayúscula) es el envoltorio; usa
 *   siempre `string`.
 * - ORDENA CON `localeCompare(b, 'es')`: el `sort()` por defecto compara
 *   códigos UTF-16 y coloca 'Ñandú' y las tildes después de la 'z'.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Moneda segura: define `const MONEDAS = ['USD', 'EUR', 'COP'] as const`,
 *    deriva `type Moneda` y escribe `formatearPrecio(monto: number, moneda:
 *    Moneda): string`. Comprueba que `'UDS'` provoca un error de compilación.
 * 2. Índices seguros: escribe `inicialMayuscula(texto: string): string` que
 *    funcione con texto vacío, sin usar `!`, gracias a `noUncheckedIndexedAccess`.
 * 3. Enmascarar tarjeta: `enmascarar(numero: string): string` con `slice(-4)`
 *    y `padStart`, y un tipo `` Ultimos4 = `****${string}` `` como retorno.
 *
 * [Intermedio]
 * 4. Unidades CSS: define `` type MedidaCss = `${number}${'px' | 'rem' | '%'}` ``
 *    y una función `parsearMedida(texto: string): MedidaCss | null` con regex.
 * 5. Generador de handlers: a partir de `type Campo = 'nombre' | 'correo'`
 *    construye `` type Setters = `set${Capitalize<Campo>}` `` y un objeto que
 *    implemente esos métodos con `Record<Setters, (v: string) => void>`.
 * 6. Slug tipado: `crearSlug(titulo: string): Slug` donde `Slug` es un tipo
 *    con marca (`string & { readonly __marca: 'Slug' }`); quita tildes con NFD.
 * 7. Buscador flexible: `contiene(base: string, consulta: string): boolean`
 *    insensible a mayúsculas y tildes; prueba con 'La Canción del Verano'.
 *
 * [Senior / Producción]
 * 8. Rutas con parámetros: tipa `ParamsDe<'/usuarios/:id/pedidos/:pedidoId'>`
 *    con `infer` recursivo para obtener `{ id: string; pedidoId: string }`, y
 *    una función `construirRuta` que exija esos parámetros.
 * 9. Parser `.env`: `parsearEnv(contenido: string): Record<string, string>`
 *    que ignore comentarios `#`, admita `=` dentro del valor y quite comillas;
 *    luego valida que existan las claves de `type ClaveEnv = 'DB_URL' | 'PORT'`.
 * 10. Escapado HTML: `escaparHtml(texto: string): HtmlSeguro` (tipo con marca)
 *     y una función de plantilla etiquetada `` html`...` `` que solo acepte
 *     `HtmlSeguro` o valores escapados automáticamente para prevenir XSS.
 */

// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.

export {}; // Convierte el archivo en módulo para evitar choques de nombres entre temas.
