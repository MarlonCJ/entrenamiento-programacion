/*
================================================================================
BASE DE PRÁCTICA SQL (PREPARACIÓN DEL ENTORNO - NO ES UN TEMA)
================================================================================

1. ¿QUÉ ES ESTE ARCHIVO Y POR QUÉ IMPORTA?
--------------------------------------------------------------------------------
Este script construye el ecosistema de datos (esquema + datos semilla) sobre el
cual practicarás los temas 01 al 24. Está diseñado con tres dominios del mundo
real para que puedas entrenar desde consultas simples hasta reportes complejos:

  A) DOMINIO E-COMMERCE / TIENDA:
     - categorias (1) ----< (N) productos
     - clientes   (1) ----< (N) pedidos (1) ----< (N) detalle_pedido >---- (1) productos

  B) DOMINIO ACADÉMICO / EDUCACIÓN:
     - estudiantes (1) ----< (N) matriculas >---- (1) cursos
     - estudiantes (1) ----< (N) resultados >---- (1) cursos

  C) DOMINIO RECURSOS HUMANOS (RRHH):
     - departamentos (1) ----< (N) empleados

2. ¿CÓMO EJECUTARLO?
--------------------------------------------------------------------------------
- Desde terminal con SQLite CLI:
    sqlite3 practica.db < 00_base_practica.sql
- Desde VS Code (extensión SQLite / SQLTools) o DB Browser for SQLite:
    Abre este archivo y ejecuta todo el script.

Es 100% IDEMPOTENTE: usa `CREATE TABLE IF NOT EXISTS` e `INSERT OR IGNORE`, por
lo que puedes volver a ejecutarlo en cualquier momento para restaurar los datos
originales sin duplicar identificadores ni romper tablas existentes.
================================================================================
*/

-- Activa la verificación de integridad referencial en SQLite (vital en cada conexión)
PRAGMA foreign_keys = ON;

-- =============================================================================
-- 1. ESQUEMA DE TABLAS (DDL - Data Definition Language)
-- =============================================================================

-- Dominio E-Commerce: Categorías de catálogo
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
);

-- Dominio E-Commerce: Catálogo de productos con validación de precio, stock y estado booleano (0/1)
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    precio REAL NOT NULL CHECK (precio >= 0),
    existencias INTEGER NOT NULL DEFAULT 0 CHECK (existencias >= 0),
    categoria_id INTEGER REFERENCES categorias(id),
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    descripcion TEXT
);

-- Dominio E-Commerce: Directorio de clientes (incluye campos anulables para practicar IS NULL)
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    correo TEXT UNIQUE,
    telefono TEXT,
    ciudad TEXT
);

-- Dominio E-Commerce: Cabecera de órdenes de compra
CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),
    fecha TEXT NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'pagado', 'cancelado')),
    total REAL NOT NULL CHECK (total >= 0)
);

-- Dominio E-Commerce: Líneas de pedido (relación muchos a muchos con clave primaria compuesta)
CREATE TABLE IF NOT EXISTS detalle_pedido (
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id),
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario REAL NOT NULL CHECK (precio_unitario >= 0),
    PRIMARY KEY (pedido_id, producto_id)
);

-- Dominio Académico: Alumnos registrados
CREATE TABLE IF NOT EXISTS estudiantes (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    correo TEXT UNIQUE
);

-- Dominio Académico: Oferta de cursos con duración en horas
CREATE TABLE IF NOT EXISTS cursos (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    duracion INTEGER NOT NULL CHECK (duracion > 0)
);

-- Dominio Académico: Inscripciones de estudiantes en cursos
CREATE TABLE IF NOT EXISTS matriculas (
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id),
    curso_id INTEGER NOT NULL REFERENCES cursos(id),
    fecha TEXT NOT NULL,
    PRIMARY KEY (estudiante_id, curso_id)
);

-- Dominio Académico: Calificaciones obtenidas (0 a 100)
CREATE TABLE IF NOT EXISTS resultados (
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id),
    curso_id INTEGER NOT NULL REFERENCES cursos(id),
    nota REAL CHECK (nota BETWEEN 0 AND 100),
    PRIMARY KEY (estudiante_id, curso_id)
);

-- Dominio RRHH: Áreas de la empresa
CREATE TABLE IF NOT EXISTS departamentos (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
);

-- Dominio RRHH: Nómina de empleados
CREATE TABLE IF NOT EXISTS empleados (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    departamento_id INTEGER REFERENCES departamentos(id),
    salario REAL NOT NULL CHECK (salario >= 0),
    fecha_contratacion TEXT NOT NULL
);

-- =============================================================================
-- 2. DATOS SEMILLA (DML - Data Manipulation Language)
-- =============================================================================

INSERT OR IGNORE INTO categorias (id, nombre) VALUES
    (1, 'Libros'),
    (2, 'Papeleria'),
    (3, 'Electronica');

INSERT OR IGNORE INTO productos
    (id, nombre, precio, existencias, categoria_id, activo, descripcion)
VALUES
    (1, 'Cuaderno', 4.50, 20, 2, 1, 'Cuaderno de practica'),
    (2, 'Lapiz', 1.25, 100, 2, 1, 'Lapiz de grafito'),
    (3, 'SQL para principiantes', 18.00, 8, 1, 1, 'Libro de bases de datos'),
    (4, 'Teclado', 25.50, 0, 3, 0, 'Teclado de practica');

INSERT OR IGNORE INTO clientes
    (id, nombre, apellido, correo, telefono, ciudad)
VALUES
    (1, 'Ana', 'Perez', 'ana@example.test', '5550101', 'Bogota'),
    (2, 'Luis', 'Gomez', 'luis@example.test', NULL, 'Cali'),
    (3, 'Mia', 'Torres', NULL, '5550103', 'Bogota');

INSERT OR IGNORE INTO pedidos (id, cliente_id, fecha, estado, total) VALUES
    (1, 1, '2026-01-15', 'pagado', 10.00),
    (2, 1, '2026-02-03', 'pendiente', 18.00),
    (3, 2, '2026-02-11', 'cancelado', 25.50);

INSERT OR IGNORE INTO detalle_pedido
    (pedido_id, producto_id, cantidad, precio_unitario)
VALUES
    (1, 1, 1, 4.50),
    (1, 2, 4, 1.375),
    (2, 3, 1, 18.00),
    (3, 4, 1, 25.50);

INSERT OR IGNORE INTO cursos (id, nombre, duracion) VALUES
    (1, 'Fundamentos SQL', 20),
    (2, 'Logica de programacion', 30);

INSERT OR IGNORE INTO estudiantes (id, nombre, apellido, correo) VALUES
    (1, 'Sara', 'Lopez', 'sara@example.test'),
    (2, 'Diego', 'Ruiz', 'diego@example.test'),
    (3, 'Elena', 'Diaz', 'elena@example.test');

INSERT OR IGNORE INTO matriculas (estudiante_id, curso_id, fecha) VALUES
    (1, 1, '2026-01-10'),
    (2, 1, '2026-01-12'),
    (2, 2, '2026-01-15');

INSERT OR IGNORE INTO resultados (estudiante_id, curso_id, nota) VALUES
    (1, 1, 88),
    (2, 1, 72),
    (2, 2, 95),
    (3, 1, 58);

INSERT OR IGNORE INTO departamentos (id, nombre) VALUES
    (1, 'Tecnologia'),
    (2, 'Ventas');

INSERT OR IGNORE INTO empleados
    (id, nombre, departamento_id, salario, fecha_contratacion)
VALUES
    (1, 'Rosa', 1, 3200, '2022-05-01'),
    (2, 'Pablo', 2, 2800, '2023-03-15'),
    (3, 'Nora', 1, 3500, '2021-11-20');
