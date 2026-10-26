# Ruta Completa de Ingeniería en JavaScript Moderno (ES2024+ / Node.js — Nivel Básico a Senior)

Empieza por la [introducción a JavaScript](./INTRODUCCION.md) y sigue la [guía de instalación paso a paso](./INSTALACION.md).

## Cómo estudiar esta ruta

Estudia los archivos `01` a `30` en orden. Todos los archivos utilizan `'use strict';` y las prácticas modernas de **ECMAScript (ES2022–ES2024+)** y **Node.js** (`const`/`let`, `Object.freeze`, `Intl`, métodos inmutables `.toSorted()`/`.with()`, `Map`/`Set`/`WeakMap`, clases con campos privados `#`, `Error.cause`, `Promise.allSettled`, `node:assert/strict` y `node:crypto`).

Puedes ejecutar cualquier archivo directamente con Node.js desde la terminal:

```bash
node javascript/01_variables.js
```

Cada archivo contiene **6 secciones pedagógicas** (Modelo mental en el motor V8, Casos de uso reales, Sintaxis rápida de ECMAScript moderno, Ejemplo práctico con salida esperada, Buenas prácticas / Gotchas y **10 ejercicios progresivos** divididos en `[Básico]`, `[Intermedio]` y `[Senior / Producción]`).

## Plan de Estudios (30 Temas)

### Fase 1: Fundamentos y Control de Flujo
1. `01_variables.js` — `const` vs `let`, *Temporal Dead Zone (TDZ)*, los 7 tipos primitivos (`BigInt`, `Symbol`) vs referencias en el Heap y `structuredClone`
2. `02_constantes.js` — Constantes, inmutabilidad de enlace vs objeto, `Object.freeze()` y `deepFreeze()`
3. `03_entrada_salida.js` — Consola avanzada, `stdout`/`stderr`, formateo internacional con `Intl.NumberFormat` y *Tagged Templates*
4. `04_conversion_validacion.js` — Reglas de coerción implícita, los 8 valores *Falsy*, `Number.isNaN()`, `Number.isFinite()` y validación defensiva
5. `05_operadores_aritmeticos.js` — Punto flotante IEEE 754, `Math.trunc()` vs `Math.floor()`, `Number.EPSILON` y contabilidad en centavos
6. `06_asignacion_unarios.js` — Asignación compuesta y operadores de asignación lógica con cortocircuito (`??=`, `||=`, `&&=`)
7. `07_comparacion_logicos.js` — Igualdad estricta (`===`), `Object.is()`, cortocircuito en `&&`/`||` y `localeCompare`
8. `08_bitwise_ternario_precedencia.js` — *Optional Chaining* (`?.`, `?.[]`, `?.()`), coalescencia nula (`??` vs `||`) y máscaras de bits de 32 bits
9. `09_condicionales.js` — *Guard Clauses*, ámbito de bloque en `switch` y tablas de despacho (*Lookup Tables*)
10. `10_bucles.js` — Protocolo Iterable (`for...of` vs peligro de `for...in`), `Object.entries()` y Funciones Generadoras (`function*` / `yield`)

### Fase 2: Estructuras de Datos, Funciones y Modularidad
11. `11_cadenas.js` — Strings inmutables UTF-16, normalización Unicode (`NFC`/`NFD`), `.at(-1)`, `replaceAll()` e `Intl.Segmenter`
12. `12_arreglos.js` — *Packed* vs *Holey Arrays* en V8, métodos inmutables ES2023+ (`toSorted`, `toReversed`, `toSpliced`, `with`) y `Array.from`
13. `13_colecciones.js` — `Map` ($O(1)$), `Set` ($O(1)$), `WeakMap`/`WeakSet`, `Object.hasOwn()` y `Object.groupBy()`
14. `14_funciones.js` — Ciudadanos de primera clase, Arrow Functions vs `function`, enlace de `this` y patrón *Options Object* desestructurado
15. `15_ambito_variables.js` — Alcance léxico, Closures en el Heap de V8, *Shadowing*, `once` y `memoize`
16. `16_recursion.js` — *Call Stack*, ausencia de TCO en V8, árboles jerárquicos, generadores recursivos (`yield*`) y DFS iterativo
17. `17_excepciones.js` — Jerarquía de `Error`, encadenamiento nativo con `{ cause }` (ES2022+), `AggregateError` y serialización de errores
18. `18_archivos.js` — `node:fs/promises`, streaming en memoria $O(1)$ con `readline` + `for await...of`, escritura atómica y *Path Traversal*
19. `19_modulos.js` — ES Modules (`import`/`export`) vs CommonJS (`require`), prefijo `node:`, *Tree-Shaking* y caché de módulos

### Fase 3: POO, Calidad y Algoritmia Clásica
20. `20_programacion_objetos.js` — Clases ES2022+, campos y métodos privados reales (`#`), *Static Factory Methods*, `toJSON()` e invariantes
21. `21_herencia_polimorfismo.js` — Cadena de prototipos, `extends`/`super()`, clases abstractas con `new.target`, *Duck Typing* y composición
22. `22_pruebas_depurar.js` — Pruebas automatizadas con `node:assert/strict` (`equal`, `deepEqual`, `throws`, `rejects`), patrón AAA y *Spies*
23. `23_algoritmos_busqueda_ordenamiento.js` — Búsqueda binaria $O(\log n)$, TimSort estable en V8, contrato de comparadores e `Intl.Collator`
24. `24_estructuras_datos.js` — Pilas LIFO, Colas FIFO en $O(1)$ real (evitando la lentitud $O(n)$ de `.shift()`), *Undo/Redo* y *Min-Heap*

### Fase 4: Ingeniería de Software Avanzada (Nivel Senior)
25. `25_programacion_funcional.js` — Funciones puras, `.map`/`.filter`/`.flatMap`/`.reduce`, `pipe`/`compose`, *Currying* e inmutabilidad
26. `26_asincronia_concurrencia.js` — Event Loop (Microtasks vs Macrotasks), `Promise.all`/`allSettled`/`race`/`any`, `AbortController` y limitadores de concurrencia
27. `27_regex_fechas_json.js` — Regex Unicode (`/u`, `matchAll`, trampa de `lastIndex` con `/g`), fechas ISO-8601/UTC y `JSON.stringify` (`replacer`/`reviver`)
28. `28_complejidad_optimizacion.js` — Complejidad Big-O, perfilado con `performance.now()`, *In-Memory Hash Join*, *Hidden Classes* y caché LRU en $O(1)$
29. `29_clean_code_solid_patrones.js` — Clean Code, Principios SOLID y Patrones de Diseño (*Strategy*, *Factory*, *Decorator*, *Observer/EventEmitter*, *Proxy*, *Circuit Breaker*)
30. `30_seguridad_arquitectura_proyecto.js` — Seguridad OWASP (`node:crypto`, `scryptSync`, `timingSafeEqual`, defensa contra *Prototype Pollution*), Arquitectura en Capas y **Proyecto Integrador Final**
