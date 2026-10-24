# Guía de Excelencia para el Desarrollador de Software

Este documento es tu brújula de ingeniería. El objetivo de este repositorio no es que memorices sintaxis, sino que desarrolles el **criterio técnico, modelo mental y disciplina** que distinguen a un programador principiante de un **excelente desarrollador de software (nivel Senior)**.

---

## 1. Cómo estudiar cada tema para aprender el doble de rápido

Cada uno de los **30 archivos por lenguaje** ha sido diseñado con una estructura pedagógica de 6 capas. No vayas directo a los ejercicios sin recorrer las capas en orden:

1. **Modelo Mental (`¿Qué es y por qué importa?`)**: Entiende qué pasa en la memoria y por qué existe esa herramienta antes de escribir una sola línea.
2. **Casos del Mundo Real (`¿Cuándo usarlo?`)**: Conecta el concepto abstracto con problemas reales (pagos, inventarios, APIs, seguridad).
3. **Referencia Rápida de Sintaxis**: Tu hoja de trucos (cheat-sheet) para consultar cómo se escribe sin perder tiempo.
4. **Ejemplo Práctico Paso a Paso**: Lee el caso aplicado como si hicieras una revisión de código (*code review*). Ejecútalo o síguelo mentalmente línea por línea.
5. **Buenas Prácticas y Trampas (`Clean Code & Gotchas`)**: Aquí está la experiencia acumulada de años en producción. Aprender qué **NO** hacer te ahorrará días enteros depurando errores invisibles.
6. **10 Retos Progresivos (`Básico → Intermedio → Senior`)**:
   - **Retos 1–3 (`[Básico]`)**: Calentamiento muscular para dominar la sintaxis.
   - **Retos 4–7 (`[Intermedio]`)**: Reglas de negocio reales.
   - **Retos 8–10 (`[Senior / Producción]`)**: Casos borde, validación defensiva, rendimiento y diseño limpio.

---

## 2. El Método de 6 Pasos para Resolver Cualquier Problema

Un desarrollador promedio empieza a teclear código en el segundo 1 y se atasca en el minuto 5. Un excelente desarrollador sigue este protocolo antes y durante la codificación:

```
1. COMPRENDER  --> ¿Cuáles son exactamente las entradas, salidas y reglas?
2. CASOS BORDE --> ¿Qué pasa si llega vacío, cero, negativo, null o duplicado?
3. DISEÑAR     --> Escribe los pasos en español (pseudocódigo) en comentarios.
4. IMPLEMENTAR --> Traduce cada paso a código limpio con nombres descriptivos.
5. VERIFICAR   --> Prueba con datos normales, datos límite y datos inválidos.
6. REFACTORIZAR--> ¿Se entiende sin explicarlo? ¿Se puede hacer más simple o rápido?
```

### Ejemplo práctico del método
> **Problema:** Calcular el precio final con descuento, pero nunca permitir un total negativo.
- **Mal enfoque:** Escribir `return precio - descuento` sin validar nada.
- **Enfoque profesional:**
  1. Validar que `precio >= 0` y `descuento >= 0`.
  2. Usar `max(0, precio - descuento)` para garantizar el invariante de negocio.
  3. Nombrar las variables con intención: `precioBase`, `montoDescuento`, `totalPagar`.

---

## 3. Los 7 Pilares de un Excelente Desarrollador

### Pilar 1: Código Limpio (Clean Code)
El código se escribe una vez, pero se lee decenas de veces.
- **Nombres que revelan intención**: Usa `diasDesdeUltimaCompra` en lugar de `d` o `aux`.
- **Funciones con verbos**: `calcularImpuesto()`, `esUsuarioActivo()`, `guardarPedido()`.
- **Una sola responsabilidad**: Si tu función valida, calcula, guarda en base de datos y envía un correo, divídela en cuatro funciones pequeñas.

### Pilar 2: Inmutabilidad y Efectos Secundarios Controlados
La mayoría de los errores complejos en sistemas grandes ocurren porque una parte del código modifica un dato que otra parte no esperaba que cambiara.
- Prefiere `const` (JS/TS/PHP), `final` (Java) o tuplas/`@dataclass(frozen=True)` (Python) por defecto.
- Prefiere transformar datos creando nuevas copias (`map`, `filter`, `Stream`) en lugar de mutar colecciones existentes sin control.

### Pilar 3: Programación Defensiva (Fail Fast)
Nunca confíes en los datos que vienen del exterior (usuarios, archivos, red, bases de datos).
- Usa **cláusulas de guarda (*Guard Clauses*)** al inicio de las funciones: valida los casos inválidos primero y retorna o lanza una excepción clara antes de ejecutar la lógica principal.

### Pilar 4: Dominio de la Complejidad Algorítmica (Big-O)
Un código que funciona con 10 elementos puede colapsar el servidor con 100,000 elementos.
- **$O(1)$ Constante**: Buscar en un `Map`/`Set`/`HashMap`/`dict` o índice por clave.
- **$O(\log n)$ Logarítmica**: Búsqueda binaria o índice B-Tree en SQL.
- **$O(n)$ Lineal**: Recorrer una lista una sola vez.
- **$O(n^2)$ Cuadrática**: Bucles anidados recorriendo la misma colección (¡alerta roja en grandes volúmenes de datos!).

### Pilar 5: Manejo Profesional de Errores
- Nunca uses bloques `catch` vacíos que oculten errores silenciosamente.
- Lanza mensajes de error que expliquen **qué falló**, **por qué falló** y **con qué dato**.

### Pilar 6: Pruebas Automatizadas y Depuración Científica
- No depures adivinando y cambiando código al azar. Formula una hipótesis, inspecciona el estado de las variables y verifica dónde diverge la realidad de tu expectativa.
- Escribe pequeñas aserciones (`assert`) que comprueben automáticamente tus soluciones.

### Pilar 7: Seguridad por Diseño
- **Jamás** concatenes entradas del usuario en consultas SQL: usa siempre consultas parametrizadas (`Prepared Statements`).
- **Jamás** guardes contraseñas en texto plano ni claves secretas (`API keys`) dentro del código fuente.
- Escapa o sanitiza cualquier dato antes de mostrarlo en HTML.

---

## 4. Mapa Comparativo entre los 6 Lenguajes

Estudiar el mismo tema en varios lenguajes te da una ventaja enorme: aprendes a separar el **concepto universal de ingeniería** de la **sintaxis particular de cada herramienta**.

| Concepto | JavaScript | TypeScript | Python | PHP 8+ | Java 17/21+ | SQL (SQLite) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tipado** | Dinámico | Estático estructural | Dinámico + Type Hints | Dinámico + Estricto opcional | Estático nominal | Afinidad de tipos + `STRICT` |
| **Inmutabilidad básica** | `const`, `Object.freeze` | `const`, `readonly` | `Final`, `tuple`, `frozen=True` | `const`, `readonly` | `final`, `record`, `List.of` | Restricciones, Triggers |
| **Diccionario / Mapa $O(1)$** | `Map` / Object | `Map<K, V>` / `Record<K, V>` | `dict` | Array asociativo | `HashMap<K, V>` | Tabla con `PRIMARY KEY` / `INDEX` |
| **Conjunto único $O(1)$** | `Set` | `Set<T>` | `set` | Array por claves / `SplObjectStorage` | `HashSet<T>` | Restricción `UNIQUE` / `DISTINCT` |
| **Ausencia de valor** | `null` / `undefined` | `null` / `undefined` | `None` | `null` | `null` / `Optional<T>` | `NULL` (lógica trivalente) |
| **Transformar colecciones** | `.map()`, `.filter()` | `.map<U>()`, `.filter()` | Comprensiones `[x for x in ...]` | `array_map()`, `array_filter()` | `stream().map().filter()` | `SELECT ... FROM ... WHERE` |

---

## 5. Ruta de Entrenamiento en 4 Fases (Los 30 Temas)

### Fase 1: El Núcleo Lógico (Temas 01 al 10)
Dominarás cómo representar datos en memoria, validarlos, operar con precisión matemática/booleana y controlar el flujo de decisiones e iteraciones.

### Fase 2: Estructuras de Datos en Memoria y Modularidad (Temas 11 al 19)
Dominarás cadenas, arreglos, mapas/conjuntos, diseño de funciones reutilizables, alcance de variables, recursión, manejo de errores, archivos y organización en módulos.

### Fase 3: Arquitectura de Objetos, Algoritmos y Calidad (Temas 20 al 24)
Dominarás Programación Orientada a Objetos con encapsulación real, polimorfismo e interfaces, pruebas y depuración sistemática, algoritmos clásicos de búsqueda/ordenamiento y pilas/colas.

### Fase 4: Ingeniería de Software Avanzada — Nivel Senior (Temas 25 al 30)
Los 6 temas que transforman a un programador junior en un ingeniero completo:
- **Tema 25**: Programación Funcional, Inmutabilidad, Genéricos/Streams/Triggers.
- **Tema 26**: Asincronía, Concurrencia, Promesas/Hilos y Procesamiento Moderno.
- **Tema 27**: Expresiones Regulares, Fechas ISO-8601/Zonas Horarias y JSON/Transacciones ACID.
- **Tema 28**: Complejidad Algorítmica (Big-O) y Optimización de Rendimiento.
- **Tema 29**: Clean Code, Principios SOLID y Patrones de Diseño.
- **Tema 30**: Seguridad Aplicada, Arquitectura en Capas y **Proyecto Integrador Final**.
