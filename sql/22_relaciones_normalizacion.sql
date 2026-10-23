/*
TEMA 22: RELACIONES Y NORMALIZACION

Las relaciones comunes son uno a uno, uno a muchos y muchos a muchos. Una
clave foranea representa una relacion. Para muchos a muchos se crea una tabla
intermedia. La normalizacion reduce duplicacion y anomalías: cada tabla debe
describir una entidad y cada dato depender de la clave de esa entidad. No
dividas datos sin considerar como se consultaran.

Sintaxis:
CREATE TABLE matriculas (
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id),
    curso_id INTEGER NOT NULL REFERENCES cursos(id),
    PRIMARY KEY (estudiante_id, curso_id)
);

EJERCICIOS:
1. Modela relacion uno a muchos entre cliente y pedidos.
2. Modela muchos a muchos entre estudiantes y cursos.
3. Crea tabla intermedia de matriculas con clave compuesta.
4. Detecta datos de cliente duplicados en cada fila de pedido.
5. Separa una tabla de productos y categorias.
6. Identifica claves primarias y foraneas en una biblioteca.
7. Explica anomalía de actualizacion causada por duplicacion.
8. Decide cardinalidad entre autor y libro para un caso dado.
9. Normaliza tabla que mezcla pedidos con varios productos.
10. Dibuja esquema relacional para una tienda pequeña.
*/
