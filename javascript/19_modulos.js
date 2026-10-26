'use strict';

/*
 * ============================================================================
 * TEMA 19: MÓDULOS (ESM VS COMMONJS), ENCAPSULACIÓN Y ARQUITECTURA DE PAQUETES
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Módulos en JavaScript)
 * ----------------------------------------------------------------------------
 * Un módulo es un archivo con su propio alcance privado: nada de lo que declares
 * adentro es visible en el exterior a menos que lo exportes explícitamente.
 *
 * En el ecosistema JavaScript / Node.js coexisten dos sistemas de módulos que
 * todo ingeniero Senior debe comprender a fondo:
 *
 * 1) **ES Modules (ESM — `import` / `export`, el Estándar Oficial ECMAScript)**:
 *    - Se activa en Node.js con `"type": "module"` en `package.json` o usando la
 *      extensión `.mjs`.
 *    - Es **estático** (se analiza antes de ejecutar el código), lo que permite
 *      a herramientas como Vite, Webpack, Rollup o esbuild hacer **Tree-Shaking**
 *      (eliminar del bundle final las funciones exportadas que nadie importó).
 *    - Las exportaciones son **Live Bindings** (enlaces vivos de solo lectura).
 *    - Está en modo estricto (`'use strict'`) automáticamente y soporta
 *      *Top-Level `await`* e `import()` dinámico asíncrono.
 * 2) **CommonJS (CJS — `require()` / `module.exports`, Clásico de Node.js)**:
 *    - Es **dinámico y síncrono**: `require('./archivo')` lee, ejecuta y **cachea**
 *      el objeto `module.exports` en `require.cache` la primera vez que se llama.
 *    - Importante: Si diez archivos hacen `require('./db')`, el archivo `db.js`
 *      se ejecuta **una sola vez** y los diez reciben la misma referencia en caché!
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Usar el Prefijo `node:` para Módulos Nativos de Node.js (`require('node:fs')`
 *   o `import fs from 'node:fs'`): Garantiza que Node cargue el módulo interno
 *   oficial y hace imposible un ataque de *Typosquatting* en `node_modules`.
 * - Preferir **Named Exports** (`export function calcularIva()`) sobre Default
 *   Exports: Facilita el autocompletado del IDE, la refactorización automática
 *   y el *Tree-Shaking*.
 * - Carga Diferida (*Lazy Loading*) con `await import('./moduloPesado.mjs')`:
 *   Cargar un generador de PDFs o módulo de reportes solo cuando el usuario lo pide.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ESM y CommonJS)
 * ----------------------------------------------------------------------------
 * // A) Sintaxis ES Modules (Estándar ECMAScript):
 * // export const TASA_IVA = 0.19;
 * // export function sumar(a, b) { return a + b; }
 * // import { TASA_IVA, sumar as adicionar } from './matematica.mjs';
 * // const moduloDinamico = await import('./reportes.mjs');
 *
 * // B) Sintaxis CommonJS (Por defecto en archivos .js sin "type": "module"):
 * const path = require('node:path');
 * const crypto = require('node:crypto');
 *
 * // Exportar una API pública limpia e inmutable en CommonJS:
 * const API_PUBLICA = Object.freeze({
 *     generarId: () => crypto.randomUUID(),
 *     normalizarRuta: (r) => path.normalize(r),
 * });
 * module.exports = API_PUBLICA;
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Simular e implementar un cargador de módulos con caché en memoria
 * (el mismo principio interno que usa `require.cache` en Node.js) para demostrar
 * cómo el módulo se inicializa una sola vez (Singleton de módulo).
 *
 * function crearSistemaDeModulos() {
 *     const cacheModulos = new Map();
 *     const definiciones = new Map();
 *
 *     return {
 *         definir(nombre, fabrica) {
 *             definiciones.set(nombre, fabrica);
 *         },
 *         requerir(nombre) {
 *             if (cacheModulos.has(nombre)) {
 *                 return cacheModulos.get(nombre);
 *             }
 *             const fabrica = definiciones.get(nombre);
 *             if (!fabrica) throw new Error(`Módulo no encontrado: ${nombre}`);
 *             const exportaciones = Object.freeze(fabrica());
 *             cacheModulos.set(nombre, exportaciones);
 *             return exportaciones;
 *         },
 *     };
 * }
 *
 * const cargador = crearSistemaDeModulos();
 * cargador.definir('math', () => ({ sumar: (a, b) => a + b }));
 * const m1 = cargador.requerir('math');
 * const m2 = cargador.requerir('math');
 * console.log(`Resultado: ${m1.sumar(10, 15)} | ¿Misma instancia en caché?: ${m1 === m2}`);
 * // Salida esperada:
 * // Resultado: 25 | ¿Misma instancia en caché?: true
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en Node.js)
 * ----------------------------------------------------------------------------
 * - USA SIEMPRE EL PREFIJO `node:` PARA MÓDULOS INTERNOS (`node:crypto`, `node:fs`,
 *   `node:path`, `node:test`): Es más seguro, explícito y evita ambigüedades con
 *   paquetes de npm.
 * - EVITA LOS ARCHIVOS BARRIL GIGANTES (*Barrel Files* `index.js` que re-exportan
 *   100 módulos): En proyectos grandes degradan el tiempo de arranque porque
 *   importar una sola utilidad desde el `index.js` fuerza a cargar e inicializar
 *   los otros 99 archivos.
 * - CUIDADO CON LAS DEPENDENCIAS CIRCULARES (`A` importa `B` y `B` importa `A`):
 *   En CommonJS uno de los dos recibirá un objeto `{}` vacío incompleto, y en
 *   ESM puede causar un `ReferenceError` de TDZ. Si dos módulos se necesitan
 *   mutuamente, extrae la lógica compartida a un tercer módulo `C`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Importación con prefijo `node:`: Importa `node:os`, `node:path` y `node:url`
 *    y construye una función diagnóstica del entorno de ejecución actual.
 * 2. Patrón Módulo Revelador (*Revealing Module Pattern*): Crea una función
 *    `crearModuloImpuestos()` que mantenga constantes y funciones auxiliares
 *    privadas en su ámbito y devuelva únicamente la interfaz pública congelada.
 * 3. Inspección de `module` y `require.cache`: Muestra en consola las propiedades
 *    de `module.filename`, `module.id` y cuántos módulos hay en `Object.keys(require.cache)`.
 *
 * [Intermedio]
 * 4. Separación de responsabilidades en sub-módulos lógicos: Estructura dentro
 *    de este archivo tres módulos cohesivos (`ValidadorModulo`, `CalculadorModulo`,
 *    `FormateadorModulo`) y un orquestador que los componga sin acoplar sus
 *    detalles internos.
 * 5. Carga dinámica asíncrona con `await import(...)`: Usa `import('node:crypto')`
 *    (que funciona incluso dentro de archivos CommonJS!) para cargar un módulo
 *    de forma asíncrona bajo demanda y generar un UUID.
 * 6. Detección de ejecución directa (`require.main === module`): Demuestra el
 *    patrón estándar para ejecutar un bloque de código solo cuando el archivo se
 *    invoca directamente con `node archivo.js` y no cuando otro archivo lo importa.
 * 7. Resolución de rutas en ESM vs CommonJS: Compara `__dirname` / `__filename`
 *    en CommonJS con cómo se construyen desde una URL de archivo usando `node:url`
 *    (`url.pathToFileURL` y `url.fileURLToPath`).
 *
 * [Senior / Producción]
 * 8. Detector de Dependencias Circulares en un Grafo de Módulos: Dado un mapa de
 *    dependencias `{ modA: ['modB'], modB: ['modC'], modC: ['modA'] }`, implementa
 *    un algoritmo DFS que detecte y reporte el ciclo exacto (`modA -> modB -> modC -> modA`).
 * 9. Sistema de Plugins con Carga Perezosa y Aislamiento: Implementa un
 *    `GestorPlugins` que registre fábricas de plugins por nombre, los inicialice
 *    solo cuando se solicitan por primera vez y valide que cumplan el contrato
 *    esperado (`{ nombre, version, ejecutar }`).
 * 10. Ordenamiento Topológico de Inicialización de Módulos: Dado un grafo acíclico
 *     de módulos donde cada uno declara de qué otros módulos depende, calcula el
 *     orden exacto en que deben inicializarse para que toda dependencia esté
 *     lista antes que quien la consume.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
