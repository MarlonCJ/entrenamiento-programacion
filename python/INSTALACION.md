# Instalar Python y configurar VS Code en Windows

## 1. Instalar Python

1. Abre la [pagina oficial de descargas de Python para Windows](https://www.python.org/downloads/windows/).
2. Descarga la version estable mas reciente de Python 3 para Windows. Elige el instalador correspondiente a tu equipo, normalmente Windows installer (64-bit).
3. Ejecuta el instalador. En la primera pantalla, marca **Add python.exe to PATH** y luego selecciona **Install Now**.
4. Cuando termine, abre una nueva ventana de PowerShell.
5. Comprueba la instalacion:

```powershell
python --version
py --version
```

Al menos uno de los dos comandos debe mostrar Python 3 y su version. Si Windows te redirige a Microsoft Store al escribir `python`, usa `py` o revisa **Manage app execution aliases** en la configuracion de Windows.

## 2. Instalar Visual Studio Code y sus extensiones

1. Descarga VS Code desde el [sitio oficial](https://code.visualstudio.com/download).
2. Ejecuta el instalador y abre VS Code.
3. Abre **Extensions** con Ctrl+Shift+X.
4. Instala la extension [Python de Microsoft](https://marketplace.visualstudio.com/items?itemName=ms-python.python).
5. Instala [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance) si VS Code no lo instala automaticamente.
6. Abre la carpeta del proyecto con **File > Open Folder...**.

## 3. Seleccionar el interprete

1. Abre cualquier archivo `.py` del proyecto.
2. Pulsa Ctrl+Shift+P para abrir la paleta de comandos.
3. Busca **Python: Select Interpreter** y selecciona la version que acabas de instalar.

## 4. Ejecutar un ejercicio

Abre **Terminal > New Terminal** en VS Code y ejecuta desde la raiz:

```powershell
python python\01_variables.py
```

Si `python` no es reconocido, prueba:

```powershell
py python\01_variables.py
```

Reemplaza el nombre por cualquier archivo numerado para practicar otro tema; por ejemplo, `python python\17_excepciones.py`.

## Si la instalacion no funciona

- Abre una terminal nueva despues de instalar Python o modificar `PATH`.
- En el instalador, verifica que marcaste **Add python.exe to PATH**.
- Ejecuta `py --version` si el alias `python` de Windows no apunta al interprete instalado.
- En VS Code, selecciona explicitamente el interprete desde **Python: Select Interpreter**.
