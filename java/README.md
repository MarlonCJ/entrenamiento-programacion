# Ruta Completa de Ingeniería en Java (Nivel Básico a Senior)

Empieza por la [introducción a Java](./INTRODUCCION.md) y sigue la [guía de instalación paso a paso](./INSTALACION.md).

## Cómo estudiar esta ruta

Estudia los archivos `Tema01` a `Tema30` en orden. Puedes compilar y ejecutar cada archivo directamente con Java moderno desde la terminal:

```bash
java java/Tema01Variables.java
```

Cada archivo contiene **6 secciones pedagógicas** (Modelo mental en la JVM, Casos de uso reales, Sintaxis rápida, Ejemplo práctico con salida esperada, Buenas prácticas / *Effective Java* y **10 ejercicios progresivos** divididos en `[Básico]`, `[Intermedio]` y `[Senior / Producción]`).

## Plan de Estudios (30 Temas)

### Fase 1: Fundamentos y Control de Flujo
1. `Tema01Variables.java` — Variables, tipos primitivos vs referencias y modelo de memoria (Stack/Heap)
2. `Tema02Constantes.java` — Constantes (`final`, `static final`) e inmutabilidad
3. `Tema03EntradaSalida.java` — Entrada con `Scanner`, salida formateada (`printf`) y buffers
4. `Tema04ConversionValidacion.java` — Casting seguro, parseo y validación defensiva de datos
5. `Tema05OperadoresAritmeticos.java` — Operadores numéricos, `Math`, overflow y `BigDecimal`
6. `Tema06AsignacionUnarios.java` — Asignación compuesta, pre/post incremento y acumuladores
7. `Tema07ComparacionLogicos.java` — Comparación estricta, `.equals()`, álgebra booleana y cortocircuito
8. `Tema08BitwiseTernarioPrecedencia.java` — Operadores bit a bit, ternario y precedencia
9. `Tema09Condicionales.java` — `if/else`, cláusulas de guarda (*Guard Clauses*) y `switch` moderno (`->`)
10. `Tema10Bucles.java` — `for`, `while`, `for-each`, control de flujo e invariantes

### Fase 2: Estructuras de Datos, Funciones y Modularidad
11. `Tema11Cadenas.java` — `String`, String Pool, inmutabilidad y `StringBuilder`
12. `Tema12Arreglos.java` — Arreglos estáticos, matrices y utilidades `java.util.Arrays`
13. `Tema13Colecciones.java` — `List`, `Set`, `Map` ($O(1)$), `equals`/`hashCode` y colecciones inmutables
14. `Tema14Funciones.java` — Diseño de métodos, sobrecarga, varargs y paso por valor en la JVM
15. `Tema15AmbitoVariables.java` — Alcance léxico (*scope*), ciclo de vida, *shadowing* y *effectively final*
16. `Tema16Recursion.java` — Recursión, pila de llamadas (*Call Stack*), casos base y memoización
17. `Tema17Excepciones.java` — Jerarquía `Throwable`, excepciones de dominio, `try-with-resources` y encadenamiento
18. `Tema18Archivos.java` — Procesamiento seguro de archivos con Java NIO.2 (`Path`, `Files`, streaming)
19. `Tema19Modulos.java` — Paquetes, visibilidad (*package-private*), clases utilitarias y modularidad JPMS

### Fase 3: POO, Calidad y Algoritmia Clásica
20. `Tema20ProgramacionObjetos.java` — Clases, encapsulación, invariantes de dominio y `record` (Java 16+)
21. `Tema21HerenciaPolimorfismo.java` — Interfaces, polimorfismo, composición y `sealed classes` (Java 17+)
22. `Tema22PruebasDepurar.java` — Pruebas automatizadas (patrón AAA), aserciones, TDD y depuración científica
23. `Tema23AlgoritmosBusquedaOrdenamiento.java` — Búsqueda binaria sin overflow, `Comparator` y TimSort
24. `Tema24EstructurasDatos.java` — Pilas LIFO (`ArrayDeque`), Colas FIFO y Colas de Prioridad (`PriorityQueue`)

### Fase 4: Ingeniería de Software Avanzada (Nivel Senior)
25. `Tema25ProgramacionFuncional.java` — Interfaces funcionales, Lambdas, `Stream` API, `Collectors`, `Optional` y Genéricos
26. `Tema26AsincroniaConcurrencia.java` — Concurrencia segura (`AtomicInteger`, `ConcurrentHashMap`), `ExecutorService` y `CompletableFuture`
27. `Tema27RegexFechasJson.java` — Regex precompiladas (`Pattern`), fechas ISO-8601/UTC (`java.time`) y serialización JSON segura
28. `Tema28ComplejidadOptimizacion.java` — Complejidad Big-O, indexación en memoria, *Sliding Window* y caché LRU
29. `Tema29CleanCodeSolidPatrones.java` — Clean Code, Principios SOLID y Patrones de Diseño (Strategy, Factory, Observer, Decorator)
30. `Tema30SeguridadArquitecturaProyecto.java` — Seguridad OWASP, criptografía (`SecureRandom`, `MessageDigest`), Arquitectura en Capas y **Proyecto Integrador Final**
