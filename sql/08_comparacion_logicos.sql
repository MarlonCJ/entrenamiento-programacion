/*
================================================================================
TEMA 08: OPERADORES DE COMPARACIÓN, LÓGICOS Y PRECEDENCIA BOOLEANA
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Los operadores de comparación y los conectores lógicos (`AND`, `OR`, `NOT`) son
el motor de decisiones de cualquier consulta SQL. Permiten combinar múltiples
reglas de negocio para aislar con precisión quirúrgica los datos requeridos.

Dos conceptos críticos que todo desarrollador debe dominar:
  1. Jerarquía de Precedencia de Operadores Lógicos:
     En SQL, al igual que la multiplicación se evalúa antes que la suma en
     aritmética, los operadores lógicos tienen un orden estricto de evaluación:
       1º `NOT` (Mayor precedencia)
       2º `AND`
       3º `OR`  (Menor precedencia)
     Por lo tanto, `A OR B AND C` siempre es interpretado por el motor como
     `A OR (B AND C)`, ¡NUNCA como `(A OR B) AND C`!

  2. Lógica de Tres Valores (Three-Valued Logic - 3VL):
     En programación tradicional un booleano solo es `TRUE` o `FALSE`. En SQL
     existe un tercer estado: `UNKNOWN` (producido cuando comparas cualquier
     cosa con `NULL` usando `=`, `!=`, `<`, `>`). En un `WHERE`, solo las filas
     que evalúan a `TRUE` sobreviven; tanto `FALSE` como `UNKNOWN` se descartan.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Reglas de Negocio Compuestas en E-Commerce: Mostrar en la tienda solo
    productos que estén activos (`activo = 1`), tengan stock (`existencias > 0`)
    y sean económicos o pertenezcan a una categoría en oferta.
  - Auditoría de Riesgo y Fraude: Detectar pedidos con montos altos (`total >= 20`)
    que sigan en estado `'pendiente'` o `'cancelado'` desde cierta fecha.
  - Comparación Segura ante Nulos (`IS` / `IS NOT`): En SQLite (y estándar SQL
    `IS NOT DISTINCT FROM`), comparar si dos valores son distintos incluso cuando
    uno de ellos es `NULL`.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Operadores de comparación relacional
--    =  (igual)           != o <> (diferente, preferir <> por estándar ISO)
--    <  (menor que)       <=      (menor o igual que)
--    >  (mayor que)       >=      (mayor o igual que)

-- B) Combinación correcta con paréntesis explícitos (AND + OR)
SELECT id, nombre, precio, categoria_id, existencias
FROM productos
WHERE activo = 1
  AND existencias > 0
  AND (categoria_id = 1 OR precio <= 5.00);

-- C) Tablas de verdad en Lógica de 3 Valores (3VL con NULL = UNKNOWN)
--    TRUE  AND UNKNOWN  --> UNKNOWN (se descarta en WHERE)
--    FALSE AND UNKNOWN  --> FALSE   (se descarta en WHERE)
--    TRUE  OR  UNKNOWN  --> TRUE    (¡Pasa el filtro WHERE!)
--    NOT UNKNOWN        --> UNKNOWN (se descarta en WHERE)

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: Queremos encontrar los productos disponibles (`activo = 1` y
`existencias > 0`) que pertenezcan a la categoría `1` (Libros) O que cuesten
menos de `$2.00`. Compararemos qué pasa si usamos paréntesis vs si los olvidamos.
*/
-- Consulta CORRECTA con paréntesis:
-- SELECT id, nombre, precio, existencias, categoria_id, activo
-- FROM productos
-- WHERE activo = 1
--   AND existencias > 0
--   AND (categoria_id = 1 OR precio < 2.00);
/*
Resultado esperado:
+----+------------------------+--------+-------------+--------------+--------+
| id | nombre                 | precio | existencias | categoria_id | activo |
+----+------------------------+--------+-------------+--------------+--------+
| 2  | Lapiz                  | 1.25   | 100         | 2            | 1      |
| 3  | SQL para principiantes | 18.0   | 8           | 1            | 1      |
+----+------------------------+--------+-------------+--------------+--------+
¿Qué pasaría si quitaras los paréntesis?:
`WHERE activo = 1 AND existencias > 0 AND categoria_id = 1 OR precio < 2.00`
El motor evaluaría `(activo = 1 AND existencias > 0 AND categoria_id = 1) OR (precio < 2.00)`.
Si existiera un producto INACTIVO (`activo = 0`) y SIN STOCK (`existencias = 0`)
con `precio = 1.00`, ¡se colaría en la tienda por culpa del `OR` suelto!

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - REGLA DE ORO DE LOS PARÉNTESIS: Siempre que mezcles `AND` y `OR` en la misma
    cláusula `WHERE`, envuelve la expresión `OR` entre paréntesis `(...)`. No
    confíes en recordar la precedencia ni obligues a otro desarrollador a adivinarla.
  - GOTCHA DE `!=` CON `NULL`: Si `clientes` tiene 3 filas (Ana en `'Bogota'`,
    Luis en `'Cali'` y un cliente con `ciudad = NULL`), la consulta
    `SELECT * FROM clientes WHERE ciudad != 'Bogota'` devolverá SOLO a Luis (`'Cali'`),
    ¡ignorando al cliente con `NULL`! Porque `NULL != 'Bogota'` evalúa a `UNKNOWN`.
    Para incluir los `NULL`, debes escribir `WHERE ciudad != 'Bogota' OR ciudad IS NULL`
    (o en SQLite `WHERE ciudad IS NOT 'Bogota'`).
  - LEYES DE DE MORGAN EN SQL:
      * `NOT (A AND B)` equivale a `(NOT A) OR (NOT B)`
      * `NOT (A OR B)`  equivale a `(NOT A) AND (NOT B)`
    Escribir `WHERE estado != 'cancelado' AND estado != 'pendiente'` es un error
    frecuente cuando se piensa "no quiero cancelados o pendientes" y se escribe
    por accidente `OR` en vez de `AND`.

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Filtra los productos que tengan `precio > 4.00` Y `existencias >= 10` usando `AND`.
2. Consulta los empleados que trabajen en el departamento `1` O que tengan un
   `salario >= 3000` usando `OR`.
3. Lista los pedidos cuyo `estado` sea distinto de `'cancelado'` usando el operador
   estándar `<>` y cuyo `total` sea mayor o igual a `10.00`.

[Intermedio]
4. Consulta los clientes que vivan en `'Bogota'` Y que tengan `telefono` o `correo`
   registrado (usa paréntesis adecuadamente junto con `IS NOT NULL`).
5. Encuentra las calificaciones en `resultados` que estén aprobadas (`nota >= 70`)
   para el curso `1`, O que sean sobresalientes (`nota >= 90`) en cualquier curso.
6. Demuestra con dos consultas sobre `productos` cómo cambia el resultado de:
   a) `WHERE categoria_id = 2 AND (precio > 10 OR existencias >= 50)`
   b) `WHERE categoria_id = 2 AND precio > 10 OR existencias >= 50`
   Explica en un comentario por qué difieren.
7. Filtra los empleados contratados a partir del `'2022-01-01'` (`fecha_contratacion >= '2022-01-01'`)
   cuyo salario no supere los `3300`.

[Senior / Producción]
8. Comprueba el gotcha de la Lógica de 3 Valores (3VL) en la tabla `clientes`:
   Ejecuta `SELECT id, nombre, correo FROM clientes WHERE correo != 'ana@example.test';`.
   ¿Aparece Mia Torres (`id = 3`, cuyo correo es `NULL`)? Reescribe la consulta
   para que también incluya a los clientes sin correo usando `OR correo IS NULL` y
   luego usando el operador `IS NOT` de SQLite.
9. Aplica las Leyes de De Morgan: Reescribe la condición
   `WHERE NOT (estado = 'cancelado' OR total < 15)` sobre la tabla `pedidos` sin
   usar la palabra `NOT`, distribuyendo la negación a cada comparador, y verifica
   que ambas consultas devuelvan exactamente las mismas filas.
10. Diseña una consulta de auditoría de inventario sobre `productos` que detecte
    anomalías operativas: productos que estén marcados como activos (`activo = 1`)
    pero no tengan stock (`existencias = 0`), O productos que estén inactivos
    (`activo = 0`) pero todavía tengan stock en bodega (`existencias > 0`).
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
