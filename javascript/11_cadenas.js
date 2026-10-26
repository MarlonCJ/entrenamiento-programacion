'use strict';

/*
 * ============================================================================
 * TEMA 11: CADENAS DE TEXTO, UNICODE (UTF-16), NORMALIZACIÓN Y PROCESAMIENTO
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Strings en JavaScript)
 * ----------------------------------------------------------------------------
 * En JavaScript, los `string` son **100% inmutables** (ningún método modifica el
 * string original; todos devuelven un nuevo string) y se almacenan internamente
 * como secuencias de unidades de código **UTF-16** de 16 bits.
 *
 * Los 3 Detalles Críticos de Unicode en JavaScript que un Senior domina:
 * 1) **`str.length` cuenta unidades UTF-16, NO caracteres visuales (Grafemas)**:
 *    Los caracteres del plano básico (ASCII, letras latinas con tilde) ocupan 1
 *    unidad de 16 bits, pero los emojis (`'🚀'`, `'👨‍👩‍👧‍👦'`) ocupan **pares sustitutos**
 *    (*surrogate pairs*, 2 o más unidades de 16 bits). Por eso `'🚀'.length` es
 *    **`2`**! Para contar puntos de código Unicode usa `[...str].length`, y para
 *    separar caracteres visuales reales usa **`Intl.Segmenter`** (ES2022+).
 * 2) **Normalización Unicode (`str.normalize('NFC' | 'NFD')`)**:
 *    Una letra como `'é'` puede representarse en Unicode de dos formas: como un
 *    solo punto de código precompuesto (`\u00E9`, longitud 1) o como la letra
 *    base `'e'` seguida del acento combinante (`e` + `\u0301`, longitud 2).
 *    Visualmente son idénticas, ¡pero `"\u00E9" === "e\u0301"` da **`false`**!
 *    Aplicar `.normalize('NFC')` unifica ambas formas, y `.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`
 *    es la forma estándar y elegante de quitar tildes/diacríticos en JS!
 * 3) **Indexación Negativa con `.at(-1)` (ES2022+)**:
 *    Permite leer el último carácter limpiamente sin escribir `str[str.length - 1]`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Buscadores Insensibles a Acentos y Generadores de *Slugs*: Usar `.normalize('NFD')`
 *   para que buscar `"Bogota"` encuentre `"Bogotá"`.
 * - Validación y Limpieza de Entradas: `trim()`, `startsWith()`, `endsWith()`,
 *   `includes()`, `replaceAll()`.
 * - Enmascaramiento de Datos Sensibles (PII): Usar `slice(-4)` y `padStart(16, '*')`
 *   para ocultar números de tarjeta o cuentas bancarias.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * const frase = '  Programación en JavaScript Moderno  ';
 *
 * // 1. Limpieza, búsqueda e indexación moderna:
 * const limpia = frase.trim();
 * console.log(limpia.startsWith('Pro')); // true
 * console.log(limpia.endsWith('no'));    // true
 * console.log(limpia.includes('Java'));  // true
 * console.log(limpia.at(-1));            // 'o' (último carácter, ES2022+)
 *
 * // 2. Reemplazo global sin regex usando replaceAll (ES2021+):
 * const rutaUrl = '2026/10/25'.replaceAll('/', '-'); // "2026-10-25"
 *
 * // 3. Eliminar tildes/diacríticos de cualquier texto usando Unicode NFD:
 * function quitarDiacriticos(texto) {
 *     return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un generador de *slugs* SEO para un blog empresarial limpia
 * espacios, elimina tildes mediante normalización Unicode NFD y convierte el
 * título en una URL limpia y segura.
 *
 * function generarSlugSeo(titulo) {
 *     return titulo
 *         .normalize('NFD')
 *         .replace(/[\u0300-\u036f]/g, '') // Elimina marcas diacríticas (tildes/diéresis)
 *         .toLowerCase()
 *         .trim()
 *         .replace(/[^a-z0-9\s-]/g, '')    // Solo alfanuméricos, espacios y guiones
 *         .replace(/[\s-]+/g, '-');        // Colapsa espacios/guiones múltiples en uno solo
 * }
 *
 * console.log(generarSlugSeo('  ¡Guía de Optimización & Diseño en Node.js (2026)!  '));
 * // Salida esperada:
 * // guia-de-optimizacion-diseno-en-nodejs-2026
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - RECUERDA QUE `str.replace('a', 'b')` CON STRING SOLO REEMPLAZA LA **PRIMERA**
 *   APARICIÓN: Este es un bug clásico en JS. Para reemplazar todas las
 *   apariciones de una subcadena literal usa siempre **`str.replaceAll('a', 'b')`**
 *   (ES2021+).
 * - PREFIERE `slice(inicio, fin)` SOBRE `substring()` Y NUNCA USES `substr()`:
 *   `substr()` está deprecado en el estándar web, y `substring()` intercambia
 *   silenciosamente sus argumentos si `inicio > fin` y no soporta índices
 *   negativos. `slice()` soporta índices negativos (`str.slice(-4)`) y es
 *   consistente con `Array.prototype.slice`.
 * - SIEMPRE NORMALIZA CON `.normalize('NFC')` ANTES DE COMPARAR NOMBRES DE
 *   ARCHIVOS O TEXTOS SUBIDOS DESDE MACOS VS WINDOWS/LINUX (macOS usa NFD!).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Limpieza y verificación de URLs: Crea una función que reciba una URL con
 *    espacios alrededor, la limpie, verifique con `startsWith` si es `'https://'`
 *    y extraiga el último segmento usando `.split('/').at(-1)`.
 * 2. Diferencia entre `replace` y `replaceAll`: Demuestra cómo `replace('.', '-')`
 *    en `"192.168.1.1"` solo cambia el primer punto mientras que `replaceAll('.', '-')`
 *    los cambia todos.
 * 3. Enmascarador de tarjetas y correos: Crea `enmascararTarjeta(numero)` usando
 *    `.slice(-4)` y `.padStart(numero.length, '*')`.
 *
 * [Intermedio]
 * 4. Normalización Unicode (`NFC` vs `NFD`): Demuestra en código que
 *    `'\u00E9' === 'e\u0301'` es `false` aunque ambos imprimen `'é'`, y cómo
 *    compararlos tras `.normalize('NFC')` devuelve `true`.
 * 5. Buscador insensible a mayúsculas y tildes: Implementa `contieneTextoFlexible(textoBase, busqueda)`
 *    que permita encontrar `"cancion"` dentro de `"La Canción del Verano"`.
 * 6. Conversor entre `snake_case`, `kebab-case` y `camelCase`: Implementa
 *    `aCamelCase(identificador)` (ej. `"fecha_creacion_usuario"` -> `"fechaCreacionUsuario"`).
 * 7. Inversión segura de cadenas con Unicode: Demuestra que `"Hola 🚀".split('').reverse().join('')`
 *    corrompe el emoji `'🚀'`, mientras que `[..."Hola 🚀"].reverse().join('')`
 *    lo invierte correctamente!
 *
 * [Senior / Producción]
 * 8. Conteo de Grafemas Reales con `Intl.Segmenter` (ES2022+): Usa
 *    `new Intl.Segmenter('es', { granularity: 'grapheme' })` para contar con
 *    exactitud cuántos caracteres visuales tiene un texto que incluye emojis
 *    compuestos (`'👨‍👩‍👧‍👦'`) y banderas.
 * 9. Parser de Variables de Entorno (Archivo `.env`): Implementa `parsearArchivoEnv(contenidoTexto)`
 *    que procese un bloque multilínea ignorando líneas vacías y comentarios `#`,
 *    separe `CLAVE=VALOR` (incluso si el valor contiene signos `=`) y elimine
 *    comillas envolventes.
 * 10. Prevención de XSS y Sanitización de Atributos HTML: Implementa un
 *     escapador rápido de entidades HTML (`&`, `<`, `>`, `"`, `'`) y úsalo para
 *     renderizar de forma segura un objeto de perfil de usuario en una plantilla
 *     HTML.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
