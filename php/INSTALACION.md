# Instalar PHP y configurar VS Code en Windows

Esta guia configura PHP para ejecutar programas desde la terminal. No hace falta instalar Apache ni crear un servidor web para resolver los ejercicios.

## Opcion sencilla: PHP incluido en XAMPP

Si ya tienes XAMPP instalado, puedes usar el PHP que incluye sin instalar otra copia. Por ejemplo, si PHP esta en `C:\xampp\php`, prueba en PowerShell:

```powershell
& 'C:\xampp\php\php.exe' --version
```

Si muestra la version de PHP, ve al paso 4 para configurarlo en `PATH`.

1. Descarga XAMPP desde el [sitio oficial de Apache Friends](https://www.apachefriends.org/download.html).
2. Ejecuta el instalador de Windows. Selecciona PHP; Apache y MySQL no son necesarios para estos ejercicios.
3. Termina la instalacion y localiza `php.exe`, normalmente en `C:\xampp\php\php.exe`.
4. Agrega la carpeta que contiene `php.exe` (por ejemplo, `C:\xampp\php`) al `PATH` de Windows:
   - Abre Inicio y busca **Editar las variables de entorno del sistema**.
   - Pulsa **Variables de entorno...**.
   - En las variables de usuario, selecciona `Path` y pulsa **Editar**.
   - Pulsa **Nuevo**, agrega la ruta a la carpeta de PHP y acepta todas las ventanas.
   - No reemplaces ni borres las entradas existentes.
5. Cierra y vuelve a abrir PowerShell y VS Code para que Windows recargue el `PATH`.
6. Comprueba PHP con:

```powershell
php --version
```

## Instalar Visual Studio Code

1. Descarga VS Code desde el [sitio oficial](https://code.visualstudio.com/download).
2. Ejecuta el instalador y abre VS Code.
3. Instala la extension [PHP Intelephense](https://marketplace.visualstudio.com/items?itemName=bmewburn.vscode-intelephense-client) desde el icono **Extensions** (Ctrl+Shift+X).
4. Abre la carpeta del proyecto en VS Code: **File > Open Folder...**.

## Ejecutar un ejercicio

Abre una terminal de VS Code en la raiz del proyecto (**Terminal > New Terminal**) y ejecuta:

```powershell
php php\01_variables.php
```

Para otro tema sustituye el nombre por el archivo numerado que quieras, por ejemplo `php php\17_excepciones.php`.

## Si Windows no reconoce `php`

- Asegurate de agregar al `PATH` la carpeta que contiene `php.exe`, no el propio archivo.
- Cierra y abre de nuevo la terminal despues de cambiar `PATH`.
- Comprueba que la ruta existe y que ahi esta `php.exe`.
- Si tienes varias instalaciones, prueba la ruta completa del ejecutable para identificar cual estas usando.
