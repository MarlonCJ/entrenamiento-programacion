'use strict';

/*
 * ============================================================================
 * TEMA 09: CONDICIONALES, GUARD CLAUSES, SWITCH Y DESPACHO POR DICCIONARIO
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Control de Flujo en JS)
 * ----------------------------------------------------------------------------
 * Tomar decisiones limpias en el código evita la temida "Pirámide de la Muerte"
 * (*Arrow Anti-Pattern*: 5 niveles de `if / else` anidados hacia la derecha).
 *
 * Las 3 Técnicas Profesionales de Decisión en JavaScript:
 * 1) **Cláusulas de Guarda (*Guard Clauses / Early Return*)**:
 *    Validar y cortar temprano los casos inválidos o especiales en las primeras
 *    líneas de la función con `return` o `throw`. El camino exitoso (*Happy Path*)
 *    queda al final, plano y sin necesidad de `else`.
 * 2) **`switch` con Igualdad Estricta (`===`) y Ámbito de Bloque (`case 'A': { ... }`)**:
 *    - A diferencia de PHP, en JavaScript `switch (x)` compara cada `case` usando
 *      **igualdad estricta (`===`)**!
 *    - ¡Gotcha de alcance en `switch`!: Todos los `case` comparten el mismo
 *      bloque del `switch`. Si declaras `const total = ...` en dos `case` distintos
 *      sin envolver cada `case` en llaves `{ ... }`, lanzará `SyntaxError:
 *      Identifier 'total' has already been declared`! Por eso, cuando declares
 *      variables dentro de un `case`, envuélvelo siempre en `{ ... }`.
 * 3) **Tablas de Despacho (*Object / Map Lookup Tables*)**:
 *    En JavaScript, dado que las funciones son ciudadanos de primera clase, a
 *    menudo es más limpio y extensible reemplazar un `switch` largo por un
 *    objeto o `Map` congelado de estrategias (`ACCIONES[tipo]?.(datos)`).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Validación de Reglas de Negocio con *Guard Clauses*: Rechazar peticiones sin
 *   autenticación, sin permisos o sin stock antes de ejecutar lógica pesada.
 * - Reductores de Estado y Máquinas de Estados (`switch` o Tabla de Transiciones).
 * - Despacho de Comandos o Estrategias de Precio por Clave (`Map` / Objeto).
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Guard Clauses (Cero bloques else innecesarios):
 * function calcularReembolso(pedido) {
 *     if (!pedido || pedido.estado !== 'PAGADO') return 0;
 *     if (pedido.diasDesdeCompra > 30) return 0;
 *     if (pedido.abierto) return pedido.total * 0.80;
 *     return pedido.total;
 * }
 *
 * // 2. switch con bloques léxicos { } en cada case:
 * function procesarEvento(evento) {
 *     switch (evento.tipo) {
 *         case 'DEPOSITO': {
 *             const comision = evento.monto * 0.01;
 *             return evento.monto - comision;
 *         }
 *         case 'RETIRO': {
 *             const recargo = 2.5;
 *             return -(evento.monto + recargo);
 *         }
 *         default:
 *             throw new Error(`Evento desconocido: ${evento.tipo}`);
 *     }
 * }
 *
 * // 3. Tabla de despacho en O(1) con Object.freeze (alternativa funcional a switch):
 * const TARIFAS_POR_PLAN = Object.freeze({
 *     BASICO: 9.99,
 *     PRO: 29.99,
 *     EMPRESA: 99.99,
 * });
 * // const precio = TARIFAS_POR_PLAN[plan] ?? 0;
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un calculador de envíos internacionales valida el paquete con
 * Guard Clauses y utiliza una tabla de despacho de funciones para aplicar la
 * fórmula de cada región sin cadenas de `if / else if`.
 *
 * const ESTRATEGIAS_ENVIO = Object.freeze({
 *     LOCAL: (pesoKg) => 5 + pesoKg * 1.5,
 *     AMERICAS: (pesoKg) => 15 + pesoKg * 4.0,
 *     EUROPA: (pesoKg) => 25 + pesoKg * 6.0,
 * });
 *
 * function cotizarEnvio(region, pesoKg) {
 *     if (typeof pesoKg !== 'number' || pesoKg <= 0) {
 *         throw new RangeError('El peso debe ser un número positivo');
 *     }
 *     const calcular = ESTRATEGIAS_ENVIO[region];
 *     if (!calcular) {
 *         throw new Error(`Región no cubierta: ${region}`);
 *     }
 *     return calcular(pesoKg);
 * }
 *
 * console.log('Envío AMERICAS (3kg): $' + cotizarEnvio('AMERICAS', 3));
 * // Salida esperada:
 * // Envío AMERICAS (3kg): $27
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - SI UN `if` TERMINA EN `return` O `throw`, NO ESCRIBAS `else`:
 *   El `else` después de un `return` solo añade ruido visual e indentación inútil.
 * - ENVUELVE LOS `case` DE UN `switch` EN LLAVES `{ ... }` SI DECLARAS `const` O `let`:
 *   Evita colisiones de nombres en el ámbito compartido del `switch`.
 * - NUNCA OLVIDES EL `break` O `return` EN CADA `case` DE UN `switch`:
 *   El *fall-through* accidental (caer al siguiente `case` por olvidar `break`)
 *   es un error clásico; solo agrupa `case 'A': case 'B':` cuando compartan
 *   exactamente la misma lógica.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Clasificación de notas con Guard Clauses: Implementa `calificarNota(nota)`
 *    que primero valide que `nota` esté entre `0` y `100` (lanzando `RangeError`
 *    si no) y retorne `'A'`, `'B'`, `'C'` o `'F'` usando retornos tempranos sin `else`.
 * 2. Agrupación de casos en `switch`: Dado el nombre de un mes o número de mes
 *    (`1` a `12`), devuelve a qué trimestre (`'Q1'`, `'Q2'`, `'Q3'`, `'Q4'`) y
 *    cuántos días tiene ese mes.
 * 3. Validador de año bisiesto: Implementa `esAnioBisiesto(anio)` en una expresión
 *    clara y úsala para determinar los días de febrero.
 *
 * [Intermedio]
 * 4. Refactorización de código "Flecha" (*Arrow Anti-Pattern*): Toma una función
 *    con 4 `if` anidados (verificar pedido -> verificar usuario activo ->
 *    verificar tarjeta vigente -> verificar cupo disponible) y aplánala con
 *    Guard Clauses que devuelvan `{ aprobado: false, motivo: '...' }`.
 * 5. Demostración de ámbito léxico en `switch`: Escribe un `switch` donde dos
 *    `case` declaren `const descuento = ...` usando bloques `{ ... }` para que
 *    no colisionen en el mismo ámbito.
 * 6. Reemplazo de `switch` por Tabla de Despacho (*Command Pattern* ligero):
 *    Crea un diccionario `OPERACIONES_CAJERO` con funciones para `'CONSULTAR'`,
 *    `'DEPOSITAR'` y `'RETIRAR'` y ejecútalas dinámicamente según el comando.
 * 7. Calculadora de impuesto progresivo por tramos: Calcula el impuesto de un
 *    ingreso anual donde los primeros `$10,000` pagan `0%`, el tramo de `$10,000`
 *    a `$40,000` paga `15%` y el excedente sobre `$40,000` paga `25%`.
 *
 * [Senior / Producción]
 * 8. Máquina de Estados Finita (FSM) Dirigida por Tabla: Define una tabla
 *    inmutable `TRANSICIONES_ORDEN` que mapee `[estadoActual][evento] -> nuevoEstado`
 *    (ej. `CREADA + PAGAR -> PAGADA`, `PAGADA + ENVIAR -> ENVIADA`) e implementa
 *    `transicionarOrden(orden, evento)` rechazando transiciones ilegales.
 * 9. Evaluador de Reglas Basado en Tabla de Decisión (*Decision Table*):
 *    En lugar de escribir 12 `if / else` combinando `tipoCliente`, `monto` y
 *    `MetodoPago`, diseña una lista de reglas declarativas `{ condicion: (ctx) => ..., accion: (ctx) => ... }`
 *    y evalúa la primera que coincida.
 * 10. Enrutador HTTP con Coincidencia de Método y Ruta: Implementa un despachador
 *     que reciba `(metodo, ruta, cuerpo)` y devuelva `{ status: 200|400|404|405, body }`
 *     distinguiendo entre ruta no encontrada (`404`) y método no permitido en
 *     una ruta existente (`405`).
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
