<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 09: CONDICIONALES, GUARD CLAUSES Y EXPRESIÓN MATCH (PHP 8.0+)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Control de Decisiones)
 * ----------------------------------------------------------------------------
 * Las estructuras condicionales (`if`, `elseif`, `else`, `switch` y `match`)
 * dirigen el flujo de ejecución según predicados lógicos. En PHP 8.x, dos
 * prácticas distinguen de inmediato el código Senior del código principiante:
 *
 * 1) **Cláusulas de Guarda (*Guard Clauses / Early Return*)**:
 *    En lugar de anidar 5 niveles de `if (...) { if (...) { if (...) } }`
 *    (*Arrow Anti-pattern*), valida y rechaza las condiciones inválidas o casos
 *    borde al principio de la función con un `return` o `throw` inmediato,
 *    dejando el flujo principal (*Happy Path*) plano y sin indentación extra.
 * 2) **La expresión `match` (PHP 8.0+) frente al antiguo `switch`**:
 *    - `switch` compara con igualdad débil (`==`), requiere `break;` en cada
 *      caso para no "caer" accidentalmente al siguiente (*fall-through*), y no
 *      devuelve un valor.
 *    - **`match`** es una **expresión** (devuelve un valor que puedes asignar o
 *      retornar), compara con **identidad estricta (`===`)**, no necesita `break`,
 *      permite agrupar varios valores con comas (`200, 201 => 'Éxito'`), y lanza
 *      `UnhandledMatchError` si ningún brazo coincide y no hay `default`!
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Mapeo Limpio de Estados, Códigos HTTP o Enums (`match`): Traducir un código
 *   de pasarela de pagos, un `enum` o un método HTTP a su acción o tarifa.
 * - Validación de Reglas de Negocio con *Guard Clauses*: Verificar stock, saldo,
 *   estado de cuenta y permisos en líneas independientes y legibles al inicio
 *   del caso de uso.
 * - `match (true)` para Rangos Expresivos: Evaluar condiciones booleanas o
 *   rangos numéricos devolviendo el resultado directamente.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Guard Clauses (Retorno temprano en vez de else anidados):
 * function calcularDescuento(float $monto, bool $activo): float {
 *     if (!$activo) {
 *         return 0.0;
 *     }
 *     if ($monto <= 0) {
 *         throw new InvalidArgumentException("Monto debe ser positivo");
 *     }
 *     return $monto >= 100.0 ? $monto * 0.10 : 0.0;
 * }
 *
 * // 2. Expresión match (PHP 8.0+ - Comparación estricta === y retorno directo):
 * $codigoHttp = 201;
 * $mensaje = match ($codigoHttp) {
 *     200, 201, 204 => 'Operación exitosa',
 *     400, 422      => 'Solicitud inválida',
 *     401, 403      => 'No autorizado',
 *     404           => 'Recurso no encontrado',
 *     default       => 'Error interno del servidor',
 * };
 *
 * // 3. match(true) para evaluar rangos limpios:
 * $nota = 88;
 * $nivel = match (true) {
 *     $nota >= 90 => 'Excelente',
 *     $nota >= 70 => 'Aprobado',
 *     default     => 'Reprobado',
 * };
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un liquidador de comisiones por pasarela de pago valida primero
 * la transacción mediante Guard Clauses y luego calcula la tarifa exacta usando
 * la expresión `match` de PHP 8.
 *
 * function calcularComisionPasarela(string $metodo, float $monto): float {
 *     if ($monto <= 0) {
 *         throw new InvalidArgumentException("El monto debe ser mayor a cero.");
 *     }
 *
 *     $porcentaje = match (strtoupper(trim($metodo))) {
 *         'PSE', 'TRANSFERENCIA' => 0.01,
 *         'TARJETA_DEBITO'       => 0.02,
 *         'TARJETA_CREDITO'      => 0.035,
 *         default => throw new InvalidArgumentException("Método no soportado: {$metodo}"),
 *     };
 *
 *     return round($monto * $porcentaje, 2);
 * }
 *
 * // echo "Comisión TC: $" . calcularComisionPasarela('tarjeta_credito', 200.00) . PHP_EOL;
 * // Salida esperada:
 * // Comisión TC: $7
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - PREFIERE `match` SOBRE `switch` EN PHP 8+: En `switch`, si pasas `"0"` o `0`
 *   y tienes `case "admin":`, en PHP antiguo coincidía por coerción débil (`==`),
 *   y olvidar un `break;` ejecuta el código del siguiente `case`. `match` usa
 *   `===` y nunca hace *fall-through*.
 * - EN PSR-12, USA `elseif` (JUNTO) Y NO `else if` (SEPARADO): El estándar de
 *   estilo oficial de PHP exige `elseif ($condicion)`.
 * - PUEDES LANZAR EXCEPCIONES DIRECTAMENTE EN UN BRAZO DE `match`: Desde PHP 8.0,
 *   `throw` es una expresión, por lo que `default => throw new DomainException(...)`
 *   es 100% válido y súper expresivo.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Clasificador de envíos con `if / elseif / else`: Calcula la tarifa de envío
 *    según el peso del paquete (`<= 1kg`, `<= 5kg`, `<= 20kg`, `> 20kg`),
 *    validando primero con una Guard Clause que el peso sea `> 0`.
 * 2. Traductor de días y estados con `match`: Usa `match` para convertir el
 *    número de día (`1` a `7`) en su nombre y si es `'Laborable'` o `'Fin de semana'`
 *    agrupando casos con comas.
 * 3. Año bisiesto exacto: Implementa `esBisiesto(int $anio): bool` verificando
 *    la regla del calendario gregoriano (divisible por 4 y no por 100, o
 *    divisible por 400).
 *
 * [Intermedio]
 * 4. Refactorización de código "Flecha" a *Guard Clauses*: Toma una función de
 *    procesamiento de pedido con 4 `if` anidados (usuario existe -> usuario
 *    activo -> producto con stock -> saldo suficiente) y aplánala usando Guard
 *    Clauses con mensajes claros.
 * 5. Demostración del peligro de `switch` (`==`) vs `match` (`===`): Muestra qué
 *    ocurre al evaluar el string `"2abc"` o `true` en un `switch` con `case 2:`
 *    frente a evaluarlo en un `match` estricto.
 * 6. Clasificación por tramos con `match (true)`: Implementa un calculador de
 *    impuesto sobre la renta progresivo por tramos de ingreso anual usando
 *    `match (true)`.
 * 7. Máquina de estados con `match` sobre pares `[estadoActual, evento]`:
 *    Evalúa `match ([$estadoActual, $evento])` para decidir el nuevo estado de
 *    un ticket de soporte (`['ABIERTO', 'ASIGNAR'] => 'EN_PROGRESO'`, etc.) o
 *    lanzar excepción en transiciones inválidas.
 *
 * [Senior / Producción]
 * 8. Exhaustividad de `match` con `enum` (PHP 8.1+): Crea un `enum NivelRiesgo`
 *    (`Bajo`, `Medio`, `Alto`, `Critico`) y procésalo en un `match` sin brazo
 *    `default` para que garantice exhaustividad sobre todos los casos del `enum`.
 * 9. Enrutador HTTP declarativo ligero: Implementa `despacharRuta(string $metodo, string $ruta): array`
 *    usando `match ([$metodo, $ruta])` que devuelva el código HTTP (`200`, `404`,
 *    `405 Method Not Allowed`) y el payload de respuesta.
 * 10. Motor de Decisión de Póliza de Seguros: Combina Guard Clauses para
 *     precondiciones y `match (true)` para calcular la prima anual de un seguro
 *     según edad, historial de siniestros y tipo de cobertura.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
