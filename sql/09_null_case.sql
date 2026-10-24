/*
================================================================================
TEMA 09: MANEJO DE NULOS (NULL, IS NULL, COALESCE, NULLIF) Y EXPRESIONES CASE
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Este tema cubre dos de las herramientas más poderosas para escribir consultas
resilientes y expresivas en producción:

A) El verdadero significado de `NULL`:
   `NULL` NO es el número `0`, NO es una cadena vacía `''` y NO es `false`.
   `NULL` es un marcador especial que significa "valor ausente, desconocido o no
   aplicable". Como no es un valor concreto, no puede igualarse con `=` ni
   desigualarse con `!=`. Cualquier comparación directa con `NULL` devuelve
   `UNKNOWN`.

B) Expresiones condicionales con `CASE`:
   `CASE WHEN ... THEN ... ELSE ... END` es el equivalente a `if / else if / else`
   o al operador `switch` dentro de SQL. Permite transformar códigos crudos en
   etiquetas de negocio, clasificar rangos dinámicamente y crear reportes
   avanzados (incluso tablas dinámicas o *pivots*) sin necesidad de post-procesar
   datos en el backend.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Limpieza de Datos para UI/Reportes (`COALESCE`): Cuando un cliente no tiene
    teléfono o correo (`NULL`) y quieres mostrar `'No registrado'` en el reporte
    en lugar de enviar `null` o romper una concatenación de textos.
  - Clasificación Dinámica de Negocio (`CASE`): Categorizar productos como
    `'Agotado'`, `'Stock Crítico'` o `'Disponible'` según sus existencias; o
    clasificar notas de estudiantes en `'Reprobado'`, `'Aprobado'` y `'Excelente'`.
  - Prevención de División por Cero (`NULLIF`): `NULLIF(divisor, 0)` convierte el
    `0` en `NULL` para que la división devuelva `NULL` de forma limpia sin estallar.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Filtrar valores ausentes o presentes con IS NULL / IS NOT NULL
SELECT id, nombre, correo, telefono
FROM clientes
WHERE telefono IS NULL OR correo IS NULL;

-- B) Sustituir NULL por el primer valor no nulo disponible con COALESCE()
--    (IFNULL(a, b) es equivalente para 2 argumentos en SQLite, pero COALESCE es estándar ISO)
SELECT
    nombre,
    COALESCE(correo, telefono, 'Sin medio de contacto') AS contacto_principal
FROM clientes;

-- C) Expresión CASE buscada (Searched CASE - la más flexible y usada)
SELECT
    nombre,
    existencias,
    CASE
        WHEN existencias = 0 THEN 'Agotado'
        WHEN existencias < 10 THEN 'Stock Bajo (Reabastecer)'
        ELSE 'Stock Saludable'
    END AS estado_inventario
FROM productos;

-- D) NULLIF(val1, val2): Devuelve NULL si val1 = val2; si no, devuelve val1
SELECT NULLIF(existencias, 0) FROM productos;

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: El equipo de Atención al Cliente necesita un directorio de
todos los clientes que muestre su medio de contacto preferido (correo, o si no
tiene correo su teléfono, o `'Sin datos'`) y una etiqueta del estado de su perfil.
*/
-- SELECT
--     id,
--     nombre || ' ' || apellido AS cliente,
--     COALESCE(correo, 'Sin correo') AS correo_mostrar,
--     COALESCE(telefono, 'Sin telefono') AS telefono_mostrar,
--     COALESCE(correo, telefono, 'Incontactable') AS contacto_prioritario,
--     CASE
--         WHEN correo IS NOT NULL AND telefono IS NOT NULL THEN 'Perfil Completo'
--         WHEN correo IS NOT NULL OR telefono IS NOT NULL  THEN 'Perfil Parcial'
--         ELSE 'Perfil Incompleto'
--     END AS estado_perfil
-- FROM clientes;
/*
Resultado esperado:
+----+------------+-------------------+------------------+----------------------+----------------+
| id | cliente    | correo_mostrar    | telefono_mostrar | contacto_prioritario | estado_perfil  |
+----+------------+-------------------+------------------+----------------------+----------------+
| 1  | Ana Perez  | ana@example.test  | 5550101          | ana@example.test     | Perfil Completo|
| 2  | Luis Gomez | luis@example.test | Sin telefono     | luis@example.test    | Perfil Parcial |
| 3  | Mia Torres | Sin correo        | 5550103          | 5550103              | Perfil Parcial |
+----+------------+-------------------+------------------+----------------------+----------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - GOTCHA EN CONCATENACIÓN DE TEXTOS (`||`): En SQL (`||`), concatenar cualquier
    texto con `NULL` convierte TODO el texto en `NULL` (`'Hola ' || NULL` -> `NULL`).
    Si concatenas `'Correo: ' || correo` para Mia Torres, obtendrás `NULL`.
    Envuelve siempre las columnas anulables con `COALESCE(correo, 'N/A')`.
  - ORDEN DE EVALUACIÓN EN `CASE` (Cortocircuito): `CASE` evalúa las cláusulas
    `WHEN` de arriba hacia abajo y se detiene en la PRIMERA que sea verdadera.
    Si pones `WHEN nota >= 60 THEN 'Aprobado'` arriba y `WHEN nota >= 90 THEN 'Honor'`
    abajo, ¡una nota de `95` caerá en `'Aprobado'` y jamás llegará a `'Honor'`!
    Ordena las condiciones desde la más específica/estricta hasta la más general.
  - NO OLVIDES EL `ELSE` EN `CASE`: Si omites la cláusula `ELSE` y ninguna
    condición `WHEN` se cumple, el `CASE` devuelve `NULL` silenciosamente.

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Consulta `clientes` para encontrar quiénes no tienen teléfono registrado
   (`WHERE telefono IS NULL`) y haz otra consulta para quiénes no tienen correo.
2. Proyecta `id`, `nombre`, `apellido` y usa `COALESCE` para mostrar `'Correo pendiente'`
   cuando `correo` sea `NULL` y `'Telefono pendiente'` cuando `telefono` sea `NULL`.
3. Usa `CASE` sobre la tabla `productos` para proyectar `nombre`, `activo` y una
   columna `estado_catalogo` que diga `'Publicado'` cuando `activo = 1` y
   `'Oculto'` cuando `activo = 0`.

[Intermedio]
4. Clasifica las calificaciones de la tabla `resultados` usando `CASE` en:
   `'Sobresaliente'` (`nota >= 90`), `'Aprobado'` (`nota >= 70`),
   `'Reprobado'` (`nota < 70`) y `'Sin calificar'` (`ELSE`).
5. Clasifica los productos por rango de precio usando `CASE`: `'Economico'` (`precio < 5`),
   `'Estandar'` (`precio BETWEEN 5 AND 20`) y `'Premium'` (`precio > 20`).
6. En `productos`, calcula un precio promocional diferenciado por categoría usando
   `CASE`: si `categoria_id = 1` aplica 10% de descuento (`precio * 0.90`), si
   `categoria_id = 2` aplica 5% (`precio * 0.95`), y en cualquier otro caso deja
   el `precio` intacto.
7. Demuestra qué pasa al concatenar `nombre || ' - ' || correo` en `clientes` sin
   `COALESCE` frente a concatenar `nombre || ' - ' || COALESCE(correo, 'Sin correo')`.

[Senior / Producción]
8. Demuestra el error de orden de evaluación en `CASE`: escribe una consulta sobre
   `resultados` con las condiciones `WHEN` mal ordenadas (`nota >= 60` antes de
   `nota >= 90`) y al lado otra columna con el `CASE` ordenado correctamente de
   mayor a menor para comparar el impacto.
9. Usa `NULLIF` combinado con `COALESCE`: imagina que de un formulario web llegan
   cadenas vacías `''` en vez de `NULL`. Demuestra en un `SELECT` cómo la expresión
   `COALESCE(NULLIF('', ''), 'Valor por defecto')` limpia tanto `NULL` como strings
   vacíos `''` en un solo paso.
10. Adelanto de SQL Analítico (Conditional Aggregation): Combina `CASE` dentro de
    una suma o conteo sobre `pedidos` o proyéctalo fila por fila para crear 3
    columnas bandera (`es_pagado`, `es_pendiente`, `es_cancelado`) que valgan `1`
    o `0` según el `estado` de cada pedido.
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
