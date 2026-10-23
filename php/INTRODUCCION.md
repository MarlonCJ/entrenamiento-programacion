# Introduccion a PHP

## Que es PHP

PHP es un lenguaje de programacion de codigo abierto que se ejecuta principalmente del lado del servidor. Se utiliza para crear paginas web dinamicas, procesar formularios, comunicarse con bases de datos y construir aplicaciones y servicios web. Tambien se puede ejecutar desde la terminal para aprender fundamentos o automatizar tareas; en este proyecto no necesitamos crear un servidor web.

## Para que se utiliza

- Generar contenido web dinamico.
- Procesar datos enviados desde formularios.
- Conectarse a bases de datos.
- Crear API y aplicaciones web con o sin frameworks.
- Automatizar tareas y ejecutar programas de consola.

## Herramientas necesarias

1. **PHP CLI**: interpreta y ejecuta archivos `.php`.
2. **Visual Studio Code**: editor donde escribiras y revisaras el codigo.
3. **PHP Intelephense** (extension de VS Code): ayuda con autocompletado, navegacion y diagnosticos.
4. **Terminal de Windows**: permite comprobar la instalacion y ejecutar ejercicios.

Para estos ejercicios no necesitas servidor web, Composer, una base de datos ni frameworks.

## Como funciona un programa PHP

El codigo PHP se escribe entre `<?php` y se guarda en un archivo con extension `.php`. El interprete ejecuta el archivo y envia la salida a la consola.

```php
<?php

$nombre = "Ana";
echo "Hola, " . $nombre . PHP_EOL;
```

Desde la raiz del proyecto ejecuta, por ejemplo, `php php\01_variables.php`. La carpeta contiene 24 temas numerados; empieza por el 01 y avanza en orden.

## Siguiente paso

Continua con la [guia para instalar PHP y configurar VS Code en Windows](./INSTALACION.md) y luego practica con los archivos tematicos de este directorio.
