import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/*
 * ============================================================================
 * TEMA 25: PROGRAMACION FUNCIONAL, LAMBDAS, STREAMS, OPTIONAL Y GENERICOS
 * ============================================================================
 *
 * 1. ¿QUE ES Y POR QUE IMPORTA? (Modelo Mental y Evaluacion Perezosa en la JVM)
 * ----------------------------------------------------------------------------
 * Desde Java 8+, el lenguaje incorporo un modelo declarativo y funcional que
 * permite transformar colecciones de datos como tuberias (*pipelines*) sin
 * mutar variables externas.
 *
 * Modelo Mental en la JVM:
 * 1) **Interfaces Funcionales (`java.util.function`) y Lambdas**:
 *    Una interfaz con un unico metodo abstracto (`@FunctionalInterface`) puede
 *    instanciarse con una expresion lambda `x -> x * 2` o referencia a metodo
 *    `String::trim` (implementadas eficientemente en la JVM con `invokedynamic`).
 *    Las 4 fundamentales son:
 *    - `Predicate<T>`: `T -> boolean` (filtrar: `.test(t)`)
 *    - `Function<T, R>`: `T -> R` (transformar: `.apply(t)`)
 *    - `Consumer<T>`: `T -> void` (consumir/efecto lateral: `.accept(t)`)
 *    - `Supplier<T>`: `() -> T` (proveer perezosamente: `.get()`)
 * 2) **Streams (`java.util.stream.Stream`) y Evaluacion Perezosa (*Lazy*)**:
 *    Un `Stream` NO es una estructura de datos ni guarda elementos; es una
 *    tuberia de calculo. Las operaciones intermedias (`filter`, `map`, `flatMap`,
 *    `sorted`, `distinct`) son **perezosas**: no ejecutan nada hasta que se
 *    invoca una operacion terminal (`toList()`, `collect(...)`, `reduce`, `count`,
 *    `findFirst`). Ademas, la JVM fusiona las etapas (*Loop Fusion*) en una sola
 *    pasada!
 * 3) **`Optional<T>`**: Contenedor explicito para el **retorno** de metodos que
 *    pueden no encontrar un valor, eliminando el temido `NullPointerException`.
 *
 * 2. ¿CUANDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - Procesamiento Declarativo de Dominio: Filtrar pedidos pagados, agruparlos
 *   por cliente o categoria (`Collectors.groupingBy`) y sumar sus totales.
 * - Contratos de Repositorio Expresivos: `Optional<Cliente> buscarPorId(String id)`
 *   obliga al llamador a manejar el caso vacio con `.orElse(...)` o `.orElseThrow(...)`.
 * - Componentes Genericos Reutilizables (`<T, R>`): Paginadores, respuestas de
 *   API (`Respuesta<T>`) y filtros reutilizables con seguridad de tipos en compilacion.
 *
 * 3. SINTAXIS Y REFERENCIA RAPIDA
 * ----------------------------------------------------------------------------
 * // 1. Pipeline de Stream con filter, map y agrupacion con Collectors:
 * record Venta(String categoria, double monto, boolean confirmada) {}
 *
 * // Map<String, Double> totalPorCategoria = ventas.stream()
 * //     .filter(Venta::confirmada)
 * //     .collect(Collectors.groupingBy(
 * //         Venta::categoria,
 * //         Collectors.summingDouble(Venta::monto)
 * //     ));
 *
 * // 2. Uso idiomatico de Optional (sin usar .get() a ciegas):
 * static Optional<String> buscarDominioEmail(String email) {
 *     return Optional.ofNullable(email)
 *         .map(String::trim)
 *         .filter(e -> e.contains("@"))
 *         .map(e -> e.substring(e.indexOf('@') + 1).toLowerCase());
 * }
 *
 * 4. EJEMPLO PRACTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Escenario: Analizar una lista de transacciones financieras para obtener el
 * total recaudado por moneda unicamente de las transacciones aprobadas mayores
 * a 50.0.
 *
 * record Transaccion(String id, String moneda, double monto, boolean aprobada) {}
 *
 * // Ejecucion en main:
 * // List<Transaccion> txs = List.of(
 * //     new Transaccion("T1", "USD", 120.0, true),
 * //     new Transaccion("T2", "USD", 30.0, true),
 * //     new Transaccion("T3", "USD", 80.0, false),
 * //     new Transaccion("T4", "EUR", 200.0, true),
 * //     new Transaccion("T5", "USD", 100.0, true)
 * // );
 * // Map<String, Double> resumen = txs.stream()
 * //     .filter(Transaccion::aprobada)
 * //     .filter(t -> t.monto() >= 50.0)
 * //     .collect(Collectors.groupingBy(
 * //         Transaccion::moneda,
 * //         Collectors.summingDouble(Transaccion::monto)
 * //     ));
 * // System.out.println(resumen);
 * // Salida esperada:
 * // {EUR=200.0, USD=220.0}
 *
 * 5. BUENAS PRACTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - NUNCA MUTES VARIABLES EXTERNAS DENTRO DE `forEach` O `map` (Efectos Laterales):
 *   Las funciones pasadas a un Stream deben ser **puras** (sin estado mutable
 *   compartido). En lugar de acumular en una lista externa con `.forEach(lista::add)`,
 *   usa `.toList()` o `.collect(...)` (Effective Java Item 46).
 * - REGLAS DE ORO DE `Optional` (Effective Java Item 55):
 *   1) NUNCA devuelvas `null` en un metodo que retorna `Optional<T>`; devuelve
 *      `Optional.empty()`.
 *   2) NUNCA uses `Optional` como atributo de clase ni como parametro de metodo;
 *      fue disenado exclusivamente como tipo de retorno.
 *   3) NUNCA llames a `optional.get()` sin antes preferir `orElse(...)`,
 *      `orElseGet(() -> ...)` o `orElseThrow(...)`.
 * - CUIDADO CON EL AUTOBOXING EN STREAMS NUMERICOS: Para sumar o promediar miles
 *   de numeros, usa `mapToInt` / `mapToDouble` / `IntStream` en lugar de
 *   `Stream<Integer>` para evitar crear miles de objetos envoltorio en el Heap.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Basico]
 * 1. Filtrado y transformacion inmutable: Dada una `List<String>` de nombres con
 *    espacios y distintas mayusculas, usa Streams para limpiar espacios, descartar
 *    los de menos de 3 letras, convertirlos a mayusculas y devolverlos ordenados.
 * 2. Estadisticas con `mapToDouble` y `DoubleSummaryStatistics`: Dada una lista
 *    de productos, obten en una sola operacion el conteo, suma, minimo, promedio
 *    y maximo de sus precios con `.summaryStatistics()`.
 * 3. Composicion de `Predicate` y `Function`: Crea dos `Predicate<Producto>`
 *    (`esActivo` y `tieneStock`) y combinalos con `.and()`, `.or()` y `.negate()`.
 *
 * [Intermedio]
 * 4. Aplanamiento con `flatMap`: Dada una lista de `Pedido`, donde cada pedido
 *    contiene una `List<LineaPedido>`, usa `flatMap` para obtener la lista unica
 *    de todos los nombres de productos distintos comprados.
 * 5. Agrupacion y particionamiento avanzado (`groupingBy` y `partitioningBy`):
 *    Agrupa una lista de empleados por departamento calculando el salario promedio
 *    de cada uno, y particionalos en dos grupos (`salario >= 3000` vs `< 3000`).
 * 6. Encadenamiento funcional con `Optional`: Dado un `Optional<Usuario>` que
 *    puede tener un `Optional<Direccion>` con una `ciudad`, extrae el nombre de
 *    la ciudad en mayusculas usando `.flatMap` y `.map`, devolviendo `"SIN CIUDAD"`
 *    si cualquier eslabon esta vacio.
 * 7. Reduccion inmutable (`reduce`): Calcula el producto total o la concatenacion
 *    formateada de una lista de elementos usando `Stream.reduce` con valor
 *    identidad seguro.
 *
 * [Senior / Produccion]
 * 8. Diferencia critica entre `orElse(...)` y `orElseGet(...)`: Demuestra con un
 *    metodo que imprime en consola como `optionalConValor.orElse(operacionCostosa())`
 *    ejecuta `operacionCostosa()` AUNQUE el Optional tenga valor, mientras que
 *    `orElseGet(() -> operacionCostosa())` es perezoso y lo evita.
 * 9. Diseno de Contenedor Generico `Resultado<T, E>` (Programacion Funcional Tipada):
 *    Implementa una clase/interfaz generica `Resultado<T, E>` con metodos
 *    funcionales `.map(Function<T, R>)` y `.flatMap(...)` para encadenar
 *    operaciones que pueden fallar sin lanzar excepciones.
 * 10. Motor de Consultas en Memoria con Streams y Genericos: Implementa un metodo
 *     generico `agruparYContar(Collection<T> datos, Function<T, K> clasificador)`
 *     y otro `topN(Collection<T> datos, Comparator<T> comp, int n)` probandolos
 *     con registros de auditoria empresarial.
 */
public class Tema25ProgramacionFuncional {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones para los 10 retos.
    }
}
