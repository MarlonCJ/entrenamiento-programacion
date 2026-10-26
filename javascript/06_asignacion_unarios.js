'use strict';

/*
 * ============================================================================
 * TEMA 06: ASIGNACIÓN COMPUESTA, ASIGNACIÓN LÓGICA (??=, ||=, &&=) Y UNARIOS
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en ES2021+)
 * ----------------------------------------------------------------------------
 * Además de los operadores de asignación compuesta clásicos (`+=`, `-=`, `*=`,
 * `/=`, `%=`, `**=`), ECMAScript 2021 introdujo los tres **Operadores de
 * Asignación Lógica** (`??=`, `||=`, `&&=`), los cuales incluyen **cortocircuito**
 * (solo evalúan y asignan el lado derecho si es estrictamente necesario):
 *
 * 1) **Asignación de Coalescencia Nula (`x ??= valorPorDefecto`)**:
 *    Asigna `valorPorDefecto` a `x` **únicamente si `x` es `null` o `undefined`**.
 *    Si `x` vale `0`, `false` o `""`, ¡NO lo sobrescribe! Es el estándar de oro
 *    para inicializar opciones por defecto y cachés en memoria.
 * 2) **Asignación OR Lógica (`x ||= valorPorDefecto`)**:
 *    Asigna `valorPorDefecto` si `x` es cualquier valor **falsy** (`0`, `""`,
 *    `false`, `null`, `undefined`, `NaN`). Útil cuando una cadena vacía `""`
 *    también debe reemplazarse por un texto por defecto.
 * 3) **Asignación AND Lógica (`x &&= nuevoValor`)**:
 *    Reemplaza `x` por `nuevoValor` **únicamente si `x` es truthy**. Útil para
 *    sanitizar o transformar un campo solo cuando está presente
 *    (`usuario.email &&= usuario.email.trim().toLowerCase()`).
 * 4) **Operadores Unarios (`++`, `--`, `+`, `-`, `!`, `typeof`, `delete`)**:
 *    Transforman o inspeccionan un único operando.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Agrupación y Conteo en una Sola Línea (`??=`):
 *   `(grupos[categoria] ??= []).push(producto);` (Si el arreglo para esa
 *   categoría no existe, lo crea como `[]` y luego hace `.push()`!).
 * - Limpieza Condicional de Propiedades (`&&=`):
 *   `filtro.busqueda &&= filtro.busqueda.trim();`
 * - Acumuladores de Métricas y Estado (`+=`, `-=`, `++`).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Diferencia crítica entre ??= y ||= :
 * const config = { reintentos: 0, titulo: '', timeout: null };
 * config.reintentos ??= 3;            // Se queda en 0 (porque 0 no es null/undefined)
 * config.titulo     ||= 'Sin título'; // Pasa a 'Sin título' (porque '' es falsy)
 * config.timeout    ??= 5000;         // Pasa a 5000 (porque era null)
 *
 * // 2. Inicialización perezosa de arreglos en un diccionario con ??= :
 * const porCiudad = {};
 * (porCiudad['Bogotá'] ??= []).push('Ana'); // { Bogotá: ['Ana'] }
 *
 * // 3. Pre-incremento (++i) vs Post-incremento (i++):
 * let secuencia = 10;
 * const actual = secuencia++; // actual = 10, secuencia = 11
 * const siguiente = ++secuencia; // siguiente = 12, secuencia = 12
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un agrupador de transacciones organiza los movimientos por moneda
 * inicializando cada cubeta al vuelo con `??=` y limpiando las descripciones no
 * vacías con `&&=`.
 *
 * const movimientos = [
 *     { moneda: 'USD', monto: 100, nota: '  Pago licencia  ' },
 *     { moneda: 'COP', monto: 50000, nota: '' },
 *     { moneda: 'USD', monto: 250, nota: '  Renovación ' },
 * ];
 *
 * const agrupados = {};
 * for (const mov of movimientos) {
 *     mov.nota &&= mov.nota.trim();
 *     const cubeta = (agrupados[mov.moneda] ??= { total: 0, cantidad: 0 });
 *     cubeta.total += mov.monto;
 *     cubeta.cantidad++;
 * }
 *
 * console.log(JSON.stringify(agrupados));
 * // Salida esperada:
 * // {"USD":{"total":350,"cantidad":2},"COP":{"total":50000,"cantidad":1}}
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - EL CORTOCIRCUITO EN `??=` NO INVOCA EL GETTER NI EL SETTER SI YA TIENE VALOR:
 *   `obj.prop ??= calcularValorCostoso()` NO es idéntico a
 *   `obj.prop = obj.prop ?? calcularValorCostoso()`. Con `??=`, si `obj.prop` ya
 *   tiene un valor no nulo, ni siquiera se ejecuta la asignación (`set`) ni se
 *   evalúa `calcularValorCostoso()`!
 * - EVITA USAR EL UNARIO `+valor` PARA CONVERTIR STRINGS A NÚMEROS EN PRODUCCIÓN:
 *   Aunque `+"42"` devuelve `42`, es poco legible, convierte `""` y `false` en `0`,
 *   y lanza `TypeError` si el valor es un `BigInt` (`+10n` lanza `TypeError`!).
 *   Prefiere `Number(valor)` o funciones de validación explícitas.
 * - EVITA `delete obj.prop` EN OBJETOS CALIENTES (*Hot Loops* en V8):
 *   Usar `delete` cambia la "Clase Oculta" (*Hidden Class / Shape*) del objeto
 *   en el motor V8, desoptimizando el acceso a sus propiedades. Si necesitas un
 *   diccionario donde se agregan y borran claves constantemente, usa un `Map`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Simulador de billetera con asignación compuesta: Inicia un saldo en
 *    centavos, aplica abonos con `+=`, cargos con `-=`, bonificación con `*=` y
 *    muestra la evolución paso a paso.
 * 2. Trazabilidad de `++i` vs `i++`: Crea un generador de folios y demuestra con
 *    asignaciones qué valor recibe una variable con post-incremento frente a
 *    pre-incremento.
 * 3. Comparación entre `??=`, `||=` y `&&=`: Crea un objeto `{ stock: 0, nombre: '', email: '  ANA@TEST.COM  ', descuento: null }`
 *    y aplica el operador de asignación lógica adecuado a cada propiedad.
 *
 * [Intermedio]
 * 4. Agrupador en una línea con `??=`: Dada una lista de empleados con
 *    `{ nombre, departamento }`, agrúpalos en un objeto `{ [depto]: [nombres...] }`
 *    usando `(mapa[emp.departamento] ??= []).push(emp.nombre)`.
 * 5. Contador de frecuencias con `??=`: Cuenta cuántas veces aparece cada palabra
 *    en un arreglo usando `conteo[palabra] = (conteo[palabra] ?? 0) + 1` o `??=`.
 * 6. Demostración del cortocircuito en `??=`: Crea una función `cargarConfigPesada()`
 *    que incremente un contador de llamadas y demuestra que al usar `cache.datos ??= cargarConfigPesada()`
 *    tres veces seguidas, la función solo se ejecuta **1 vez**.
 * 7. Doble negación unaria (`!!valor`) vs `Boolean(valor)`: Muestra cómo actúan
 *    los operadores unarios `!`, `!!` y `-` sobre distintos tipos de datos.
 *
 * [Senior / Producción]
 * 8. Memoización de propiedades en una clase usando `??=`: Crea una clase
 *    `ReporteEstadistico` con una propiedad privada `#resumenCache = null` cuyo
 *    método `obtenerResumen()` use `return this.#resumenCache ??= this.#calcularResumenCostoso();`.
 * 9. Normalizador de Payload de API con `&&=` y `??=`: Procesa un arreglo de
 *    usuarios entrantes aplicando `&&=` para limpiar y pasar a minúsculas los
 *    campos opcionales presentes y `??=` para inyectar el rol `'LECTOR'` y
 *    `activo: true` cuando sean nulos o indefinidos.
 * 10. Acumulador Financiero Multimoneda en una Sola Pasada: Recorre un flujo de
 *     facturas con `{ moneda, subtotal, descuentoPct, pagada }` y construye en
 *     un solo bucle un resumen por moneda con totales pagados, pendientes y
 *     conteos usando asignación lógica y compuesta.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
