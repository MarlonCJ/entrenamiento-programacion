<?php

declare(strict_types=1);

/*
 * ============================================================================
 * TEMA 14: DISEÑO DE FUNCIONES, TIPOS COMPUESTOS Y NAMED ARGUMENTS (PHP 8.x)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental de Contratos de Función)
 * ----------------------------------------------------------------------------
 * Una función bien diseñada en PHP 8 actúa como un **contrato explícito y
 * verificable**: declara qué tipos exactos exige de entrada y qué tipo exacto
 * garantiza devolver (o `void` / `never`).
 *
 * Evolución del Sistema de Tipos en Funciones (PHP 8.0 / 8.1 / 8.2):
 * 1) **Tipos Anulables (`?string`, `?int`)**: Equivale a `string|null`.
 * 2) **Union Types (`int|float`, `string|Stringable`, PHP 8.0+)**: Permite
 *    aceptar o devolver más de un tipo explícito de forma segura.
 * 3) **Intersection Types (`Countable&Iterator`, PHP 8.1+)**: Exige que el
 *    objeto cumpla múltiples interfaces simultáneamente.
 * 4) **Tipos de Retorno Especiales (`void`, `never`, `mixed`)**:
 *    - `void`: La función realiza un efecto lateral y no devuelve valor.
 *    - `never` (PHP 8.1+): Garantiza al analizador estático que la función
 *      **jamás retorna normalmente** (porque siempre lanza una excepción o
 *      termina el script).
 * 5) **Argumentos con Nombre (*Named Arguments*, PHP 8.0+)**:
 *    Permiten invocar `crearCookie(nombre: 'sesion', httpOnly: true, segura: true)`
 *    saltándose parámetros opcionales intermedios y eliminando el misterio de
 *    los booleanos posicionales (`crearCookie('sesion', '', 0, '/', '', true, true)`).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Funciones de Dominio Autodocumentadas: Usar *Named Arguments* al llamar a
 *   funciones con más de 3 parámetros o con banderas booleanas.
 * - Funciones Variádicas Tipadas (`int ...$numeros`): Aceptar un número variable
 *   de argumentos garantizando que el motor valide el tipo de cada uno.
 * - Callbacks de Primera Clase (`strlen(...)`, PHP 8.1+): Pasar referencias a
 *   funciones o métodos con la sintaxis moderna `MiClase::metodo(...)`.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA (PHP 8.x Moderno)
 * ----------------------------------------------------------------------------
 * // 1. Firma moderna con Union Types, valores por defecto y retorno estricto:
 * function calcularPrecioFinal(
 *     int|float $precioBase,
 *     float $descuento = 0.0,
 *     bool $incluirIva = true,
 * ): float {
 *     $conDescuento = $precioBase * (1.0 - $descuento);
 *     return round($incluirIva ? $conDescuento * 1.19 : $conDescuento, 2);
 * }
 *
 * // 2. Llamada con Named Arguments (PHP 8.0+):
 * $total = calcularPrecioFinal(precioBase: 100, incluirIva: false); // 100.0
 *
 * // 3. Parámetros variádicos (...$nums) y tipo de retorno never (PHP 8.1+):
 * function sumarTodos(int ...$numeros): int {
 *     return array_sum($numeros);
 * }
 * function abortarConError(string $mensaje): never {
 *     throw new RuntimeException($mensaje);
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Un generador de enlaces firmados utiliza parámetros con valores
 * por defecto y se invoca con *Named Arguments* para máxima claridad en el
 * código cliente.
 *
 * function construirUrlDescarga(
 *     string $archivo,
 *     int $expiraEnSegundos = 3600,
 *     bool $forzarDescarga = false,
 *     string $dominio = 'https://cdn.empresa.com',
 * ): string {
 *     $modo = $forzarDescarga ? 'attachment' : 'inline';
 *     return sprintf(
 *         "%s/%s?exp=%d&disposition=%s",
 *         rtrim($dominio, '/'),
 *         ltrim($archivo, '/'),
 *         $expiraEnSegundos,
 *         $modo
 *     );
 * }
 *
 * // Invocación expresiva con Named Arguments:
 * $url = construirUrlDescarga(
 *     archivo: 'reportes/balance_2026.pdf',
 *     forzarDescarga: true,
 * );
 * echo $url . PHP_EOL;
 * // Salida esperada:
 * // https://cdn.empresa.com/reportes/balance_2026.pdf?exp=3600&disposition=attachment
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, PSR-12 & Gotchas)
 * ----------------------------------------------------------------------------
 * - EN PHP 8+, LOS NOMBRES DE LOS PARÁMETROS FORMAN PARTE DEL CONTRATO PÚBLICO:
 *   Gracias a los *Named Arguments*, si cambias el nombre de un parámetro en una
 *   función pública, puedes romper a quienes la llamen por nombre. Elige nombres
 *   claros y estables desde el principio.
 * - NUNCA PONGAS PARÁMETROS OBLIGATORIOS DESPUÉS DE PARÁMETROS OPCIONALES:
 *   Escribir `function f(int $a = 1, int $b)` está **deprecado desde PHP 8.0**.
 *   Los parámetros con valor por defecto siempre van al final.
 * - EVITA LAS BANDERAS BOOLEANAS QUE DIVIDEN UNA FUNCIÓN EN DOS COSAS DISTINTAS:
 *   En lugar de `procesarUsuario($u, true)` vs `procesarUsuario($u, false)`, es
 *   más limpio tener `activarUsuario($u)` y `suspenderUsuario($u)` o usar Named
 *   Arguments si es una opción de configuración menor.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Función tipada pura: Implementa `calcularIndiceMasaCorporal(float $pesoKg, float $alturaMetros): float`
 *    validando que ambos sean mayores a `0` y redondeando a 2 decimales.
 * 2. Uso de tipos anulables (`?string`): Crea `formatearSaludo(?string $nombre): string`
 *    que devuelva `"Hola, Invitado"` si recibe `null` o cadena en blanco.
 * 3. Invocación con *Named Arguments*: Crea una función `configurarConexionHttp`
 *    con 5 parámetros (3 de ellos con valores por defecto) e invócala cambiando
 *    únicamente el primer y el último parámetro por nombre.
 *
 * [Intermedio]
 * 4. Union Types (`int|float|string`): Implementa `normalizarMontoEnCentavos(int|float|string $entrada): int`
 *    que convierta de forma segura cualquiera de los tres tipos a su valor en
 *    centavos enteros.
 * 5. Función variádica tipada (`float ...$valores`): Implementa
 *    `calcularEstadisticas(float ...$valores): array` que exija al menos 1 valor
 *    y retorne `['min' => ..., 'max' => ..., 'promedio' => ...]`.
 * 6. Desempaquetado de argumentos al invocar (`$fn(...$args)`): Demuestra cómo
 *    pasar un arreglo asociativo `['precioBase' => 200, 'incluirIva' => false]`
 *    usando el operador spread `calcularPrecioFinal(...$opciones)`.
 * 7. Sintaxis de Callables de Primera Clase (PHP 8.1+ `fn(...)`): Crea una
 *    función `aplicarTransformacion(array $textos, Closure $transformador): array`
 *    y pásale `strtoupper(...)` y `trim(...)` usando la sintaxis `...`.
 *
 * [Senior / Producción]
 * 8. Funciones de Guardia con tipo de retorno `never` (PHP 8.1+): Implementa un
 *    conjunto de aserciones de dominio (`asegurarNoVacio`, `asegurarPositivo`,
 *    `fallarInesperado(): never`) para validar precondiciones limpiamente.
 * 9. Diseño de Funciones Puras vs Impureza en la Frontera: Refactoriza una
 *    función que mezclaba cálculo de descuentos, lectura de la hora actual
 *    (`time()`) e impresión por pantalla, en una función 100% pura que recibe
 *    `$timestampActual` por parámetro.
 * 10. Pipeline de composición de funciones (`pipe`): Implementa una función de
 *     orden superior `crearPipeline( callable ...$etapas ): Closure` que reciba
 *     varias funciones de transformación y devuelva una nueva función que las
 *     aplique en secuencia al dato de entrada.
 */

// Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
