/*
================================================================================
TEMA 24: SEGURIDAD (SQL INJECTION), CONSULTAS PARAMETRIZADAS Y MANTENIMIENTO
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Un desarrollador profesional no solo escribe consultas que funcionan: garantiza
que sus consultas sean **invulnerables a ataques** y que el archivo físico de la
base de datos se mantenga **íntegro, respaldado y rápido** en producción.

Dos pilares fundamentales:
1. **Inyección SQL (SQLi) y Consultas Parametrizadas**:
   La Inyección SQL ocurre cuando una aplicación concatena texto enviado por el
   usuario directamente dentro del código SQL. El atacante introduce comillas y
   comandos SQL (como `' OR '1'='1' --`) logrando alterar la estructura lógica
   del árbol sintáctico (AST) de la consulta para robar o destruir toda la base.
   - Modelo mental de **Parametrización (Prepared Statements)**: cuando usas un
     marcador de posición (`?` o `:correo`), el motor compila primero el plan
     de la consulta y luego recibe el dato del usuario en un canal separado
     exclusivamente como **valor literal**, jamás como código ejecutable.
2. **Mantenimiento Operativo en SQLite**:
   Diagnóstico de integridad física (`PRAGMA integrity_check`), compactación de
   espacio libre tras borrados (`VACUUM`), actualización de estadísticas del
   optimizador (`ANALYZE`) y configuración de durabilidad (`PRAGMA journal_mode = WAL`).

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
- **En el 100% de las consultas que reciben datos externos**: formularios de
  login, buscadores de productos, filtros por URL o APIs REST.
- **Al desplegar SQLite en producción (Web / Desktop / Mobile)**: activar el
  modo `WAL` (Write-Ahead Logging) para permitir que las lecturas no bloqueen a
  las escrituras, y activar `foreign_keys = ON`.
- **En tareas programadas de mantenimiento (Cronjobs)**: verificar que el disco
  no haya sufrido corrupción (`PRAGMA quick_check` / `integrity_check`), hacer
  copias de seguridad calientes (`VACUUM INTO`) y ejecutar `PRAGMA optimize`.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) VULNERABLE A SQL INJECTION (¡PROHIBIDO EN CUALQUIER LENGUAJE!):
-- Si input_usuario = "' OR '1'='1"
-- La consulta concatenada se convierte en:
-- SELECT * FROM clientes WHERE correo = '' OR '1'='1'; -- ¡Devuelve TODOS los clientes!

-- B) SEGURO: CONSULTAS PARAMETRIZADAS (Prepared Statements con ? o :nombre):
-- El driver envía la plantilla y los parámetros por separado:
-- Plantilla: SELECT id, nombre, correo FROM clientes WHERE correo = ? AND ciudad = ?;
-- Parámetros: ['ana@example.test', 'Bogota']

-- C) PRAGMAS DE CONFIGURACIÓN RECOMENDADOS EN PRODUCCIÓN (SQLite):
PRAGMA foreign_keys = ON;           -- Activa integridad referencial
PRAGMA busy_timeout = 5000;         -- Espera hasta 5 seg antes de fallar por bloqueo

-- D) DIAGNÓSTICO Y MANTENIMIENTO DE LA BASE DE DATOS:
PRAGMA integrity_check;             -- Devuelve 'ok' si no hay corrupción en tablas/índices
PRAGMA foreign_key_check;           -- Detecta filas huérfanas que violan claves foráneas
ANALYZE;                            -- Recopila estadísticas de distribución para el optimizador
PRAGMA optimize;                    -- Recomendado al cerrar conexiones en SQLite moderno
VACUUM;                             -- Reconstruye el archivo compacto liberando páginas vacías

4. EJEMPLO PRÁCTICO DE USO REAL (Paso a paso con resultado esperado)
--------------------------------------------------------------------------------
Escenario: Realizar una auditoría técnica de salud e integridad sobre nuestra
base de datos de práctica antes de un paso a producción.

Paso 1: Verificar integridad física y de claves foráneas:
PRAGMA integrity_check;
PRAGMA foreign_key_check;

Resultado esperado del Paso 1:
+-----------------+
| integrity_check |
+-----------------+
| ok              |
+-----------------+
(Y `foreign_key_check` devuelve 0 filas, confirmando que no existen registros huérfanos).

Paso 2: Inspeccionar métricas internas de páginas y tamaño de la base de datos:
SELECT
    (SELECT page_count FROM pragma_page_count()) AS total_paginas,
    (SELECT page_size FROM pragma_page_size()) AS bytes_por_pagina,
    (SELECT freelist_count FROM pragma_freelist_count()) AS paginas_libres_fragmentadas,
    (SELECT page_count * page_size FROM pragma_page_count(), pragma_page_size()) AS tamano_total_bytes;

Resultado esperado del Paso 2 (aproximado según índices creados):
+---------------+------------------+-----------------------------+--------------------+
| total_paginas | bytes_por_pagina | paginas_libres_fragmentadas | tamano_total_bytes |
+---------------+------------------+-----------------------------+--------------------+
| 16            | 4096             | 0                           | 65536              |
+---------------+------------------+-----------------------------+--------------------+

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
- ESCAPAR TEXTO MANUALMENTE (`replace(input, "'", "''")`) NO SUSTITUYE A LOS PARÁMETROS:
  Los filtros caseros o `regex` fallan ante codificaciones especiales o contextos
  numéricos. Usa SIEMPRE enlaces de parámetros (`?`, `$1`, `:param`) del driver.
- ¿QUÉ NO SE PUEDE PARAMETRIZAR CON `?`?:
  Los marcadores `?` solo sirven para **valores literales** (en `WHERE`, `VALUES`,
  `SET`). No puedes usar `?` para nombres de tablas ni nombres de columnas en
  `ORDER BY ?`. Para ordenar dinámicamente desde el backend, valida el nombre de
  la columna contra una **lista blanca estricta (Allowlist)** en tu código:
  `const permitidas = ['precio', 'nombre', 'fecha']`.
- VALIDACIÓN DE ENTRADA vs PARAMETRIZACIÓN:
  La parametrización evita la Inyección SQL; la validación de negocio (ej. comprobar
  que `cantidad > 0` o que el usuario autenticado es dueño del pedido que intenta
  ver - evitando vulnerabilidades IDOR) sigue siendo obligatoria.
- CUÁNDO EJECUTAR `VACUUM`:
  Cuando borras miles de filas con `DELETE`, SQLite no achica el archivo `.db`
  automáticamente (marca las páginas internas como reutilizables en el *freelist*).
  `VACUUM` reconstruye el archivo desde cero devolviendo el espacio al sistema
  operativo, pero requiere espacio libre en disco equivalente al tamaño de la base.

6. EJERCICIOS PROGRESIVOS (10 Retos: [Básico] 1-3, [Intermedio] 4-7, [Senior / Producción] 8-10)
--------------------------------------------------------------------------------
[Básico]
1. Anatomía de una Inyección SQL: Analiza en un comentario esta consulta insegura:
   ` "SELECT * FROM pedidos WHERE cliente_id = " + inputUsuario `
   Explica qué consulta exacta se ejecutaría si un atacante envía como texto
   `"1 OR 1=1"` y por qué expone los pedidos de todos los clientes.
2. Reescritura con parámetros enlazados: Toma una consulta que busca productos
   por `categoria_id` y `precio <= max_precio`, y escríbela usando marcadores
   posicionales (`?`) y marcadores nombrados (`:categoria_id`, `:max_precio`),
   documentando cómo se pasan los valores desde la capa de aplicación.
3. Chequeo de salud física: Ejecuta `PRAGMA integrity_check;` y
   `PRAGMA foreign_key_check;` sobre tu base de datos de práctica y verifica el
   resultado.

[Intermedio]
4. Inyección con `UNION` (Exfiltración de datos): Explica en un comentario cómo
   un atacante podría aprovechar un buscador de productos mal concatenado:
   `SELECT id, nombre, precio FROM productos WHERE nombre LIKE '%INPUT%'`
   inyectando `' UNION SELECT id, nombre, salario FROM empleados --` para robar
   la nómina secreta de empleados.
5. Parametrización de `LIKE`: Cuando usas consultas parametrizadas con `LIKE`,
   escribir `WHERE nombre LIKE '%?%'` NO funciona (busca literalmente el signo
   de interrogación). Escribe la forma correcta en SQLite concatenando los
   comodines al parámetro: `WHERE nombre LIKE '%' || ? || '%'`.
6. Estadísticas del optimizador con `ANALYZE`: Ejecuta el comando `ANALYZE;` y
   luego haz un `SELECT * FROM sqlite_stat1;` para observar cómo SQLite guarda
   la cantidad de filas e información de selectividad de tus tablas e índices.
7. Auditoría de espacio y páginas libres: Usando las funciones pragma
   (`pragma_page_count()`, `pragma_page_size()`, `pragma_freelist_count()`),
   escribe una consulta que calcule el tamaño actual en KB de la base de datos.

[Senior / Producción]
8. Ordenamiento dinámico seguro (Allowlist): Dado que `ORDER BY ?` no ordena por
   el nombre de columna sino por una constante literal, demuestra cómo usar una
   expresión `CASE` segura con parámetros en SQL:
   `ORDER BY CASE WHEN :orden = 'precio' THEN precio END ASC, CASE WHEN :orden = 'nombre' THEN nombre END ASC`
   Pruébalo en tu zona de trabajo.
9. Estrategia de Backup Caliente y Mantenimiento: Documenta y escribe los
   comandos SQL para un protocolo de mantenimiento nocturno en SQLite que incluya:
   verificación de integridad, actualización de estadísticas (`PRAGMA optimize;`),
   y respaldo seguro con `VACUUM INTO 'respaldo_seguro.db';`.
10. Auditoría de Seguridad y Rendimiento (Code Review): Revisa la siguiente
    consulta problemática de un sistema en producción:
    `SELECT * FROM clientes c, pedidos p WHERE LOWER(c.correo) = 'ana@example.test' AND p.estado != 'cancelado'`
    Enumera al menos 4 fallos graves (producto cartesiano accidental por falta
    de condición de `JOIN`, exposición de columnas con `SELECT *`, función `LOWER`
    que invalida el índice del correo, falta de parametrización) y escribe la
    versión corregida de nivel Senior.
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
