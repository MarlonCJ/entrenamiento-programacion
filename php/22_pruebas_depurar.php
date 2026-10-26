<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 22: PRUEBAS AUTOMATIZADAS (PATRÓN AAA), DOBLES DE PRUEBA Y DEPURACIÓN
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Calidad y Testing en PHP)
 * ----------------------------------------------------------------------------
 * Las pruebas automatizadas (como las que se escriben en PHPUnit o Pest) son la
 * red de seguridad que permite refactorizar y desplegar en producción un viernes
 * por la tarde con total confianza.
 *
 * Modelo Mental de una Prueba Unitaria Profesional:
 * 1) **Estructura AAA (*Arrange - Act - Assert*)**:
 *    - **Arrange (Preparar)**: Configurar el escenario, datos de entrada e
 *      inyectar dobles de prueba (*Stubs / Fakes / Spies*) para aislar la base
 *      de datos o APIs externas.
 *    - **Act (Actuar)**: Ejecutar la única función o método bajo prueba.
 *    - **Assert (Afirmar)**: Verificar con igualdad estricta (`===`) que el
 *      resultado o el estado final es exactamente el esperado.
 * 2) **Data Providers (Pruebas Parametrizadas)**:
 *    En lugar de copiar y pegar 8 funciones de test casi idénticas, defines una
 *    tabla de casos `['nombre_caso' => [$entrada, $esperado], ...]` y ejecutas
 *    la misma aserción para cada fila, cubriendo el *Happy Path* y todas las
 *    fronteras (*Boundary Testing*: `0`, `-1`, vacío, límite exacto).
 * 3) **Depuración Científica**:
 *    Usar `debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)`, `var_export($v, true)`
 *    y reproducir siempre el bug en un test aislado antes de tocar el código de
 *    producción.
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Pruebas de Reglas de Dominio Puras: Liquidación de impuestos, validación de
 *   cupones, transiciones de estado de pedidos.
 * - Desacoplamiento mediante Dobles de Prueba (*Test Doubles*): Probar el
 *   servicio de registro de usuarios sin enviar correos reales ni cobrar tarjetas
 *   reales usando un `SpyEnviadorEmail` o un `StubPasarelaPago`.
 * - Caza de Regresiones: Reproducir errores de redondeo, *off-by-one* o coerción
 *   débil de tipos.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // Mini-motor de aserciones estilo PHPUnit sin dependencias externas:
 * function assertIgualEstricto(mixed $esperado, mixed $actual, string $mensaje = ''): void {
 *     if ($esperado !== $actual) {
 *         $exp = var_export($esperado, true);
 *         $act = var_export($actual, true);
 *         throw new AssertionError("[FALLO] {$mensaje} -> Esperado: {$exp} | Actual: {$act}");
 *     }
 * }
 *
 * function assertLanzaExcepcion(string $claseExcepcion, callable $accion, string $mensaje = ''): void {
 *     try {
 *         $accion();
 *     } catch (Throwable $e) {
 *         if ($e instanceof $claseExcepcion) {
 *             return; // Éxito: lanzó la excepción esperada
 *         }
 *         throw new AssertionError(
 *             "[FALLO] {$mensaje} -> Se esperaba {$claseExcepcion}, pero se lanzó " . $e::class
 *         );
 *     }
 *     throw new AssertionError("[FALLO] {$mensaje} -> No se lanzó {$claseExcepcion}");
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Probamos una función de cálculo de descuento por volumen usando un
 * *Data Provider* (tabla de casos) y verificamos que rechace cantidades negativas.
 *
 * function calcularPorcentajeDescuentoVolumen(int $unidades): int {
 *     if ($unidades < 0) {
 *         throw new InvalidArgumentException("Las unidades no pueden ser negativas");
 *     }
 *     return match (true) {
 *         $unidades >= 100 => 20,
 *         $unidades >= 10  => 10,
 *         default          => 0,
 *     };
 * }
 *
 * $casosDePrueba = [
 *     'Cero unidades (frontera inferior)' => [0, 0],
 *     '9 unidades (justo antes del tramo 1)' => [9, 0],
 *     '10 unidades (frontera exacta tramo 1)' => [10, 10],
 *     '100 unidades (frontera exacta tramo 2)' => [100, 20],
 * ];
 *
 * foreach ($casosDePrueba as $nombreCaso => [$unidades, $esperado]) {
 *     assertIgualEstricto($esperado, calcularPorcentajeDescuentoVolumen($unidades), $nombreCaso);
 *     echo "[OK] {$nombreCaso}" . PHP_EOL;
 * }
 * assertLanzaExcepcion(
 *     InvalidArgumentException::class,
 *     fn() => calcularPorcentajeDescuentoVolumen(-1),
 *     'Rechaza unidades negativas'
 * );
 * echo "[OK] Rechaza unidades negativas" . PHP_EOL;
 * // Salida esperada:
 * // [OK] Cero unidades (frontera inferior)
 * // [OK] 9 unidades (justo antes del tramo 1)
 * // [OK] 10 unidades (frontera exacta tramo 1)
 * // [OK] 100 unidades (frontera exacta tramo 2)
 * // [OK] Rechaza unidades negativas
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - EN PRUEBAS, COMPARA SIEMPRE CON `===` (`assertSame`), NO CON `==` (`assertEquals`):
 *   Si una función debía devolver `0` (int) pero por un bug devolvió `false` o
 *   `null`, una comparación débil `==` dará el test por aprobado en falso!
 * - NO USES EL RELOJ DEL SISTEMA (`new DateTimeImmutable('now')`) DIRECTAMENTE
 *   DENTRO DE REGLAS DE NEGOCIO: Si una función depende de la hora actual, pasa
 *   el `DateTimeImmutable $ahora` por parámetro o inyecta una interfaz
 *   `RelojInterface` (*PSR-20 ClockInterface*). Así tus tests nunca fallarán a
 *   medianoche ni en años bisiestos.
 * - USA `var_export($valor, true)` O `json_encode($valor)` EN MENSAJES DE FALLO:
 *   Permite ver de inmediato la diferencia entre `"42"` (string) y `42` (int).
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Construcción de utilidades de aserción: Implementa `assertIgualEstricto`,
 *    `assertVerdadero`, `assertFloatCasiIgual(float $esp, float $act, float $eps = 1e-6)`
 *    y `assertLanzaExcepcion`.
 * 2. Pruebas parametrizadas (*Data Provider*): Escribe una función `esCodigoPostalValido(string $cp): bool`
 *    y pruébala con una matriz de al menos 6 casos (válidos, vacíos, con letras,
 *    longitud menor y mayor).
 * 3. Caza de bug #1 (`strpos` sin `!== false`): Corrige una función de validación
 *    que fallaba cuando la palabra buscada aparecía en el índice `0` del texto,
 *    y escribe el test que demuestra la corrección.
 *
 * [Intermedio]
 * 4. Caza de bug #2 (*Off-by-one* en rangos y bucles): Corrige una función que
 *    sumaba los elementos de un subrango de un arreglo pero omitía el último
 *    índice, cubriéndola con pruebas AAA.
 * 5. Caza de bug #3 (Referencia olvidada o mutación lateral): Corrige una función
 *    que ordenaba un arreglo modificando el original cuando debía devolver una
 *    copia ordenada sin alterar la entrada, y verifica en el test que el arreglo
 *    original quede intacto.
 * 6. Desarrollo Guiado por Pruebas (TDD) de Calculadora de Envío: Escribe primero
 *    los casos de prueba y luego la implementación de una función que calcule
 *    tarifa por peso, recargo por zona extrema y envío gratis para miembros VIP.
 * 7. Abstracción del Tiempo (Estilo PSR-20 `ClockInterface`): Diseña un validador
 *    de cupones con fecha de expiración que reciba un `RelojInterface`, e
 *    implementa un `RelojFijoTest` para probar el segundo exacto antes y después
 *    de expirar.
 *
 * [Senior / Producción]
 * 8. Implementación de un *Test Spy* (`SpyNotificador`): Crea una clase que
 *    implemente `NotificadorInterface`, guarde en memoria cada llamada recibida
 *    (`destinatario`, `asunto`) y permita afirmar en tu test: "se envió exactamente
 *    1 notificación y el destinatario fue `ana@test.com`".
 * 9. Implementación de un *Fake Repository* en Memoria: Crea `RepositorioUsuariosEnMemoria`
 *    que implemente `RepositorioUsuariosInterface` para probar de principio a fin
 *    el caso de uso `RegistrarUsuarioService` (incluyendo detección de email
 *    duplicado) en menos de 1 milisegundo sin tocar base de datos.
 * 10. Ejecutor de Suite de Pruebas con Resumen y Tiempos (`TestRunner`):
 *     Construye una clase `EjecutorPruebas` que registre tests por nombre, los
 *     ejecute todos capturando `Throwable`, mida el tiempo en milisegundos con
 *     `hrtime(true)` e imprima el reporte final de aprobados y fallidos.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
