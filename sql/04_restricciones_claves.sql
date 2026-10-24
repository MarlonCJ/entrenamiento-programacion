/*
================================================================================
TEMA 04: RESTRICCIONES (CONSTRAINTS) E INTEGRIDAD DE CLAVES
================================================================================

1. ¿QUÉ ES Y POR QUÉ IMPORTA? (Modelo Mental en Bases de Datos)
--------------------------------------------------------------------------------
Las restricciones (`CONSTRAINTS`) son las reglas inquebrantables que el motor de
base de datos aplica antes de permitir cualquier inserción o actualización.

Un principio de arquitectura que separa a un desarrollador Junior de un Senior:
  "Las validaciones del Frontend mejoran la experiencia de usuario (UX);
   las validaciones del Backend protegen la lógica de negocio;
   pero las RESTRICCIONES de la Base de Datos son la última línea de defensa
   que garantiza que jamás entren datos corruptos al disco."

El código de una aplicación cambia, tiene bugs, sufre condiciones de carrera
(race conditions) o es evitado por scripts manuales. Si la base de datos exige
`CHECK (precio >= 0)` y `UNIQUE (correo)`, ningún bug en la aplicación podrá
crear precios negativos ni cuentas duplicadas.

Las 6 restricciones esenciales de SQL:
  1. `PRIMARY KEY` : Identifica inequívocamente cada fila (implica única y no nula).
  2. `FOREIGN KEY` : Exige que el valor exista previamente en la tabla referenciada.
  3. `NOT NULL`    : Prohíbe la ausencia de valor (`NULL`) en esa columna.
  4. `UNIQUE`      : Impide valores duplicados en la columna (o grupo de columnas).
  5. `CHECK (...)` : Evalúa una expresión booleana; si da falso, aborta la escritura.
  6. `DEFAULT val` : Asigna un valor automático cuando el `INSERT` omite la columna.

2. ¿CUÁNDO USARLO EN EL MUNDO REAL?
--------------------------------------------------------------------------------
  - Prevención de doble registro (Race Condition): Dos peticiones simultáneas
    intentan registrar `ana@example.test`. En el backend ambas pasan el `if`, pero
    la restricción `UNIQUE` en la base de datos detiene la segunda en seco.
  - Reglas de dominio financiero e inventario: `CHECK (existencias >= 0)` impide
    que una tienda venda más unidades de las que tiene en bodega (sobreventa).
  - Máquinas de estado seguras: `CHECK (estado IN ('pendiente', 'pagado', 'cancelado'))`
    emula un tipo `ENUM` evitando estados mal escritos como `'Pagadoo'` o `'pend'`.
  - Claves Primarias Compuestas: En `matriculas (estudiante_id, curso_id)`,
    `PRIMARY KEY (estudiante_id, curso_id)` impide que el mismo alumno se matricule
    dos veces en el mismo curso.

3. SINTAXIS Y REFERENCIA RÁPIDA (SQLite / Estándar SQL)
--------------------------------------------------------------------------------
-- A) Siempre habilitar claves foráneas en la conexión actual de SQLite
PRAGMA foreign_keys = ON;

-- B) Tabla con todas las restricciones de integridad aplicadas
CREATE TABLE IF NOT EXISTS cuentas_bancarias (
    id INTEGER PRIMARY KEY,
    numero_cuenta TEXT NOT NULL UNIQUE,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    saldo REAL NOT NULL DEFAULT 0.0 CHECK (saldo >= 0),
    moneda TEXT NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'COP', 'EUR', 'MXN')),
    fecha_apertura TEXT NOT NULL DEFAULT CURRENT_DATE,
    activa INTEGER NOT NULL DEFAULT 1 CHECK (activa IN (0, 1))
);

-- C) Restricción a nivel de tabla (útil para claves compuestas o CHECK entre 2 columnas)
CREATE TABLE IF NOT EXISTS promociones (
    id INTEGER PRIMARY KEY,
    precio_regular REAL NOT NULL,
    precio_oferta REAL NOT NULL,
    CHECK (precio_oferta > 0 AND precio_oferta < precio_regular)
);

4. EJEMPLO PRÁCTICO DE USO REAL
--------------------------------------------------------------------------------
Caso de negocio: Verificar cómo están protegidas las tablas `productos`, `pedidos`
y `resultados` en nuestra base de práctica e inspeccionar sus claves foráneas.
*/
-- PRAGMA foreign_keys;
-- PRAGMA index_list(clientes);
-- PRAGMA foreign_key_list(pedidos);
/*
Resultado esperado de `PRAGMA foreign_key_list(pedidos);`:
+----+-----+----------+------------+----+-----------+-----------+-------+
| id | seq | table    | from       | to | on_update | on_delete | match |
+----+-----+----------+------------+----+-----------+-----------+-------+
| 0  | 0   | clientes | cliente_id | id | NO ACTION | NO ACTION | NONE  |
+----+-----+----------+------------+----+-----------+-----------+-------+
Interpretación técnica:
La columna `pedidos.cliente_id` (`from`) apunta obligatoriamente a `clientes.id` (`to`).
Con `PRAGMA foreign_keys = ON;`, si intentas insertar un pedido con `cliente_id = 999`
(que no existe en `clientes`), SQLite abortará la operación con el error:
`Runtime error: FOREIGN KEY constraint failed (19)`.

5. BUENAS PRÁCTICAS Y ERRORES COMUNES (Rendimiento, Integridad & Gotchas)
--------------------------------------------------------------------------------
  - GOTCHA DE `UNIQUE` Y `NULL`: Según el estándar SQL (y en SQLite), `NULL` significa
    "desconocido", y un valor desconocido no es igual a otro desconocido. Por tanto,
    una columna `correo TEXT UNIQUE` sin `NOT NULL` permite insertar MÚLTIPLES filas
    con `correo = NULL` (como Mia Torres en `clientes`), pero prohíbe repetir
    `'ana@example.test'`. Si el correo debe ser obligatorio y único, combina
    `TEXT NOT NULL UNIQUE`.
  - GOTCHA DE `CHECK` Y `NULL`: En SQL, una restricción `CHECK (nota BETWEEN 0 AND 100)`
    se cumple si el resultado es `TRUE` o `UNKNOWN` (`NULL`). Es decir, si la columna
    no tiene `NOT NULL`, `CHECK` dejará pasar valores `NULL` (ideal para cuando un
    estudiante aún no ha sido calificado).
  - CUIDADO CON `ON DELETE CASCADE`: Declarar `REFERENCES clientes(id) ON DELETE CASCADE`
    en `pedidos` haría que al borrar un cliente se borren silenciosamente todas sus
    facturas históricas. En sistemas financieros y contables siempre se prefiere
    `ON DELETE RESTRICT` (el comportamiento por defecto) o borrado lógico (`activo = 0`).

6. EJERCICIOS PROGRESIVOS (10 Retos: Básico, Intermedio, Senior / Producción)
--------------------------------------------------------------------------------
[Básico]
1. Ejecuta `PRAGMA foreign_keys;` para verificar si tu sesión tiene activas las
   claves foráneas; si devuelve `0`, actívalas con `PRAGMA foreign_keys = ON;`
   y vuelve a consultar.
2. Revisa en `00_base_practica.sql` la tabla `productos` y enumera en un comentario
   todas las restricciones que tiene cada una de sus 7 columnas.
3. Explica con tus palabras por qué en `clientes` la columna `correo` es `UNIQUE`
   pero no `NOT NULL`, y qué efecto práctico tiene para clientes que compran en
   tienda física sin dar correo electrónico.

[Intermedio]
4. Crea una tabla temporal `lab_cuentas` con `id`, `titular` (obligatorio), `correo`
   (obligatorio y único), `saldo` (por defecto `0`, nunca negativo) y `estado`
   (solo `'activa'`, `'bloqueada'` o `'cerrada'`).
5. Inserta una fila válida en `lab_cuentas` omitiendo `saldo` y `estado` para
   comprobar que los valores `DEFAULT` se asignan automáticamente.
6. Escribe en comentarios 3 sentencias `INSERT` sobre `lab_cuentas` que fallen
   intencionalmente: una por violar `NOT NULL`, otra por `UNIQUE` y otra por `CHECK`,
   indicando qué regla protege cada caso.
7. Inspecciona las claves foráneas de `matriculas` y `resultados` ejecutando
   `PRAGMA foreign_key_list(matriculas);` y `PRAGMA foreign_key_list(resultados);`.

[Senior / Producción]
8. Crea una tabla temporal `lab_reservas_hotel` donde exista una restricción `CHECK`
   a nivel de tabla que valide dos columnas entre sí: `fecha_salida > fecha_entrada`
   y `huespedes BETWEEN 1 AND 6`. Prueba insertar una reserva válida.
9.Crea una tabla temporal `lab_inscripciones_evento` con clave primaria compuesta
   `(evento_id, participante_correo)` y una restricción `UNIQUE` compuesta adicional.
   Explica por qué una clave primaria compuesta crea un índice único automático sobre
   la pareja de columnas.
10. Analiza la diferencia entre `ON DELETE RESTRICT`, `ON DELETE SET NULL` y
    `ON DELETE CASCADE`. Documenta cuál usarías para:
    a) `pedidos.cliente_id` -> `clientes.id`
    b) `empleados.departamento_id` -> `departamentos.id`
    c) `sesiones_login.usuario_id` -> `usuarios.id`
================================================================================
*/

-- Zona de trabajo: escribe aqui tus consultas SQL.
