# Instalar JavaScript con Node.js y configurar VS Code en Windows

## 1. Instalar Node.js

1. Abre el [sitio oficial de descargas de Node.js](https://nodejs.org/en/download).
2. Descarga la version marcada **LTS** para Windows y tu arquitectura (normalmente x64). Para aprender, el instalador de Windows con extension `.msi` es la opcion mas sencilla.
3. Ejecuta el instalador. Conserva las opciones predeterminadas y asegúrate de incluir Node.js en `PATH` si el instalador muestra esa opcion.
4. Termina la instalacion y abre una nueva ventana de PowerShell.
5. Comprueba que Node.js y npm estan disponibles:

```powershell
node --version
npm --version
```

Ambos comandos deben mostrar numeros de version.

## 2. Instalar Visual Studio Code

1. Descarga VS Code desde el [sitio oficial](https://code.visualstudio.com/download).
2. Ejecuta el instalador y abre VS Code.
3. El soporte basico para JavaScript viene incluido. Si quieres reglas adicionales, instala la extension [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) desde **Extensions** (Ctrl+Shift+X); es opcional para estos ejercicios.
4. Abre la carpeta del proyecto con **File > Open Folder...**.

## 3. Ejecutar un ejercicio

1. En VS Code, abre **Terminal > New Terminal**.
2. Confirma que la terminal se encuentra en la carpeta raiz del proyecto.
3. Ejecuta:

```powershell
node javascript\01_variables.js
```

Para otro tema reemplaza el nombre por el archivo numerado que quieras, por ejemplo `node javascript\17_excepciones.js`.

## Si `node` o `npm` no se reconoce

- Cierra y vuelve a abrir VS Code y PowerShell despues de instalar Node.js.
- En **Aplicaciones instaladas** de Windows comprueba que Node.js se instalo.
- Si sigue sin reconocerse, vuelve a ejecutar el instalador oficial y comprueba que Node.js quede incluido en `PATH`.
