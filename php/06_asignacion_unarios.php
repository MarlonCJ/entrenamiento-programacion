<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 06: OPERADORES DE ASIGNACIÓN COMPUESTA, COALESCENCIA (??=) Y UNARIOS
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Mutación in-situ)
 * ----------------------------------------------------------------------------
 * Los operadores de asignación compuesta (`+=`, `-=`, `*=`, `/=`, `%=`, `.=`,
 * `??=`) actualizan el valor de una variable tomando como base su valor actual.
 *
 * Aspectos clave en PHP 8.x:
 * 1) **Asignación de Coalescencia Nula (`??=`, PHP 7.4+)**:
 *    `$config['timeout'] ??= 30;` asigna `30` **únicamente** si `$config['timeout']`
 *    no existe o es `null`. Si ya valía `0` o `false`, lo respeta intacto! Es
 *    la forma más limpia de inicializar valores por defecto e implementar
 *    *Lazy Initialization* (inicialización perezosa) o cachés en memoria.
 * 2) **Concatenación in-situ con `.=`**:
 *    Cuando usas `$buffer .= $fragmento;`, el Zend Engine redimensiona y
 *    extiende el buffer del string existente en lugar de crear copias completas
 *    en cada paso cuando es el único propietario del `zval`.
 * 3) **Pre-incremento (`++$i`) vs Post-incremento (`$i++`)**:
 *    - `++$i` incrementa la variable y devuelve el **nuevo** valor.
 *    - `$i++` crea una copia temporal del valor original, incrementa la variable
 *      y devuelve el valor **antiguo**.
 *    - Nota sobre PHP 8.3+: Incrementar cadenas alfanuméricas con `$codigo++`
 *      está deprecado en favor de la función explícita `str_increment($codigo)`.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Acumuladores Financieros y Contadores de Lotes: Sumar subtotales (`$total += $monto`),
 *   descontar inventario (`$stock -= $cantidad`) y contar registros procesados.
 * - Inicialización de Opciones y Cachés en Memoria (`??=`):
 *   `$this->cache[$id] ??= $this->cargarDesdeBaseDeDatos($id);`
 * - Construcción Eficiente de Reportes de Texto o CSV (`.=`): Agregar líneas a
 *   un buffer antes de enviarlo a disco o red.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Acumuladores numéricos y de texto:
 * $saldo = 1000;
 * $saldo += 250;  // 1250
 * $saldo -= 100;  // 1150
 *
 * $log = "[INICIO]";
 * $log .= " -> Paso 1";
 * $log .= " -> Fin"; // "[INICIO] -> Paso 1 -> Fin"
 *
 * // 2. Asignación de coalescencia nula (??=):
 * $opciones = ['reintentos' => 0, 'timeout' => null];
 * $opciones['reintentos'] ??= 3; // Se queda en 0 (porque 0 NO es null)
 * $opciones['timeout']    ??= 5; // Pasa a 5 (porque era null)
 * $opciones['host']       ??= 'localhost'; // Se crea la clave con 'localhost'
 *
 * // 3. Pre-incremento vs Post-incremento:
 * $x = 10;
 * $a = $x++; // $a = 10, $x = 11
 * $b = ++$x; // $b = 12, $x = 12
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un agregador de métricas de ventas recorre un lote de pedidos,
 * inicializa contadores por ciudad al vuelo usando `??=` y acumula los montos
 * con `+=` sin necesidad de bloques `if (!isset(...))`.
 *
 * $ventas = [
 *     ['ciudad' => 'Bogotá', 'monto' => 120.0],
 *     ['ciudad' => 'Medellín', 'monto' => 80.0],
 *     ['ciudad' => 'Bogotá', 'monto' => 50.0],
 * ];
 *
 * $totalesPorCiudad = [];
 * foreach ($ventas as $venta) {
 *     $ciudad = $venta['ciudad'];
 *     $totalesPorCiudad[$ciudad] ??= 0.0;
 *     $totalesPorCiudad[$ciudad] += $venta['monto'];
 * }
 *
 * foreach ($totalesPorCiudad as $ciudad => $total) {
 *     echo "{$ciudad}: \${$total}" . PHP_EOL;
 * }
 * // Salida esperada:
 * // Bogotá: $170
 * // Medellín: $80
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA ANIDES `++$i` O `$i++` DENTRO DE EXPRESIONES ARITMÉTICAS COMPLEJAS:
 *   Escribir `$total = $i++ + ++$i;` es ilegible y confuso para cualquier
 *   revisor de código. Pon el incremento en su propia línea o úsalo solo en
 *   indexación clara (`$items[$idx++] = $val;`).
 * - USA `??=` PARA INICIALIZAR CLAVES DE ARREGLOS ANTES DE `+=`:
 *   En PHP 8, hacer `$conteo[$clave] += 1;` cuando `$clave` aún no existe en el
 *   arreglo emite un `Warning: Undefined array key`. La forma limpia es:
 *   `$conteo[$clave] = ($conteo[$clave] ?? 0) + 1;` o `$conteo[$clave] ??= 0; $conteo[$clave]++;`.
 * - CUIDADO CON APLICAR `++` O `--` A BOOLEANOS O NULOS: En PHP histórico,
 *   `$b = true; $b++;` no hacía nada y `$n = null; $n++;` daba `1`. En PHP 8.3+
 *   este comportamiento está deprecado; aplica `++`/`--` solo a `int` y `float`.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Simulador de cuenta corriente: Inicia `$saldo = 50000`, aplica 3 depósitos
 *    con `+=`, 2 retiros con `-=` y un rendimiento del 2% con `*= 1.02`,
 *    mostrando el saldo paso a paso.
 * 2. Trazabilidad de `++$i` vs `$i++`: Crea un generador de turnos que demuestre
 *    la diferencia exacta entre devolver `$turno++` y devolver `++$turno`.
 * 3. Constructor de consulta / log con `.=`: Construye un reporte de texto de
 *    5 líneas de eventos concatenando cada nueva línea con `.=` y `PHP_EOL`.
 *
 * [Intermedio]
 * 4. Normalización de configuración con `??=`: Crea una función
 *    `completarConfiguracion(array $config): array` que aplique valores por
 *    defecto con `??=` para `'puerto'`, `'reintentos'`, `'ssl'` y `'timeout'`
 *    respetando si el usuario pasó `0` o `false`.
 * 5. Contador de frecuencias seguro sin warnings: Dada una lista de estados de
 *    pedidos (`['pagado', 'pendiente', 'pagado', 'cancelado']`), cuenta cuántos
 *    hay de cada estado usando `??=` y `++`.
 * 6. Inversión de signo unario (`-$monto`): Recorre una lista de movimientos
 *    contables (`['tipo' => 'CARGO'|'ABONO', 'monto' => 150]`) y acumula el
 *    balance neto invirtiendo el signo con `-$m['monto']` cuando sea `'CARGO'`.
 * 7. Descuento compuesto en cascada (`*=`): Calcula el precio final de un
 *    artículo tras aplicar sucesivamente tres descuentos acumulativos del 10%,
 *    5% y 2% usando `*=`.
 *
 * [Senior / Producción]
 * 8. Caché en Memoria con *Lazy Initialization* (`??=`): Implementa una clase
 *    `RepositorioMonedas` con un arreglo privado `$cache = []` donde el método
 *    `obtenerTasa(string $par): float` use `$this->cache[$par] ??= $this->consultarFuenteExterna($par);`
 *    demostrando con un contador que la fuente externa solo se llama una vez por moneda.
 * 9. Generador de Secuencias de Facturación con Prefijo (`str_increment` /
 *    contador con padding): Crea una clase `SecuenciaFactura` que mantenga un
 *    contador interno e incremente de forma segura generando `"FAC-2026-0001"`,
 *    `"FAC-2026-0002"`, etc.
 * 10. Acumulador estadístico en una sola pasada (*Welford / Running Stats*):
 *     Procesa un arreglo de tiempos de respuesta (ms) usando operadores de
 *     asignación compuesta para mantener en tiempo real el conteo, la suma, el
 *     mínimo y el máximo sin recorrer el arreglo más de una vez.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
