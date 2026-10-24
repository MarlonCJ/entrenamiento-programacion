/*
================================================================================
TEMA 07: OPERADORES ARITMÉTICOS Y COLUMNAS CALCULADAS EN CONSULTAS
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
SQL permite realizar cálculos matemáticos directamente en el motor de base de
datos al proyectar columnas (`SELECT`) o al filtrar filas (`WHERE`). A estas
expresiones las llamamos COLUMNAS CALCULADAS o DERIVADAS.

Principio de normalización (3NF):
En una base de datos bien diseñada NO guardamos datos que puedan calcularse con
exactitud a partir de otras columnas de la misma fila (por ejemplo, en
`detalle_pedido` guardamos `cantidad` y `precio_unitario`, pero calculamos el
`subtotal` al vuelo como `cantidad * precio_unitario`). Así evitamos que alguien
actualice la cantidad y olvide actualizar el subtotal, manteniendo una única
fuente de verdad (Single Source of Truth).

Operadores aritméticos estándar:
  - `+` : Suma
  - `-` : Resta (o negación unaria)
  - `*` : Multiplicación
  - `/` : División (¡Atención a la división entera entre tipos `INTEGER`!)
  - `%` : Módulo (resto de una división entera)

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Facturación y E-Commerce: Calcular subtotales (`cantidad * precio_unitario`),
    aplicar descuentos porcentuales (`precio * 0.85`), o desglosar impuestos como
    el IVA (`ROUND(precio * 0.19, 2)`).
  - Valoración de Inventario en Almacén: Calcular el capital inmovilizado por
    producto (`precio * existencias AS valor_inventario`) o filtrar productos cuyo
    valor en bodega supere cierto umbral.
  - Recursos Humanos y Nómina: Proyectar el salario anual (`salario * 12`), el
    costo empresa tras cargas prestacionales o simulaciones de aumento salarial.
  - Conversión de Unidades: Transformar horas a minutos (`duracion * 60`),
    dólares a centavos o porcentajes a proporciones sobre 1.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Cálculos financieros con alias y redondeo a 2 decimales
SELECT
    nombre,
    precio                               AS precio_base,
    ROUND(precio * 0.19, 2)              AS iva_19,
    ROUND(precio * 1.19, 2)              AS precio_final_con_iva
FROM productos;

-- B) Precedencia de operadores con paréntesis (Multiplicación/División antes que Suma/Resta)
SELECT
    pedido_id,
    producto_id,
    cantidad * precio_unitario           AS subtotal_bruto,
    (cantidad * precio_unitario) - 1.00  AS subtotal_con_bono
FROM detalle_pedido;

-- C) Trampa de la división entera vs división decimal en SQLite
SELECT
    7 / 2       AS div_entera,           -- Devuelve 3 (ambos operandos son INTEGER)
    7 * 1.0 / 2 AS div_decimal,          -- Devuelve 3.5 (al multiplicar por 1.0 pasa a REAL)
    7 % 2       AS resto_modulo;         -- Devuelve 1

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: El equipo financiero requiere un desglose de las líneas de
`detalle_pedido` mostrando la cantidad, el precio unitario, el subtotal bruto,
el impuesto estimado del 19% y el total de la línea redondeado a 2 decimales.
*/
-- SELECT
--     pedido_id,
--     producto_id,
--     cantidad,
--     precio_unitario,
--     ROUND(cantidad * precio_unitario, 2)        AS subtotal,
--     ROUND(cantidad * precio_unitario * 0.19, 2) AS impuesto_iva,
--     ROUND(cantidad * precio_unitario * 1.19, 2) AS total_linea
-- FROM detalle_pedido;
/*
Resultado esperado:
+-----------+-------------+----------+-----------------+----------+--------------+-------------+
| pedido_id | producto_id | cantidad | precio_unitario | subtotal | impuesto_iva | total_linea |
+-----------+-------------+----------+-----------------+----------+--------------+-------------+
| 1         | 1           | 1        | 4.5             | 4.5      | 0.86         | 5.36        |
| 1         | 2           | 4        | 1.375           | 5.5      | 1.05         | 6.55        |
| 2         | 3           | 1        | 18.0            | 18.0     | 3.42         | 21.42       |
| 3         | 4           | 1        | 25.5            | 25.5     | 4.85         | 30.35       |
+-----------+-------------+----------+-----------------+----------+--------------+-------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - GOTCHA #1 (LA DIVISIÓN ENTERA SILENCIOSA): En SQLite (y PostgreSQL/SQL Server),
    dividir `INTEGER / INTEGER` trunca la parte decimal: `duracion / 60` para un
    curso de `30` horas daría `0` en lugar de `0.5`. Solución profesional:
    multiplica por `1.0` (`duracion * 1.0 / 60`) o usa `CAST(duracion AS REAL) / 60`.
  - GOTCHA #2 (DIVISIÓN ENTRE CERO): En SQLite, `10 / 0` no lanza una excepción
    sino que devuelve `NULL`. En PostgreSQL o SQL Server lanza un error que aborta
    la consulta. Para código portable y seguro, usa ` precio / NULLIF(existencias, 0)`.
  - GOTCHA #3 (OPERACIONES CON `NULL`): Cualquier operación aritmética donde
    intervenga `NULL` (`100 + NULL` o `precio * NULL`) da como resultado `NULL`.
  - NO PUEDES USAR UN ALIAS DEL `SELECT` DENTRO DEL `WHERE` DE LA MISMA CONSULTA:
    Porque `WHERE` se evalúa ANTES que `SELECT`. Repite la expresión en el `WHERE`
    o usa una CTE / subconsulta.

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Consulta `detalle_pedido` mostrando `pedido_id`, `producto_id`, `cantidad`,
   `precio_unitario` y calcula `cantidad * precio_unitario AS subtotal`.
2. Consulta `productos` mostrando `nombre`, `precio` y calcula el precio con un
   15% de descuento (`ROUND(precio * 0.85, 2) AS precio_descuento`).
3. Consulta la tabla `cursos` mostrando `nombre`, `duracion` (en horas) y calcula
   la duración equivalente en minutos (`duracion * 60 AS duracion_minutos`).

[Intermedio]
4. Calcula el valor total del inventario por cada producto en `productos`
   (`precio * existencias AS valor_bodega`) y filtra con `WHERE` solo aquellos
   productos cuyo valor en bodega supere los `$50.00`.
5. Consulta `empleados` mostrando `nombre`, `salario` mensual, el salario anual
   (`salario * 12 AS salario_anual`) y cuánto quedaría su salario mensual tras
   un aumento del 8.5% (`ROUND(salario * 1.085, 2) AS nuevo_salario`).
6. Demuestra el problema de la división entera sobre la tabla `cursos`: proyecta
   `nombre`, `duracion`, `duracion / 40 AS semanas_enteras` y
   `ROUND(duracion * 1.0 / 40, 2) AS semanas_exactas`.
7. Consulta `resultados` mostrando `estudiante_id`, `curso_id`, `nota` (sobre 100)
   y transforma la nota a una escala de 0.0 a 5.0 (`ROUND(nota * 5.0 / 100, 2) AS nota_escala_5`).

[Senior / Producción]
8. En `productos`, el artículo `'Teclado'` tiene `existencias = 0`. Escribe una
   consulta que divida `precio / existencias` y explica por qué devuelve `NULL` en
   SQLite. Luego escribe la versión ultra-segura para cualquier motor SQL usando
   `NULLIF(existencias, 0)`.
9. Utiliza el operador módulo (`%`) sobre `productos` para mostrar `id`, `nombre`,
   `existencias`, cuántas cajas completas de 6 unidades se pueden armar
   (`existencias / 6 AS cajas_de_6`) y cuántas unidades sueltas sobran
   (`existencias % 6 AS unidades_sueltas`).
10. Construye una simulación financiera completa sobre `pedidos` que muestre `id`,
    `estado`, `total` (bruto), `ROUND(total / 1.19, 2) AS base_gravable_sin_iva`,
    `ROUND(total - (total / 1.19), 2) AS iva_incluido` y la comisión de la pasarela
    de pagos (`ROUND(total * 0.029 + 0.30, 2) AS comision_stripe`).
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
