'use strict';

/*
 * ============================================================================
 * TEMA 08: BITWISE, TERNARIO, OPTIONAL CHAINING (?.), COALESCENCIA (??) Y PRECEDENCIA
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en V8 y ES2020+)
 * ----------------------------------------------------------------------------
 * Este tema cubre los operadores modernos que eliminaron el error más frecuente
 * en la historia de JavaScript (`TypeError: Cannot read properties of undefined`)
 * y el funcionamiento interno de los operadores de bits:
 *
 * 1) **Encadenamiento Opcional (`?.` - *Optional Chaining*, ES2020)**:
 *    Permite leer propiedades anidadas, elementos de arreglos o invocar métodos
 *    que podrían no existir:
 *    - `orden?.cliente?.direccion?.ciudad`
 *    - `lista?.[0]`
 *    - `opciones.onSuccess?.(resultado)` (solo invoca el callback si es función/existe!).
 *    Si el lado izquierdo de `?.` es `null` o `undefined`, detiene la evaluación
 *    y devuelve `undefined` sin lanzar error.
 * 2) **Coalescencia Nula (`??` - *Nullish Coalescing*, ES2020) vs OR (`||`)**:
 *    - `valor ?? porDefecto`: Usa `porDefecto` **SOLO si `valor` es `null` o `undefined`**.
 *    - `valor || porDefecto`: Usa `porDefecto` si `valor` es **cualquier falsy**
 *      (`0`, `""`, `false`, `NaN`, `null`, `undefined`).
 *    - ¡Bug clásico en producción con `||`!:
 *      `const descuento = inputDescuento || 10;` -> Si el usuario envía `0` de
 *      descuento, como `0` es falsy, `||` le aplica `10` por error! Con
 *      `inputDescuento ?? 10`, el `0` se respeta intacto.
 * 3) **Operadores Bitwise en JS (`&`, `|`, `^`, `~`, `<<`, `>>`, `>>>`)**:
 *    En JavaScript, los números son floats de 64 bits, pero los operadores bit a
 *    bit convierten temporalmente los operandos a **enteros de 32 bits con signo**
 *    (excepto `>>>`, que convierte a entero de 32 bits **sin signo**).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Acceso Seguro a Respuestas de APIs Profundas (`?.` + `??`):
 *   `const tarifa = respuesta?.datos?.cotizacion?.monto ?? 0;`
 * - Invocación Segura de Callbacks Opcionales (`?.()`):
 *   `config.alFinalizar?.(datos);`
 * - Permisos y Banderas Compactas con Máscaras de Bits (*Bitmasks*):
 *   Combinar permisos con `|`, verificarlos con `&` y alternarlos con `^`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (ECMAScript Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Las 3 variantes del Optional Chaining (?. , ?.[], ?.()) combinadas con ?? :
 * const usuario = { perfil: { nombre: 'Ana' }, roles: ['ADMIN'] };
 * const ciudad  = usuario?.perfil?.direccion?.ciudad ?? 'No especificada';
 * const rol1    = usuario?.roles?.[0] ?? 'INVITADO';
 * const logRes  = usuario?.auditar?.(); // undefined (no falla porque auditar no existe)
 *
 * // 2. Diferencia vital entre ?? y || con el número 0 o false:
 * const stockRecibido = 0;
 * const stockConOr    = stockRecibido || 50; // 50 (¡ERROR! Ignoró el 0)
 * const stockConNull  = stockRecibido ?? 50; // 0  (¡CORRECTO! Respetó el 0)
 *
 * // 3. Máscaras de bits (Bitmasks de 32 bits):
 * const PERM_LEER = 1 << 0;     // 1 (001)
 * const PERM_ESCRIBIR = 1 << 1; // 2 (010)
 * const mascara = PERM_LEER | PERM_ESCRIBIR;
 * const puedeEscribir = (mascara & PERM_ESCRIBIR) !== 0; // true
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un procesador de pedidos extrae de forma segura la configuración
 * de envío de un payload JSON incompleto usando `?.` y `??`, y ejecuta un hook
 * opcional con `?.()`.
 *
 * function procesarEnvioPedido(pedido, hooks = {}) {
 *     const costoEnvio = pedido?.envio?.costo ?? 15.0; // Si costo es 0 (envío gratis), respeta el 0!
 *     const destinatario = pedido?.cliente?.nombre ?? 'Cliente Anónimo';
 *     hooks?.antesDeDespachar?.(destinatario, costoEnvio);
 *     return `Despachando a ${destinatario} (Costo envío: $${costoEnvio})`;
 * }
 *
 * const pedidoEnvioGratis = { cliente: { nombre: 'Ana' }, envio: { costo: 0 } };
 * console.log(procesarEnvioPedido(pedidoEnvioGratis));
 * // Salida esperada:
 * // Despachando a Ana (Costo envío: $0)
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en V8)
 * ----------------------------------------------------------------------------
 * - EN JAVASCRIPT ES UN `SyntaxError` MEZCLAR `??` CON `&&` O `||` SIN PARÉNTESIS:
 *   Escribir `a && b ?? c` no compila por seguridad de precedencia. Debes
 *   escribir explícitamente `(a && b) ?? c` o `a && (b ?? c)`.
 * - CUIDADO CON EL TRUNCAMIENTO A 32 BITS EN OPERADORES BITWISE:
 *   Como `| 0` o `<<` truncan a un entero de 32 bits con signo (máximo `2,147,483,647`),
 *   aplicar `3_000_000_000 | 0` desborda y devuelve un número negativo (`-1294967296`)!
 *   Para números mayores a 32 bits usa `Math.trunc()` o `BigInt`.
 * - NO USES TERNARIOS ANIDADOS DE MÁS DE 2 NIVELES: Son difíciles de leer;
 *   prefiere funciones con *Guard Clauses* o diccionarios de mapeo.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Demostración práctica de `??` vs `||`: Evalúa ambos operadores sobre un
 *    objeto de configuración `{ volumen: 0, brillo: 50, subtítulos: false, idioma: '' }`
 *    mostrando cómo `||` corrompe `0`, `false` y `''`.
 * 2. Navegación segura con `?.`, `?.[]` y `?.()`: Dado un arreglo de órdenes
 *    donde algunas no tienen `cliente`, otras no tienen `items` y otras no tienen
 *    método `calcularImpuesto()`, recórrelas sin que ninguna lance `TypeError`.
 * 3. Operaciones bit a bit y binario: Usa `(numero >>> 0).toString(2).padStart(8, '0')`
 *    para visualizar en binario el resultado de `&`, `|`, `^`, `~`, `<<` y `>>`.
 *
 * [Intermedio]
 * 4. Sistema de Permisos RBAC con Bitmasks: Implementa las constantes
 *    `VER (1)`, `CREAR (2)`, `EDITAR (4)`, `BORRAR (8)`, `EXPORTAR (16)` y las
 *    funciones `agregarPermiso`, `quitarPermiso`, `alternarPermiso` y `tieneTodosLosPermisos`.
 * 5. Precedencia de operadores: Corrige y documenta 4 expresiones donde la falta
 *    de paréntesis entre `+`, `<<`, `&`, `===` y `? :` producía un resultado inesperado.
 * 6. Desempaquetado de colores Hexadecimales (`0xFF5733`) con Bitwise:
 *    Implementa `hexARgb(colorEntero)` que extraiga los canales `r`, `g` y `b`
 *    usando desplazamiento `(color >> 16) & 0xFF`, `(color >> 8) & 0xFF` y `color & 0xFF`.
 * 7. Diferencia entre desplazamiento con signo (`>>`) y sin signo (`>>>`):
 *    Muestra qué ocurre al aplicar `-16 >> 2` frente a `-16 >>> 2`.
 *
 * [Senior / Producción]
 * 8. Resolución de Configuración en Cascada (CLI -> Env -> Archivo -> Default):
 *    Combina `?.` y `??` para resolver una configuración compleja desde 4 niveles
 *    de prioridad garantizando que los valores `0` y `false` se preserven.
 * 9. Conversor de Dirección IPv4 (`"192.168.1.1"`) a Entero de 32 bits sin signo
 *    (`>>> 0`) y viceversa para verificar en $O(1)$ si una IP pertenece a una
 *    subred mediante una máscara CIDR.
 * 10. Uso de Bitwise con `BigInt` para máscaras de más de 32 banderas: Como los
 *     operadores bitwise en `number` están limitados a 32 bits, implementa un
 *     gestor de 64 flags de características (*Feature Flags*) usando literales
 *     `BigInt` (`1n << 50n`).
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
