/*
TEMA 24: SEGURIDAD, CONSULTAS PARAMETRIZADAS Y MANTENIMIENTO

Nunca unas texto de usuario directamente dentro de SQL: esto abre la puerta
a inyeccion SQL. Usa parametros enlazados desde el lenguaje de aplicacion
(placeholders ?, o parametros nombrados segun el motor/driver). Valida
autorizacion en la aplicacion y aplica minimo privilegio. EXPLAIN QUERY PLAN
ayuda a inspeccionar consultas; respaldos y PRAGMA integrity_check ayudan al
mantenimiento de SQLite.

Sintaxis SQLite CLI:
EXPLAIN QUERY PLAN SELECT * FROM productos WHERE id = 1;
PRAGMA integrity_check;
-- En una aplicacion, prepara SELECT * FROM productos WHERE id = ?;
-- y enlaza el valor por separado; no lo concatena en la sentencia.

EJERCICIOS:
1. Identifica riesgo al concatenar un nombre dentro de SQL.
2. Reescribe consulta para usar placeholder enlazado desde tu lenguaje.
3. Explica diferencia entre validacion y parametrizacion.
4. Usa EXPLAIN QUERY PLAN en una consulta filtrada.
5. Identifica indice necesario para evitar un escaneo completo.
6. Ejecuta PRAGMA integrity_check sobre una base de practica.
7. Diseña politica de acceso con minimo privilegio para una aplicacion.
8. Explica por que escapar manualmente texto no sustituye parametros.
9. Documenta una rutina para copia de seguridad de la base de practica.
10. Revisa una consulta y enumera riesgos de seguridad y rendimiento.
*/
