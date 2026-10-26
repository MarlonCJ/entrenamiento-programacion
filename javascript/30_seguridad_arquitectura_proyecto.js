'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');

/*
 * ============================================================================
 * TEMA 30: SEGURIDAD (OWASP / NODE:CRYPTO), ARQUITECTURA Y PROYECTO INTEGRADOR
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Seguridad por Diseño y Arquitectura Senior en JS)
 * ----------------------------------------------------------------------------
 * ¡Felicidades por llegar al tema final de la ruta de JavaScript! En producción,
 * las aplicaciones Node.js / JavaScript enfrentan vectores de ataque específicos
 * que todo ingeniero Senior debe neutralizar desde el diseño (**OWASP Top 10**):
 *
 * 1) **Prohibido usar `Math.random()` para Seguridad**:
 *    `Math.random()` usa el algoritmo `xorshift128+`, que **NO es criptográficamente
 *    seguro** (es predecible). Para tokens, IDs de sesión, claves API o códigos
 *    OTP usa SIEMPRE el módulo nativo **`node:crypto`**:
 *    - `crypto.randomUUID()` (UUID v4 criptográfico).
 *    - `crypto.randomBytes(32).toString('hex')` (Tokens de alta entropía).
 *    - `crypto.randomInt(100_000, 1_000_000)` (Códigos OTP de 6 dígitos).
 * 2) **Hashing de Contraseñas con `crypto.scryptSync` / `scrypt` y Comparación en Tiempo Constante**:
 *    Nunca guardes contraseñas con SHA-256 simple. Usa un algoritmo lento con
 *    *Salt* como **`crypto.scryptSync(password, salt, 64)`** y compara hashes o
 *    firmas HMAC con **`crypto.timingSafeEqual(bufA, bufB)`** para impedir
 *    ataques de temporización (*Timing Attacks*).
 * 3) **Defensa contra *Prototype Pollution* (Contaminación de Prototipos — Exclusivo de JS!)**:
 *    Si fusionas un JSON enviado por el usuario que contiene la clave `"__proto__"`
 *    o `"constructor"`, un atacante puede inyectar propiedades en `Object.prototype`
 *    alterando todos los objetos del servidor!
 *    - Defensa: Rechaza claves `'__proto__'`, `'constructor'` y `'prototype'`,
 *      verifica con `Object.hasOwn(obj, k)`, o usa `Map` / `Object.create(null)`.
 * 4) **Prohibición Absoluta de `eval()` y `new Function(codigoUsuario)`**:
 *    Ejecutan código arbitrario en el servidor (*Remote Code Execution*).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Autenticación, firma de tokens y verificación de Webhooks (HMAC-SHA256 con
 *   `crypto.timingSafeEqual`).
 * - Prevención de *Prototype Pollution*, *ReDoS*, *Path Traversal* y *XSS*.
 * - Arquitectura Hexagonal / en Capas separando **Dominio**, **Casos de Uso** y
 *   **Adaptadores**.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (Node.js Moderno - node:crypto)
 * ----------------------------------------------------------------------------
 * // 1. Hashing seguro de contraseña con Salt usando scrypt nativo:
 * function hashearPassword(passwordPlana) {
 *     const salt = crypto.randomBytes(16).toString('hex');
 *     const derivado = crypto.scryptSync(passwordPlana, salt, 64);
 *     return `${salt}:${derivado.toString('hex')}`;
 * }
 *
 * function verificarPassword(passwordPlana, registroGuardado) {
 *     const [salt, hashHex] = registroGuardado.split(':');
 *     const bufGuardado = Buffer.from(hashHex, 'hex');
 *     const bufIntento = crypto.scryptSync(passwordPlana, salt, 64);
 *     return bufGuardado.length === bufIntento.length &&
 *            crypto.timingSafeEqual(bufGuardado, bufIntento);
 * }
 *
 * // 2. Firma HMAC-SHA256 verificada en tiempo constante:
 * function crearHmac(payload, secreto) {
 *     return crypto.createHmac('sha256', secreto).update(payload).digest('hex');
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un filtro de seguridad fusiona objetos de configuración bloqueando
 * ataques de *Prototype Pollution* (`__proto__`) y verifica una contraseña con
 * `scrypt` y `timingSafeEqual`.
 *
 * const CLAVES_PELIGROSAS = new Set(['__proto__', 'constructor', 'prototype']);
 *
 * function copiarSeguroSinPolucion(origen) {
 *     const destino = Object.create(null);
 *     for (const [clave, valor] of Object.entries(origen)) {
 *         if (CLAVES_PELIGROSAS.has(clave)) continue;
 *         destino[clave] = valor;
 *     }
 *     return destino;
 * }
 *
 * const payloadMalicioso = JSON.parse('{"usuario":"ana","__proto__":{"esAdmin":true}}');
 * const limpio = copiarSeguroSinPolucion(payloadMalicioso);
 * console.log('¿Prototipo global contaminado?:', ({}).esAdmin === true);
 *
 * const hash = hashearPassword('Secreta#2026');
 * console.log('Verificación password correcta:', verificarPassword('Secreta#2026', hash));
 * // Salida esperada:
 * // ¿Prototipo global contaminado?: false
 * // Verificación password correcta: true
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code & Gotchas en Node.js)
 * ----------------------------------------------------------------------------
 * - `crypto.timingSafeEqual(a, b)` LANZA `RangeError` SI LOS BUFFERS TIENEN
 *   DISTINTA LONGITUD: Antes de llamar a `timingSafeEqual`, verifica siempre que
 *   `bufA.byteLength === bufB.byteLength`.
 * - NUNCA CONSTRUYAS CONSULTAS SQL NI COMANDOS SHELL CONCATENANDO STRINGS:
 *   En SQL usa siempre parámetros preparados (`$1` o `?`), y para procesos del
 *   sistema usa `child_process.execFile(binario, [arg1, arg2])` en lugar de `exec()`.
 * - CONGELA LOS OBJETOS DE CONFIGURACIÓN Y RESPUESTA DE DOMINIO (`Object.freeze`).
 *
 * 6. PROYECTO INTEGRADOR FINAL: 10 RETOS PARA CONSTRUIR UN MOTOR E-COMMERCE SENIOR
 * ----------------------------------------------------------------------------
 * Construirás paso a paso una aplicación empresarial completa en JavaScript
 * moderno (con Dominio, Casos de Uso, Adaptadores y Suite de Pruebas `node:assert/strict`)
 * integrando todo lo aprendido del Tema 01 al Tema 30:
 *
 * [Fase 1: Seguridad Criptográfica y Capa de Dominio Inmutable]
 * 1. **Objetos de Valor Blindados (`Dinero`, `Email`, `Sku`)**:
 *    Implementa clases con campos privados `#`, operando `Dinero` en centavos
 *    enteros (con conversión a string y `toJSON()`), normalización Unicode NFC y
 *    validación estricta.
 * 2. **Servicio Criptográfico (`GestorSeguridad`)**:
 *    Implementa generación de IDs con `crypto.randomUUID()`, hashing de
 *    contraseñas con `crypto.scryptSync`, comparación en tiempo constante con
 *    `crypto.timingSafeEqual`, verificación de firmas de Webhooks HMAC-SHA256 y
 *    sanitizador contra *Prototype Pollution* y *XSS*.
 * 3. **Entidades de Dominio Ricas (`Producto`, `Orden`)**:
 *    Modela la máquina de estados de una `Orden` (`CREADA -> PAGADA -> ENVIADA` o
 *    `CANCELADA`) con campos privados `#`, impidiendo alteraciones ilegales.
 *
 * [Fase 2: Repositorios, Caché LRU y Control de Concurrencia]
 * 4. **Adaptadores de Repositorio en Memoria (`Map`) con Clonación Defensiva**:
 *    Implementa `RepositorioProductos` y `RepositorioOrdenes` asíncronos.
 * 5. **Decorador de Caché LRU + Limitador de Tasa (*Rate Limiter* por Ventana)**:
 *    Protege las lecturas del catálogo con una `CacheLru` en $O(1)$ e implementa
 *    un *Rate Limiter* que bloquee abusos por IP/usuario.
 *
 * [Fase 3: Caso de Uso Transaccional, Patrones e Idempotencia]
 * 6. **Estrategias Componibles de Descuento e Impuestos (Strategy Pattern)**:
 *    Implementa funciones puras de cálculo de descuentos por nivel VIP y cupones.
 * 7. **Caso de Uso Asíncrono `ProcesarCheckoutUseCase` con Idempotencia y Eventos**:
 *    Orquesta el cobro verificando `idempotencyKey` (evitando doble cobro si el
 *    usuario hace doble clic), reservando stock, registrando el pago y emitiendo
 *    el evento `'orden.pagada'` mediante `EventEmitter`.
 *
 * [Fase 4: Analítica Funcional, Auditoría en Disco y Suite de Pruebas AAA]
 * 8. **Motor de Inteligencia de Negocio (`.filter`, `.flatMap`, `.reduce`, `Object.groupBy`)**:
 *    Genera el reporte ejecutivo: ingresos totales en centavos, ticket promedio,
 *    órdenes agrupadas por estado y Top 3 productos más vendidos.
 * 9. **Exportador e Importador de Auditoría en Streaming (`node:fs/promises` + `readline`)**:
 *    Escribe las órdenes pagadas en un archivo temporal `.jsonl` de forma atómica
 *    y léelas línea por línea con `for await...of` limpiando el archivo en `finally`.
 * 10. **Suite de Pruebas Automatizadas End-to-End con `node:assert/strict`**:
 *     Ejecuta una batería completa de pruebas (`assert.equal`, `assert.deepEqual`,
 *     `assert.throws`, `await assert.rejects`) verificando: checkout exitoso,
 *     idempotencia, rechazo por stock insuficiente, bloqueo de *Prototype
 *     Pollution*, verificación de firma HMAC y exactitud del reporte financiero.
 */

// Zona de trabajo: construye y prueba aqui tu Proyecto Integrador Final de JavaScript.
