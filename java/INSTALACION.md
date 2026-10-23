# Instalar Java y configurar VS Code en Windows

## 1. Instalar un JDK

1. Abre la pagina oficial de [Eclipse Temurin](https://adoptium.net/temurin/releases/).
2. Selecciona una version LTS del JDK (JDK 21 es una buena opcion), sistema operativo **Windows**, arquitectura **x64** para la mayoria de los equipos, y paquete **JDK**.
3. Descarga el instalador `.msi` y ejecutalo.
4. Conserva las opciones predeterminadas. Si el instalador ofrece agregar Java al `PATH` o configurar `JAVA_HOME`, habilita esas opciones.
5. Termina la instalacion y abre una nueva ventana de PowerShell.
6. Comprueba que el JDK esta disponible:

```powershell
java --version
javac --version
```

Ambos comandos deben mostrar una version. Si `java` funciona pero `javac` no, probablemente se instalo solo un entorno de ejecucion (JRE); instala el **JDK**.

## 2. Instalar Visual Studio Code y las herramientas de Java

1. Descarga VS Code desde el [sitio oficial](https://code.visualstudio.com/download).
2. Ejecuta el instalador y abre VS Code.
3. Abre **Extensions** con Ctrl+Shift+X.
4. Busca e instala [Extension Pack for Java de Microsoft](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack).
5. Abre la carpeta del proyecto con **File > Open Folder...**. La extension detectara el JDK instalado.

## 3. Ejecutar un ejercicio

Abre **Terminal > New Terminal** en VS Code y, desde la raiz del proyecto, compila y ejecuta un tema:

```powershell
javac java\Tema01Variables.java
java -cp java Tema01Variables
```

Para otro tema reemplaza `Tema01Variables` por el nombre de clase correspondiente, por ejemplo `Tema17Excepciones`, tanto en el archivo de compilacion como en el comando `java`. La compilacion deja un archivo `.class` en la carpeta `java`.

Tambien puedes abrir el archivo Java y utilizar la accion **Run** que ofrece la extension.

## Si Java no se reconoce

- Cierra y vuelve a abrir PowerShell y VS Code despues de instalar el JDK.
- Confirma que instalaste un **JDK**, no solamente un JRE.
- Asegurate de habilitar la configuracion del `PATH` en el instalador; si no se habilito, agrega la carpeta `bin` del JDK a `PATH` desde **Variables de entorno** de Windows.
- Si la extension no detecta Java, abre la paleta de comandos con Ctrl+Shift+P y busca **Java: Configure Java Runtime**.
