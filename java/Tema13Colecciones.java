import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/*
 * ============================================================================
 * TEMA 13: COLECCIONES AVANZADAS: MAPAS (`Map<K,V>`) Y CONJUNTOS (`Set<T>`)
 * ============================================================================
 *
 * 1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental y JVM)
 * ----------------------------------------------------------------------------
 * Cuando una lista secuencial (`List`) no es eficiente porque necesitas buscar
 * por clave instantáneamente o garantizar unicidad sin duplicados, el Java
 * Collections Framework ofrece:
 * - `Set<T>` (`HashSet`, `LinkedHashSet`, `TreeSet`): Conjunto matemático de
 *   elementos ÚNICOS. Comprobar si un elemento existe (`.contains(x)`) cuesta
 *   $O(1)$ en promedio frente al $O(n)$ de recorrer un `ArrayList`.
 * - `Map<K, V>` (`HashMap`, `LinkedHashMap`, `TreeMap`): Diccionario de pares
 *   Clave -> Valor con claves únicas y búsqueda instantánea en $O(1)$.
 *
 * Modelo Mental en la JVM (Tablas Hash y Colisiones):
 * `HashMap` almacena las entradas en un arreglo de cubetas (buckets) calculando
 * el índice a partir de `clave.hashCode()`. Si varias claves caen en el mismo
 * bucket (colisión de hash), Java las encadena en una lista enlazada y, desde
 * Java 8, si un bucket supera 8 elementos, lo transforma automáticamente en un
 * Árbol Rojo-Negro balanceado, garantizando $O(\log n)$ en el peor caso para
 * proteger al servidor contra ataques DoS de colisión de hashes.
 * (`HashSet` es internamente un `HashMap` donde los elementos son las claves).
 *
 * 2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
 * ----------------------------------------------------------------------------
 * - `HashSet`: Eliminar duplicados de una lista, verificar en $O(1)$ si un ID o
 *   correo ya fue procesado (idempotencia), listas negras de tokens o IPs.
 * - `HashMap`: Cachés en memoria, índices rápidos por ID (`Map<Long, Usuario>`),
 *   conteo de frecuencias (histogramas), agrupación de registros por categoría.
 * - `LinkedHashMap` / `LinkedHashSet`: Cuando necesitas velocidad $O(1)$ pero
 *   además conservar el orden exacto de inserción.
 *
 * 3. SINTAXIS Y REFERENCIA RÁPIDA
 * ----------------------------------------------------------------------------
 * // 1. Set: unicidad garantizada y búsqueda O(1)
 * Set<String> emailsUnicos = new HashSet<>();
 * emailsUnicos.add("ana@dev.io");
 * emailsUnicos.add("ana@dev.io"); // Ignorado (devuelve false)
 * boolean existe = emailsUnicos.contains("ana@dev.io"); // true en O(1)
 *
 * // 2. Map y sus métodos modernos (Java 8+: getOrDefault, putIfAbsent, merge, computeIfAbsent)
 * Map<String, Integer> stock = new HashMap<>();
 * stock.put("Teclado", 10);
 * int disponibles = stock.getOrDefault("Mouse", 0); // Evita null si no existe la clave
 * stock.merge("Teclado", 5, Integer::sum);          // Suma 5 al valor existente (queda 15)
 *
 * // Recorrido eficiente de un Map con entrySet()
 * for (Map.Entry<String, Integer> entrada : stock.entrySet()) {
 *     System.out.println(entrada.getKey() + " -> " + entrada.getValue());
 * }
 *
 * 4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con salida esperada)
 * ----------------------------------------------------------------------------
 * Caso: Contador de frecuencia de eventos de auditoría y agrupación por nivel.
 *
 * String[] eventos = {"LOGIN", "COMPRA", "LOGIN", "ERROR", "LOGIN", "COMPRA"};
 * Map<String, Integer> frecuencias = new LinkedHashMap<>();
 *
 * for (String evento : eventos) {
 *     frecuencias.merge(evento, 1, Integer::sum);
 * }
 *
 * System.out.println("Conteo de eventos: " + frecuencias);
 * System.out.println("Accesos LOGIN: " + frecuencias.getOrDefault("LOGIN", 0));
 *
 * Salida esperada:
 * Conteo de eventos: {LOGIN=3, COMPRA=2, ERROR=1}
 * Accesos LOGIN: 3
 *
 * 5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Clean Code, Effective Java & Gotchas)
 * ----------------------------------------------------------------------------
 * - Error común 1 (Unbox de `null` en `Map`): Hacer `int n = mapa.get("claveInexistente");`
 *   lanza `NullPointerException` porque `get` devuelve `null` y Java intenta
 *   convertirlo a `int` primitivo. Usa siempre `mapa.getOrDefault("clave", 0)`.
 * - Error común 2 (Recorrer con `keySet()` + `.get()`): Hacer un `for` sobre
 *   `mapa.keySet()` y dentro llamar a `mapa.get(k)` duplica las búsquedas hash.
 *   Recorre siempre con `mapa.entrySet()` o `mapa.forEach((k, v) -> ...)`.
 * - Regla de Oro de Claves en `Map` y `Set`: Usa SIEMPRE objetos INMUTABLES como
 *   claves (`String`, `Integer`, `Long`, `UUID`, `enum`, `record`). Si mutas un
 *   objeto después de insertarlo como clave en un `HashMap`, su `hashCode` cambia
 *   y el elemento se vuelve imposible de recuperar.
 *
 * 6. EJERCICIOS PROGRESIVOS (10 Retos)
 * ----------------------------------------------------------------------------
 * [Básico]
 * 1. Crea un `Map<String, Double>` de productos y precios, inserta 4 elementos y
 *    recorre el mapa usando `entrySet()` para imprimir un catálogo formateado.
 * 2. Dada una `List<String>` con correos repetidos, elimina los duplicados
 *    pasándola a un `Set<String>` (compara `HashSet` vs `LinkedHashSet` para
 *    conservar el orden de aparición).
 * 3. Crea un directorio de estudiantes y sus calificaciones (`Map<String, Integer>`),
 *    y consulta tanto un estudiante existente como uno inexistente usando
 *    `getOrDefault` para evitar `NullPointerException`.
 *
 * [Intermedio]
 * 4. Cuenta la frecuencia de cada palabra en una oración (convirtiendo a minúsculas)
 *    usando un `Map<String, Integer>` y `getOrDefault` o `merge`.
 * 5. Dados dos conjuntos (`Set<String>`) de desarrolladores que dominan Java y
 *    Python respectivamente, calcula su unión, su intersección (`retainAll`) y
 *    su diferencia (`removeAll`) sin destruir los conjuntos originales.
 * 6. Procesa una lista de ventas por producto acumulando las unidades vendidas
 *    por cada código SKU dentro de un `Map<String, Integer>`.
 * 7. Combina dos mapas de inventario de dos sucursales (`sucursalA` y `sucursalB`)
 *    en un mapa consolidado sumando las existencias cuando un producto esté en ambas.
 *
 * [Senior / Producción]
 * 8. Agrupa una lista de palabras según su letra inicial dentro de un
 *    `Map<Character, List<String>>` utilizando el patrón moderno
 *    `mapa.computeIfAbsent(inicial, k -> new ArrayList<>()).add(palabra)`.
 * 9. Resuelve el problema clásico de entrevista y optimización "Two Sum" en
 *    tiempo $O(n)$ usando un `Map<Integer, Integer>` (valor -> índice) para hallar
 *    dos números en un arreglo que sumen un `objetivo` dado.
 * 10. Modela un control de inventario que descuente pedidos entrantes, rechace
 *     ventas sin stock suficiente y genere al final el listado de productos
 *     agotados (`stock == 0`) y productos en punto de reorden (`stock < 5`).
 */
public class Tema13Colecciones {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aquí tus soluciones.
    }
}
