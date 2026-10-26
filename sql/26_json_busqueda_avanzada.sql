/*
================================================================================
TEMA 26: FUNCIONES JSON EN SQL Y BÚSQUEDA AVANZADA (ESQUEMAS HÍBRIDOS)
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Los motores relacionales modernos (SQLite con la extensión nativa JSON1 integrada,
PostgreSQL con `JSONB`, MySQL y SQL Server) permiten combinar lo mejor del mundo
relacional (integridad ACID, claves foráneas, joins) con la flexibilidad de los
documentos semiestructurados JSON.

Modelo mental del Diseño Híbrido:
- Las entidades centrales del negocio (`clientes`, `pedidos`, `productos`, `precios`,
  `estados`) SIEMPRE deben ser columnas relacionales tipadas y con restricciones.
- Los atributos dinámicos, metadatos variables por categoría (ej. especificaciones
  técnicas de un teclado frente a las de un libro), payloads de webhooks externos
  o preferencias de usuario se almacenan en una columna `TEXT` validada con
  `CHECK (json_valid(metadatos))`.
- Funciones clave en SQLite / SQL moderno:
  - `json_valid(col)`: Devuelve `1` si el texto es JSON válido, `0` si no lo es.
  - `json_extract(col, '$.ruta')` o el operador `->` y `->>`: Extraen valores
    por ruta JSONPath (`$.marca`, `$.dimensiones.peso`, `$.tags[0]`).
  - `json_object('k1', v1, ...)` y `json_array(...)`: Construyen JSON desde filas
    relacionales directamente en la consulta para enviarlos listos a una API REST.
  - `json_group_array(...)` y `json_group_object(...)`: Agregan múltiples filas
    hijas en un arreglo u objeto JSON anidado sin sufrir el problema N+1.
  - `json_each(col)`: Función de tabla (*table-valued function*) que "desempaca"
    un arreglo u objeto JSON convirtiendo cada elemento en una fila consultable.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Catálogos E-Commerce Polimórficos (Atributos Variables): Un producto tipo
    `'Libro'` tiene `{"isbn": "978-3", "paginas": 320}` y un `'Teclado'` tiene
    `{"switch": "mecanico", "idioma": "ES"}`, sin crear 50 columnas `NULL`.
  - Respuestas API Directas desde el Motor: Construir un objeto JSON de pedido
    que incluya un arreglo anidado `items` con todas sus líneas en una sola
    consulta SQL usando `json_object` + `json_group_array`.
  - Auditoría de Eventos (Event Sourcing / Webhooks): Guardar el payload crudo
    recibido de Stripe/PayPal y consultar campos específicos indexados.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Crear tabla con validación estricta de JSON
CREATE TEMP TABLE catalogo_especificaciones (
    producto_id INTEGER PRIMARY KEY,
    atributos TEXT NOT NULL CHECK (json_valid(atributos) = 1)
);

-- B) Extraer valores escalares de un documento JSON
--    json_extract devuelve el valor SQL nativo (texto sin comillas, número, etc.)
SELECT
    json_extract('{"marca":"Logi","garantia_meses":24,"tags":["usb","rgb"]}', '$.marca') AS marca,
    json_extract('{"marca":"Logi","garantia_meses":24,"tags":["usb","rgb"]}', '$.garantia_meses') AS garantia,
    json_extract('{"marca":"Logi","garantia_meses":24,"tags":["usb","rgb"]}', '$.tags[0]') AS primer_tag;

-- C) Construir documentos JSON desde tablas relacionales
SELECT json_object(
    'id', p.id,
    'nombre', p.nombre,
    'precio', p.precio,
    'disponible', CASE WHEN p.existencias > 0 THEN json('true') ELSE json('false') END
) AS producto_json
FROM productos AS p;

-- D) Desempacar arreglos JSON en filas relacionales con json_each()
SELECT value AS etiqueta
FROM json_each('["sql", "backend", "arquitectura", "performance"]');

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: El backend necesita un endpoint `/api/pedidos` que devuelva
cada pedido como un documento JSON completo con los datos del cliente y el
arreglo anidado `items` con el detalle de los productos comprados, resuelto en
una sola consulta SQL sin problema de N+1 queries.
*/
-- SELECT
--     p.id AS pedido_id,
--     json_object(
--         'pedido_id', p.id,
--         'fecha', p.fecha,
--         'estado', p.estado,
--         'cliente', c.nombre || ' ' || c.apellido,
--         'total', p.total,
--         'items', json(COALESCE((
--             SELECT json_group_array(
--                 json_object(
--                     'producto', pr.nombre,
--                     'cantidad', dp.cantidad,
--                     'precio_unitario', dp.precio_unitario,
--                     'subtotal', ROUND(dp.cantidad * dp.precio_unitario, 2)
--                 )
--             )
--             FROM detalle_pedido AS dp
--             INNER JOIN productos AS pr ON pr.id = dp.producto_id
--             WHERE dp.pedido_id = p.id
--         ), '[]'))
--     ) AS payload_api
-- FROM pedidos AS p
-- INNER JOIN clientes AS c ON c.id = p.cliente_id
-- ORDER BY p.id ASC;
/*
Resultado esperado (fila 1):
pedido_id: 1
payload_api: {"pedido_id":1,"fecha":"2026-01-15","estado":"pagado","cliente":"Ana Perez","total":10.0,"items":[{"producto":"Cuaderno","cantidad":1,"precio_unitario":4.5,"subtotal":4.5},{"producto":"Lapiz","cantidad":4,"precio_unitario":1.375,"subtotal":5.5}]}

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - ANTIPATRÓN "JSON COMO BOTE DE BASURA": Nunca guardes claves foráneas
    (`cliente_id`), montos financieros (`total`, `precio`) ni estados críticos
    de flujo (`estado`) únicamente dentro de un JSON si necesitas integrarlos
    con `FOREIGN KEY` o sumarlos constantemente.
  - SIEMPRE VALIDA CON `CHECK (json_valid(col))`: Sin esta restricción, un bug
    en la aplicación puede insertar texto truncado o malformado y hacer fallar
    todas las consultas de lectura posteriores.
  - ÍNDICES SOBRE EXPRESIONES JSON: Filtrar con `WHERE json_extract(meta, '$.marca') = 'Sony'`
    hace un *Full Table Scan* a menos que crees un índice funcional (Index on
    Expression):
    `CREATE INDEX idx_meta_marca ON tabla(json_extract(meta, '$.marca'));`

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Usa `SELECT json_object(...)` sobre la tabla `clientes` para proyectar cada
   cliente como un objeto JSON con las claves `'id'`, `'nombre_completo'` y
   `'ciudad'`.
2. Prueba `json_valid`: escribe un `SELECT` que evalúe `json_valid('{"a": 1}')`
   y `json_valid('{invalido}')` para comprobar cómo responde el motor.
3. Dado el literal JSON `'{"moneda":"USD","impuesto":0.19,"envio":{"tipo":"express","costo":5.50}}'`,
   extrae con `json_extract` la moneda, el impuesto y el costo de envío.

[Intermedio]
4. Crea una tabla temporal `productos_meta` con `(producto_id INT PRIMARY KEY, ficha_tecnica TEXT CHECK (json_valid(ficha_tecnica)))`,
   inserta metadatos JSON para 3 productos (incluyendo `"marca"`, `"peso_gramos"`
   y un arreglo `"etiquetas"`) y consulta solo los que pesen más de 100 gramos.
5. Usa `json_set` o `json_replace` para actualizar únicamente la propiedad
   `$.garantia_meses` dentro del JSON de `productos_meta` sin reescribir maualmente
   todo el texto JSON desde cero.
6. Agrupa los productos por `categoria_id` y usa `json_group_array(nombre)` para
   obtener una sola fila por categoría con el arreglo JSON de los nombres de sus
   productos.
7. Usa `json_each` junto con la tabla `productos_meta` para desempacar el arreglo
   `$.etiquetas` de cada producto y contar cuántos productos tienen cada etiqueta.

[Senior / Producción]
8. Índice sobre expresión JSON (*Functional Index*): Crea un índice sobre
   `productos_meta(json_extract(ficha_tecnica, '$.marca'))` y verifica con
   `EXPLAIN QUERY PLAN` que una búsqueda `WHERE json_extract(ficha_tecnica, '$.marca') = ...`
   utiliza el índice (`SEARCH ... USING INDEX`).
9. Búsqueda avanzada multicriterio (Buscador de Catálogo): Escribe una consulta
   parametrizable sobre `productos` y `categorias` que permita filtrar de forma
   combinada por término de texto (`nombre LIKE '%...%' OR descripcion LIKE '%...%'`),
   rango de precios opcional y estado activo, ordenando por relevancia (primero
   coincidencia exacta o en nombre, luego en descripción).
10. Reporte jerárquico completo en JSON: Genera un único arreglo JSON por cada
    departamento de la empresa (`departamentos`) que incluya el nombre del
    departamento, la masa salarial total y un sub-arreglo `empleados` ordenado
    por salario descendente.
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
