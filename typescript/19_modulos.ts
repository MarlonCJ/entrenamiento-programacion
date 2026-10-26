/*
 * ============================================================================
 * TEMA 19: MÓDULOS EN TYPESCRIPT (ESM VS COMMONJS, IMPORT TYPE Y BARRELS)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental: cada archivo es una caja con puerta)
 * ----------------------------------------------------------------------------
 * Un módulo es un archivo con su propio ámbito: lo que no se `export`a es
 * privado. En TypeScript cualquier archivo con un `import` o `export` de nivel
 * superior es un módulo; sin ellos es un "script" global (por eso cada tema
 * del curso termina en `export {}`). Claves de nivel Senior:
 *
 * 1) Escribes ESM, emites lo que diga `tsconfig`: con `"module": "commonjs"`
 *    TS traduce `import { x } from './a'` a `require('./a')`. Con
 *    `"module": "nodenext"` respeta el formato real de Node: `"type":
 *    "module"` en `package.json` (o extensión `.mts`) es ESM, y entonces los
 *    imports relativos deben llevar extensión `.js` (`'./pedido.js'`, aunque
 *    el archivo fuente sea `.ts`).
 * 2) Exportaciones de valores y de tipos: interfaces y `type` existen solo en
 *    compilación. `import type { Pedido } from './pedido'` garantiza que la
 *    importación se borre del JS emitido (sin efectos secundarios ni ciclos
 *    en runtime). Con `"verbatimModuleSyntax": true`, TS te obliga a marcar
 *    los imports de solo tipo.
 * 3) Barrels (`index.ts` con `export * from './x'`) ofrecen una API pública
 *    corta (`import { crearPedido } from './dominio'`), pero pueden cargar
 *    módulos innecesarios y crear dependencias circulares.
 * 4) Interop CommonJS: `export =` / `import x = require('x')` para librerías
 *    antiguas; `esModuleInterop` permite `import express from 'express'`.
 * 5) Importación dinámica `await import('node:zlib')` carga bajo demanda y
 *    está tipada; `typeof import('node:zlib')` describe el tipo del módulo.
 * 6) Declaraciones: `declare module 'lib-sin-tipos'` y los paquetes
 *    `@types/*` dan tipos a código JavaScript sin tipar.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Arquitectura por capas o por features (`dominio/`, `infraestructura/`,
 *   `http/`) donde cada carpeta expone solo su API pública.
 * - Librerías npm que publican ESM + CJS y archivos `.d.ts` (`exports` en
 *   `package.json`).
 * - Carga perezosa de dependencias pesadas (generadores de PDF, SDKs) para
 *   reducir el tiempo de arranque de una función serverless.
 * - Estado de módulo controlado: registros, cachés y configuración que solo
 *   se modifican a través de funciones exportadas.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // src/dominio/pedido.ts
 * export interface Pedido { readonly id: string; readonly total: number; }
 * export const IVA = 0.19;
 * export function crearPedido(id: string, subtotal: number): Pedido {
 *     return { id, total: subtotal * (1 + IVA) };
 * }
 * export default class ServicioPedidos { }    // evita `default`: dificulta refactors
 *
 * // src/dominio/index.ts  (barrel: API pública de la carpeta)
 * export { crearPedido, IVA } from './pedido';
 * export type { Pedido } from './pedido';     // reexporta solo el tipo
 *
 * // src/app.ts
 * import { crearPedido } from './dominio';
 * import type { Pedido } from './dominio';    // se borra al compilar
 * import * as path from 'node:path';          // espacio de nombres completo
 * import { readFile as leer } from 'node:fs/promises';   // renombrar
 *
 * // Con "module": "nodenext" + "type": "module":
 * import { crearPedido } from './dominio/index.js';    // extensión obligatoria
 *
 * // Interop CommonJS
 * import fs = require('node:fs');             // estilo `export =`
 * type ModuloZlib = typeof import('node:zlib');
 * const zlib = await import('node:zlib');     // carga dinámica tipada
 *
 * // tipos para una librería JS sin tipos (archivo tipos/lib.d.ts)
 * declare module 'calculadora-legacy' { export function sumar(a: number, b: number): number; }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un módulo de feature flags para un SaaS. El registro es estado
 * privado del módulo (no se exporta); solo `definirFlag` y `estaActivo` forman
 * la API pública. Usa `import type` para un tipo de `node:crypto`, reparte a
 * los usuarios en cubetas deterministas con SHA-256 y carga `node:zlib` bajo
 * demanda con una importación dinámica tipada.
 *
 * import type { Hash } from 'node:crypto';    // solo tipo: desaparece del JS
 * import { createHash } from 'node:crypto';
 *
 * type Entorno = 'dev' | 'prod';
 * export interface Flag {
 *     readonly nombre: string;
 *     readonly porcentaje: number;              // 0–100 % de usuarios
 *     readonly entornos: readonly Entorno[];
 * }
 *
 * const registro = new Map<string, Flag>();    // privado: no se exporta
 *
 * function cubeta(usuarioId: string, flag: string): number {
 *     const hash: Hash = createHash('sha256');
 *     const hex = hash.update(`${flag}:${usuarioId}`).digest('hex');
 *     return Number.parseInt(hex.slice(0, 8), 16) % 100;
 * }
 *
 * export function definirFlag(flag: Flag): void {
 *     if (flag.porcentaje < 0 || flag.porcentaje > 100) throw new RangeError(flag.nombre);
 *     registro.set(flag.nombre, flag);
 * }
 *
 * export function estaActivo(nombre: string, usuarioId: string, entorno: Entorno): boolean {
 *     const flag = registro.get(nombre);
 *     if (flag === undefined || !flag.entornos.includes(entorno)) return false;
 *     return cubeta(usuarioId, nombre) < flag.porcentaje;
 * }
 *
 * type ModuloZlib = typeof import('node:zlib');
 * let zlib: ModuloZlib | undefined;             // caché del módulo perezoso
 *
 * async function comprimirIdaYVuelta(texto: string): Promise<boolean> {
 *     zlib ??= await import('node:zlib');      // solo se carga la primera vez
 *     return zlib.gunzipSync(zlib.gzipSync(texto)).toString('utf8') === texto;
 * }
 *
 * definirFlag({ nombre: 'checkout-nuevo', porcentaje: 30, entornos: ['dev', 'prod'] });
 * definirFlag({ nombre: 'modo-oscuro', porcentaje: 100, entornos: ['dev'] });
 *
 * for (const u of ['u-101', 'u-102', 'u-103', 'u-104']) {
 *     const activo = estaActivo('checkout-nuevo', u, 'prod');
 *     console.log(`${u} (cubeta ${cubeta(u, 'checkout-nuevo')}) checkout-nuevo: ${activo}`);
 * }
 * console.log(`modo-oscuro en prod: ${estaActivo('modo-oscuro', 'u-101', 'prod')}`);
 * console.log(`flag inexistente: ${estaActivo('beta-ia', 'u-101', 'dev')}`);
 * comprimirIdaYVuelta('Configuración de flags ñandú').then((ok) => console.log(`zlib perezoso: ${ok}`));
 *
 * // Salida esperada:
 * // u-101 (cubeta 16) checkout-nuevo: true
 * // u-102 (cubeta 38) checkout-nuevo: false
 * // u-103 (cubeta 34) checkout-nuevo: false
 * // u-104 (cubeta 1) checkout-nuevo: true
 * // modo-oscuro en prod: false
 * // flag inexistente: false
 * // zlib perezoso: true
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas)
 * ----------------------------------------------------------------------------
 * - PREFIERE EXPORTACIONES NOMBRADAS: `export default` permite importar con
 *   cualquier nombre y dificulta búsquedas y refactors automáticos.
 * - USA `import type` PARA TIPOS: evita cargar módulos en runtime solo por un
 *   tipo y rompe ciclos de dependencias. Activa `verbatimModuleSyntax`.
 * - CUIDADO CON LOS BARRELS GIGANTES: un `index.ts` que reexporta todo hace
 *   que importar una función cargue la carpeta entera y facilita los ciclos
 *   (`A → index → B → index → A`), que en runtime dan `undefined`.
 * - CON `nodenext` ESCRIBE LA EXTENSIÓN `.js`: `import './util'` falla en
 *   Node ESM aunque TS lo acepte con `moduleResolution: node10`.
 * - NO MEZCLES `require` E `import` EN EL MISMO ARCHIVO sin motivo: elige un
 *   sistema por proyecto (ESM en proyectos nuevos).
 * - EL ESTADO DE MÓDULO ES UN SINGLETON: se evalúa una sola vez y se comparte
 *   en todo el proceso. Útil para registros; peligroso para datos por usuario.
 * - EVITA EFECTOS SECUNDARIOS AL IMPORTAR: un módulo que conecta a la BD al
 *   cargarse complica las pruebas. Exporta funciones `iniciar()` explícitas.
 * - NO ABUSES DE `declare module` CON `any`: escribe al menos las firmas que
 *   usas de la librería.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Primer módulo: crea `utilidades/moneda.ts` con `formatearCop(monto:
 *    number): string` exportada y úsala desde otro archivo con import nombrado.
 * 2. Privado vs público: en un módulo `contador.ts` deja la variable interna
 *    sin exportar y expón `incrementar()` y `valor()`; comprueba que no puedes
 *    importar la variable.
 * 3. `import type`: separa `tipos.ts` (interfaces `Cliente`, `Factura`) y
 *    úsalas con `import type`; inspecciona el `.js` emitido para ver que
 *    desaparece la importación.
 *
 * [Intermedio]
 * 4. Barrel controlado: organiza `dominio/` (`cliente.ts`, `factura.ts`,
 *    `index.ts`) exponiendo solo la API pública con reexportaciones nombradas.
 * 5. Configuración ESM: crea un mini proyecto con `"type": "module"` y
 *    `"module": "nodenext"`; reproduce el error por omitir `.js` y corrígelo.
 * 6. Carga perezosa: `generarReporte(formato: 'csv' | 'json')` que importe
 *    dinámicamente el módulo del formato elegido, tipado con `typeof import`.
 * 7. Tipos para JS legado: escribe un `.d.ts` con `declare module` para una
 *    librería JavaScript ficticia `'impuestos-legacy'` y úsala sin `any`.
 *
 * [Senior / Producción]
 * 8. Detecta y rompe un ciclo: crea dos módulos que se importen mutuamente,
 *    observa el `undefined` en runtime y resuélvelo con `import type` o
 *    extrayendo un tercer módulo.
 * 9. Contenedor de dependencias: un módulo `contenedor.ts` que registre
 *    fábricas tipadas (`registrar<K extends keyof Servicios>(clave: K,
 *    fabrica: () => Servicios[K])`) y resuelva instancias perezosamente.
 * 10. Librería dual: configura `package.json` (`exports`, `types`) y dos
 *     `tsconfig` para publicar un paquete en ESM y CommonJS con sus `.d.ts`.
 */

// Zona de trabajo: escribe aquí tus soluciones para los 10 retos.

export {}; // Convierte el archivo en módulo para evitar choques de nombres entre temas.
