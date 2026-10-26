# Ruta Completa de Ingeniería en TypeScript (TS 5.x estricto / Node.js - Nivel Básico a Senior)

Empieza por la [introducción a TypeScript](./INTRODUCCION.md) y sigue la [guía de instalación paso a paso](./INSTALACION.md).

## Cómo estudiar esta ruta

Estudia los archivos `01` a `30` en orden. Todos asumen **TypeScript 5.x con `strict: true`**, destino **ES2022** y **Node.js LTS** con `@types/node`. Se trabajan los conceptos que distinguen a TypeScript de JavaScript: tipado estructural, borrado de tipos (*type erasure*), inferencia y *narrowing*, `unknown` vs `any` vs `never`, tipos literales, `as const`, `satisfies`, uniones discriminadas con comprobación exhaustiva, genéricos, *utility types*, tipos mapeados/condicionales, *branded types* y clases con `private`/`#`/`abstract`. Los ejemplos solo usan la biblioteca estándar de Node.

Compila y ejecuta desde la raíz del repositorio (ver la guía de instalación para crear el `tsconfig.json`):

```powershell
npx tsc -p .
node typescript\dist\01_variables_tipos.js
```

En Node.js 22.6+ también puedes ejecutar un archivo directamente, sin compilar, con `node --experimental-strip-types typescript\01_variables_tipos.ts` (en Node 23.6+ ya no hace falta la bandera). Esta vía solo elimina los tipos: **no los verifica** (para eso ejecuta `npx tsc --noEmit`) y no admite sintaxis que genera código, como `enum`, `namespace` o propiedades de parámetro en constructores (requieren `--experimental-transform-types`).

Cada archivo contiene **6 secciones pedagógicas** (Modelo mental del compilador y del runtime, Casos de uso reales, Sintaxis y referencia rápida, Ejemplo práctico con salida esperada, Buenas prácticas / Gotchas y **10 ejercicios progresivos** divididos en `[Básico]`, `[Intermedio]` y `[Senior / Producción]`). Cada archivo termina con `export {};` para que sea un módulo independiente y los nombres de distintos temas no colisionen; escribe tus soluciones debajo, en la zona de trabajo.

## Plan de Estudios (30 Temas)

### Fase 1: Fundamentos y Control de Flujo
1. `01_variables_tipos.ts` - Anotaciones e inferencia, primitivos, `unknown` vs `any` vs `never`, tipos literales y borrado de tipos
2. `02_constantes_readonly.ts` - `const` vs `readonly`, `ReadonlyArray`, `as const`, `Readonly<T>` e inmutabilidad superficial vs profunda
3. `03_entrada_salida.ts` - Consola y `process.stdout`/`stderr`, `node:readline/promises`, `Intl` y plantillas tipadas
4. `04_conversion_validacion.ts` - Coerción de JS en runtime, *type guards*, predicados `x is T`, funciones `asserts` y validación de `unknown`
5. `05_operadores_aritmeticos.ts` - IEEE 754, `bigint` vs `number`, centavos enteros y *branded types* para dinero
6. `06_asignacion_unarios.ts` - Asignación compuesta y lógica (`??=`, `||=`, `&&=`) con *narrowing*, unarios y aserción no nula `!`
7. `07_comparacion_logicos.ts` - `===`, `Object.is`, *narrowing* por igualdad y cortocircuito tipado
8. `08_bitwise_ternario_precedencia.ts` - Máscaras de bits, enums vs uniones de literales, ternarios, tipos condicionales, `?.` y `??`
9. `09_condicionales.ts` - *Guard clauses*, uniones discriminadas, `switch` exhaustivo con `never` y tablas de despacho con `Record`
10. `10_bucles.ts` - `for...of` vs `for...in`, iterables e iteradores tipados, generadores (`Generator<T>`) y `noUncheckedIndexedAccess`

### Fase 2: Estructuras, Funciones y Sistema
11. `11_cadenas.ts` - Strings UTF-16, *template literal types*, normalización Unicode e `Intl.Segmenter`
12. `12_arreglos_tuplas.ts` - Arreglos tipados, tuplas (con nombre, opcionales, *rest*), métodos inmutables y `readonly`
13. `13_colecciones.ts` - `Map`/`Set` genéricos, `Record`, `WeakMap`, índices tipados y `Object.groupBy`
14. `14_funciones.ts` - Tipos de función, sobrecargas, genéricos, parámetros opcionales y `this` tipado
15. `15_ambito_variables.ts` - Alcance léxico, closures tipados, *shadowing* y módulos como ámbito
16. `16_recursion.ts` - Recursión con tipos recursivos (árboles, JSON), generadores recursivos y alternativas iterativas
17. `17_excepciones.ts` - `unknown` en `catch`, errores propios, `{ cause }` y el patrón `Result<T, E>`
18. `18_archivos.ts` - `node:fs/promises`, `node:path`, streams, escritura atómica y validación del contenido leído
19. `19_modulos.ts` - ESM vs CommonJS, `import type`, `moduleResolution`, `tsconfig` y declaraciones `.d.ts`

### Fase 3: POO, Calidad y Algoritmia Clásica
20. `20_programacion_objetos.ts` - Clases, modificadores de acceso vs `#privado`, propiedades de parámetro, `readonly` e interfaces
21. `21_herencia_polimorfismo.ts` - `extends`, `abstract`, `implements`, `override`, tipado estructural y composición
22. `22_pruebas_depurar.ts` - `node:test` y `node:assert/strict`, pruebas de tipos, dobles de prueba y *source maps*
23. `23_algoritmos_busqueda_ordenamiento.ts` - Búsqueda binaria genérica, comparadores tipados, ordenamiento estable e `Intl.Collator`
24. `24_estructuras_datos.ts` - Pila, cola, *heap*, lista enlazada y árbol genéricos

### Fase 4: Ingeniería de Software Avanzada (Nivel Senior)
25. `25_programacion_funcional.ts` - Funciones puras, `pipe`/`compose` tipados, *currying*, `readonly` e inmutabilidad
26. `26_asincronia_concurrencia.ts` - Event Loop, `Promise<T>`, `Awaited`, `Promise.allSettled`, `AbortController` y limitadores de concurrencia
27. `27_regex_fechas_json.ts` - Regex Unicode, fechas ISO 8601/UTC, `JSON.parse` como `unknown` y validación tipada con *type guards*
28. `28_complejidad_optimizacion.ts` - Big-O, `performance.now()`, *hidden classes* de V8 y caché LRU genérica
29. `29_clean_code_solid_patrones.ts` - Clean Code, SOLID con interfaces y patrones de diseño tipados
30. `30_seguridad_arquitectura_proyecto.ts` - Seguridad OWASP con `node:crypto`, *branded types* para datos validados, arquitectura hexagonal y **Proyecto Integrador Final**
