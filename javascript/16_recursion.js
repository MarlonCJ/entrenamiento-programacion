'use strict';

/*
 * ============================================================================
 * TEMA 16: RECURSIÓN, CALL STACK, ÁRBOLES JERÁRQUICOS Y MEMOIZACIÓN
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental del Call Stack en V8)
 * ----------------------------------------------------------------------------
 * La recursión resuelve un problema complejo descomponiéndolo en instancias más
 * pequeñas del mismo problema hasta llegar a un **Caso Base** trivial.
 *
 * Modelo Mental en el Motor V8:
 * - Cada vez que una función se llama a sí misma, V8 empuja un nuevo **Stack
 *   Frame** en la Pila de Llamadas (*Call Stack*) con sus parámetros y variables
 *   locales.
 * - El tamaño del Call Stack en V8 es limitado (~10,000 llamadas apiladas). Si
 *   olvidas el Caso Base o intentas procesar una lista lineal de 50,000 elementos
 *   con recursión, V8 lanzará **`RangeError: Maximum call stack size exceeded`**.
 * - **Importante sobre *Tail Call Optimization (TCO)* en JavaScript**: Aunque el
 *   estándar ES6 especificó *Proper Tail Calls*, los motores principales como
 *   **V8 (Node.js / Chrome) y SpiderMonkey NO lo implementan** para no alterar
 *   los Stack Traces de depuración.
 * - Por tanto, un desarrollador Senior usa:
 *   1) **Bucles iterativos (o Pila explícita en el Heap)** para secuencias lineales
 *      largas o grafos muy profundos.
 *   2) **Recursión** para estructuras naturalmente arbóreas de profundidad
 *      acotada (árboles DOM/JSON, menús anidados, sistemas de archivos, clonación
 *      profunda, algoritmos *Divide y Vencerás*).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Árboles Organizacionales y Categorías de E-Commerce: Calcular presupuestos
 *   acumulados de departamentos y sub-departamentos o buscar un nodo por su ID.
 * - Manipulación de Objetos JSON Profundos: `deepFreeze`, `deepClone`,
 *   `deepMerge` o redactores de campos sensibles en logs.
 * - Generadores Recursivos (`yield*`): Recorrer un árbol completo de forma
 *   perezosa usando `yield* recorrerHijos(nodo)`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Estructura con Caso Base (Guard Clause) + Paso Recursivo:
 * function potenciaRapida(base, exponente) {
 *     if (exponente < 0) throw new RangeError('Exponente negativo no soportado');
 *     if (exponente === 0) return 1; // Caso base
 *     if (exponente % 2 === 0) {
 *         const mitad = potenciaRapida(base, exponente / 2);
 *         return mitad * mitad; // O(log n) en vez de O(n)!
 *     }
 *     return base * potenciaRapida(base, exponente - 1);
 * }
 *
 * // 2. Generador recursivo con delegación yield* para recorrer un árbol:
 * function* recorrerNombresArbol(nodo) {
 *     yield nodo.nombre;
 *     for (const hijo of nodo.hijos ?? []) {
 *         yield* recorrerNombresArbol(hijo);
 *     }
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Calcular la nómina total consolidada de una dirección corporativa
 * sumando recursivamente el salario de cada líder y el de todos sus equipos y
 * sub-equipos subordinados.
 *
 * function calcularNominaTotalArbol(nodoEmpleado) {
 *     let total = nodoEmpleado.salario;
 *     for (const subordinado of nodoEmpleado.equipo ?? []) {
 *         total += calcularNominaTotalArbol(subordinado);
 *     }
 *     return total;
 * }
 *
 * const organigrama = {
 *     nombre: 'Directora Tecnología',
 *     salario: 8000,
 *     equipo: [
 *         {
 *             nombre: 'Líder Backend',
 *             salario: 5500,
 *             equipo: [
 *                 { nombre: 'Dev Senior', salario: 4500 },
 *                 { nombre: 'Dev Mid', salario: 3000 },
 *             ],
 *         },
 *         { nombre: 'Líder QA', salario: 5000 },
 *     ],
 * };
 *
 * console.log('Nómina consolidada: $' + calcularNominaTotalArbol(organigrama));
 * // Salida esperada:
 * // Nómina consolidada: $26000
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - COMPLEJIDAD EXPONENCIAL $O(2^n)$ SIN MEMOIZACIÓN: Si una función recursiva
 *   resuelve los mismos subproblemas una y otra vez (como Fibonacci ingenuo o
 *   cálculo de rutas en una cuadrícula), envuélvela siempre con un `Map` de
 *   memoización (`memo = new Map()`) para bajarla a $O(n)$.
 * - AÑADE UN LÍMITE DE PROFUNDIDAD (`profundidadMaxima`) AL PROCESAR JSON EXTERNO:
 *   Evita que un objeto malicioso o con referencias circulares agote el Call Stack.
 * - CUÁNDO USAR PILA EXPLÍCITA EN LUGAR DEL CALL STACK: Si un árbol puede tener
 *   más de 5,000 niveles de profundidad, usa un arreglo `const pila = [raiz]; while (pila.length > 0) { const actual = pila.pop(); ... }`
 *   que vive en el Heap (donde caben millones de nodos sin desbordar la pila).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Suma recursiva y Máximo Común Divisor (Euclides): Implementa `sumarDigitos(n)`
 *    y `mcd(a, b)` usando recursión con validación de entradas.
 * 2. Búsqueda de clave en objeto anidado: Implementa `buscarValorPorClave(objeto, claveBuscada)`
 *    que encuentre el primer valor asociado a `claveBuscada` sin importar en qué
 *    nivel de anidamiento esté.
 * 3. Aplanador recursivo de arreglos (`aplanar(arr)`): Convierte `[1, [2, [3, 4]], 5]`
 *    en `[1, 2, 3, 4, 5]` usando recursión pura para entender cómo funciona
 *    internamente `Array.prototype.flat(Infinity)`.
 *
 * [Intermedio]
 * 4. Fibonacci y Conteo de Formas de Subir Escaleras con Memoización (`Map`):
 *    Implementa `fibonacciMemo(n, memo = new Map())` usando `BigInt` para
 *    calcular instantáneamente `fibonacciMemo(100n)`.
 * 5. Ruta de navegación (*Breadcrumbs*) en árbol de categorías: Dado un árbol
 *    de categorías con `{ id, nombre, subcategorias }`, devuelve el arreglo de
 *    nombres desde la raíz hasta el `id` buscado (ej. `['Hogar', 'Cocina', 'Cafeteras']`).
 * 6. Fusión profunda de objetos de configuración (`deepMerge(base, cambios)`):
 *    Combina recursivamente dos objetos anidados sin mutar ninguno de los dos.
 * 7. Generador recursivo con `yield*`: Usa una `function*` con `yield*` para
 *    listar todos los archivos de un árbol virtual de carpetas y archivos.
 *
 * [Senior / Producción]
 * 8. Reconstrucción de Árbol Jerárquico desde Lista Plana ($O(n)$ + Recursión):
 *    Dada una lista plana de comentarios `[{ id: 1, padreId: null, texto: '...' }, ...]`,
 *    conviértela en un árbol anidado con `respuestas: [...]`.
 * 9. Transformación de Recursión a Iteración con Pila en el Heap (DFS Iterativo):
 *    Reescribe `calcularNominaTotalArbol` usando una pila explícita (`const pila = [raiz]`)
 *    y un bucle `while` sin ninguna llamada recursiva, demostrando que soporta
 *    una cadena de 20,000 niveles sin lanzar `RangeError`.
 * 10. Evaluador de Árbol de Expresiones Sintácticas (AST): Modela e implementa
 *     un evaluador recursivo para un AST matemático y lógico representado como
 *     nodos `{ tipo: 'BINARIO', op: '+'|'*'|'>', izq: ..., der: ... }` y
 *     `{ tipo: 'LITERAL', valor: 10 }`.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
