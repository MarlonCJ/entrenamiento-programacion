'use strict';

/*
 * ============================================================================
 * TEMA 13: COLECCIONES MODERNAS (MAP, SET, WEAKMAP, WEAKSET Y OBJECT.GROUPBY)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Tablas Hash en V8)
 * ----------------------------------------------------------------------------
 * En JavaScript moderno cuentas con colecciones nativas especializadas en el
 * motor V8 que superan a los objetos planos `{}` y a los arreglos `[]` cuando
 * necesitas búsquedas en tiempo constante **$O(1)$**:
 *
 * 1) **`Map` vs Objeto Plano `{}`**:
 *    - En un objeto `{}` las claves se convierten forzosamente a `string` (o
 *      `Symbol`), hereda propiedades de `Object.prototype` (como `toString`,
 *      `constructor`), y obtener su tamaño requiere `Object.keys(obj).length` ($O(n)$).
 *    - **`Map`** acepta **cualquier tipo como clave** (números reales, objetos,
 *      funciones), mantiene el orden de inserción, tiene `.size` en **$O(1)$**,
 *      es más rápido en inserciones/borrados frecuentes y está 100% libre de
 *      contaminación de prototipo (*Prototype Pollution*).
 * 2) **`Set` vs `Array.prototype.includes()`**:
 *    - `arr.includes(x)` recorre el arreglo elemento por elemento (**$O(n)$**).
 *    - **`set.has(x)`** busca en una tabla hash en tiempo constante (**$O(1)$**)
 *      usando el algoritmo *SameValueZero* (encuentra incluso `NaN`!).
 * 3) **`WeakMap` y `WeakSet` (Referencias Débiles y Prevención de Memory Leaks)**:
 *    Solo aceptan objetos como claves y **NO impiden que el Garbage Collector
 *    libere el objeto** cuando ya no quedan otras referencias hacia él.
 * 4) **`Object.groupBy` y `Map.groupBy` (ES2024+)**:
 *    Agrupan cualquier iterable en una sola línea nativa!
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Deduplicación Instantánea de Arreglos: `const unicos = [...new Set(lista)];`
 * - Cachés en Memoria e Indexación por ID (`Map`): Guardar `id -> entidad` con
 *   acceso `.get(id)` y `.has(id)` en $O(1)$.
 * - Asociación de Metadatos Privados a Objetos sin Fugas de Memoria (`WeakMap`):
 *   Cachear resultados calculados por instancia de `Request` o nodo DOM; cuando
 *   la petición termina, la memoria se libera sola.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Map (Diccionario O(1) con cualquier tipo de clave):
 * const catalogo = new Map([
 *     [101, { nombre: 'Teclado', precio: 45 }],
 *     [102, { nombre: 'Mouse', precio: 25 }],
 * ]);
 * catalogo.set(103, { nombre: 'Monitor', precio: 200 });
 * console.log(catalogo.get(101)?.nombre, catalogo.size); // "Teclado" 3
 *
 * // 2. Set (Conjunto de valores únicos con búsqueda .has() en O(1)):
 * const rolesActivos = new Set(['ADMIN', 'EDITOR', 'ADMIN']); // Tamaño: 2
 * console.log(rolesActivos.has('EDITOR')); // true
 *
 * // 3. Conversión entre Objetos y Mapas:
 * const mapaDesdeObj = new Map(Object.entries({ a: 1, b: 2 }));
 * const objDesdeMapa = Object.fromEntries(mapaDesdeObj);
 *
 * // 4. Agrupación nativa ES2024+ (Object.groupBy / Map.groupBy):
 * // const porEstado = Object.groupBy(pedidos, (p) => p.estado);
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Cruzar una lista de accesos contra una lista negra de IPs en tiempo
 * $O(1)$ usando `Set`, y consolidar el conteo de peticiones por IP en un `Map`.
 *
 * const ipsBloqueadas = new Set(['10.0.0.99', '192.168.1.250']);
 * const peticiones = ['10.0.0.1', '10.0.0.99', '10.0.0.1', '10.0.0.2'];
 *
 * const conteoPorIp = new Map();
 * for (const ip of peticiones) {
 *     if (ipsBloqueadas.has(ip)) continue; // Búsqueda en O(1)
 *     conteoPorIp.set(ip, (conteoPorIp.get(ip) ?? 0) + 1);
 * }
 *
 * console.log('Peticiones válidas:', JSON.stringify(Object.fromEntries(conteoPorIp)));
 * // Salida esperada:
 * // Peticiones válidas: {"10.0.0.1":2,"10.0.0.2":1}
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - ¡CUIDADO CON `JSON.stringify(new Map())` Y `JSON.stringify(new Set())`!:
 *   Por defecto, `JSON.stringify` sobre un `Map` o un `Set` devuelve **`"{}"`**
 *   (un objeto vacío)! Antes de serializar a JSON, convierte siempre el `Map` con
 *   `Object.fromEntries(miMapa)` (o `[...miMapa]`) y el `Set` con `[...miSet]`.
 * - EN `Map` Y `Set`, LOS OBJETOS SE COMPARAN POR REFERENCIA:
 *   `const s = new Set(); s.add({ id: 1 }); s.has({ id: 1 });` devuelve **`false`**
 *   porque son dos objetos distintos en el Heap. Usa como clave un primitivo
 *   (`id` o clave compuesta `"10:20"`).
 * - VERIFICACIÓN DE PROPIEDADES EN OBJETOS PLANOS (`Object.hasOwn` ES2022+):
 *   En lugar del largo `Object.prototype.hasOwnProperty.call(obj, clave)` o del
 *   operador `in` (que busca también en el prototipo, por lo que `'toString' in {}`
 *   es `true`!), usa **`Object.hasOwn(obj, clave)`**.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Deduplicación con `Set`: Dada una lista de correos con duplicados, obtén un
 *    nuevo arreglo sin repetidos en una sola línea usando `[...new Set(correos)]`.
 * 2. Operaciones CRUD en `Map`: Crea un `Map` de códigos de país (`'CO' -> 'Colombia'`),
 *    agrega 3 países, verifica existencia con `.has()`, obtén el tamaño con `.size`,
 *    elimina uno con `.delete()` y recórrelo con `for (const [cod, pais] of mapa)`.
 * 3. `Object.hasOwn` vs operador `in`: Demuestra con un objeto literal `{ a: 1 }`
 *    qué devuelve `'toString' in obj` frente a `Object.hasOwn(obj, 'toString')`.
 *
 * [Intermedio]
 * 4. Operaciones algebraicas de conjuntos con `Set` (Unión, Intersección, Diferencia):
 *    Dados dos conjuntos `setA` y `setB`, implementa funciones para calcular su
 *    unión, intersección y diferencia (o usa los métodos nativos ES2024+
 *    `.union()`, `.intersection()`, `.difference()` si están disponibles en tu runtime).
 * 5. Transformación de objetos con `Object.entries` + `.map()` + `Object.fromEntries`:
 *    Dado un objeto de precios `{ laptop: 1000, mouse: 25 }`, aplica un descuento
 *    del 10% a todos los valores devolviendo un nuevo objeto con las mismas claves.
 * 6. Agrupación con `Object.groupBy` / `Map.groupBy`: Agrupa una lista de
 *    productos por su categoría y por si tienen stock agotado (`p.stock === 0`).
 * 7. Serialización y Deserialización JSON de `Map` y `Set`: Implementa un par de
 *    funciones o un `replacer` / `reviver` para `JSON.stringify` y `JSON.parse`
 *    que convierta correctamente `Map` y `Set` sin devolver `"{}"`.
 *
 * [Senior / Producción]
 * 8. Caché de Metadatos sin Fugas de Memoria usando `WeakMap`: Crea una función
 *    `obtenerResumenCostoso(objetoUsuario)` que guarde el resultado en un
 *    `WeakMap` usando `objetoUsuario` como clave, explicando por qué un `Map`
 *    normal causaría un *Memory Leak* cuando el usuario se desconecte.
 * 9. Detector de Referencias Circulares con `WeakSet`: Implementa una función
 *    `tieneReferenciaCircular(objeto)` que recorra un grafo de objetos anidados
 *    guardando los nodos visitados en un `WeakSet` para detectar si un objeto se
 *    apunta a sí mismo.
 * 10. Diccionario Bi-direccional (`BiMap` $O(1)$ en ambos sentidos): Implementa
 *     una clase `MapaBidireccional` respaldada por dos `Map` internos (`clave -> valor`
 *     y `valor -> clave`) que permita buscar tanto por clave como por valor en
 *     tiempo constante $O(1)$ manteniendo ambos sincronizados al actualizar o borrar.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
