# Instalar Python y configurar VS Code en Windows

## 1. Instalar Python

1. Abre la [página oficial de descargas de Python para Windows](https://www.python.org/downloads/windows/).
2. Descarga la versión estable más reciente de Python 3 (**3.12 o superior**). Elige el instalador correspondiente a tu equipo, normalmente *Windows installer (64-bit)*.
3. Ejecuta el instalador. En la primera pantalla, marca **Add python.exe to PATH** y luego selecciona **Install Now**.
4. Cuando termine, abre una nueva ventana de PowerShell.
5. Comprueba la instalación:

```powershell
python --version
py --version
```

Al menos uno de los dos comandos debe mostrar Python 3.12 o superior. Si Windows te redirige a Microsoft Store al escribir `python`, usa `py` o desactiva los alias en **Configuración > Aplicaciones > Configuración avanzada de aplicaciones > Alias de ejecución de aplicaciones** (*Manage app execution aliases*).

## 2. Instalar Visual Studio Code y sus extensiones

1. Descarga VS Code desde el [sitio oficial](https://code.visualstudio.com/download).
2. Ejecuta el instalador y abre VS Code.
3. Abre **Extensions** con Ctrl+Shift+X.
4. Instala la extensión [Python de Microsoft](https://marketplace.visualstudio.com/items?itemName=ms-python.python).
5. Instala [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance) si VS Code no lo instala automáticamente.
6. Abre la carpeta del proyecto con **File > Open Folder...**.

## 3. Seleccionar el intérprete

1. Abre cualquier archivo `.py` del proyecto.
2. Pulsa Ctrl+Shift+P para abrir la paleta de comandos.
3. Busca **Python: Select Interpreter** y selecciona la versión que acabas de instalar.
4. Recomendado: en la configuración de VS Code busca **Type Checking Mode** (Pylance) y elige `basic` o `strict` para que el editor verifique los *type hints* que usan los temas.

## 4. Ejecutar un ejercicio

Abre **Terminal > New Terminal** en VS Code y ejecuta desde la raíz:

```powershell
python python\01_variables.py
```

Si `python` no es reconocido, prueba:

```powershell
py python\01_variables.py
```

Reemplaza el nombre por cualquier archivo numerado para practicar otro tema; por ejemplo, `python python\17_excepciones.py`.

## 5. (Opcional) Entorno virtual y herramientas de calidad

Los temas no necesitan paquetes externos, pero algunos retos avanzados sugieren `pytest`, `mypy` o `ruff`. Instálalos dentro de un entorno virtual para no ensuciar la instalación global:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install pytest mypy ruff
```

Si PowerShell bloquea el script de activación, ejecuta una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. VS Code detecta `.venv` automáticamente; selecciónalo en **Python: Select Interpreter**.

## Si la instalación no funciona

- Abre una terminal nueva después de instalar Python o modificar `PATH`.
- En el instalador, verifica que marcaste **Add python.exe to PATH**.
- Ejecuta `py --version` si el alias `python` de Windows no apunta al intérprete instalado.
- Si ves `AttributeError: module 'itertools' has no attribute 'batched'` u otros errores de funciones recientes, tu Python es anterior a 3.12: actualízalo.
- En VS Code, selecciona explícitamente el intérprete desde **Python: Select Interpreter**.
