<?php

declare(strict_types=1);

/*
TEMA 19: MODULOS Y REUTILIZACION DE ARCHIVOS

PHP permite reutilizar codigo con `require` y `include`. Prefiere require_once
para cargar una definicion obligatoria una sola vez. Las rutas robustas se
construyen con __DIR__, que apunta al directorio del archivo actual. Separa
funciones relacionadas para evitar archivos monoliticos. Composer y autoload
son herramientas comunes en proyectos mayores, pero no hacen falta aqui.

Sintaxis:
require_once __DIR__ . '/utilidades.php';
$resultado = sumar(2, 3);

EJERCICIOS:
1. Crea un archivo auxiliar con una funcion y cargalo con require_once.
2. Separa funciones matematicas en un archivo reutilizable.
3. Importa una funcion de saludo desde un archivo auxiliar.
4. Crea un archivo de constantes y reutilizalo desde otro programa.
5. Usa __DIR__ para cargar un archivo ubicado en la misma carpeta.
6. Organiza funciones de texto en su propio archivo.
7. Muestra que incluir dos veces una definicion puede causar un conflicto y evitalo.
8. Crea un archivo principal que use dos modulos propios.
9. Maneja de forma clara el caso de una dependencia requerida inexistente.
10. Diseña una pequena aplicacion con archivos separados por responsabilidad.
*/

// Zona de trabajo: escribe aqui tus soluciones.
