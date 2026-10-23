# Instalar SQLite y preparar el entorno SQL en Windows

## Opcion recomendada: DB Browser for SQLite

DB Browser ofrece una interfaz grafica, un editor SQL y acceso a bases SQLite, sin que tengas que administrar un servidor.

1. Descarga **DB Browser for SQLite** desde su [sitio oficial](https://sqlitebrowser.org/dl/).
2. En Windows, elige el instalador estandar de 64 bits salvo que tu equipo requiera otra arquitectura.
3. Ejecuta el instalador y abre DB Browser.
4. Selecciona **New Database**, crea una base de datos llamada `fundamentos.db` dentro de una carpeta de practica y confirma la creacion de la primera tabla temporal si el programa lo solicita.
5. Abre la pestaña **Execute SQL** para escribir consultas.
6. Abre `00_base_practica.sql`, copia su contenido en el editor y ejecutalo una vez. Esto crea las tablas y datos ficticios compartidos por los ejercicios.
7. Copia una consulta de un archivo tematico `.sql` y ejecutala con **Play/Execute**.
8. Guarda los cambios de estructura o datos con **Write Changes**.

## Visual Studio Code (opcional)

1. Descarga [Visual Studio Code](https://code.visualstudio.com/download).
2. Abre el repositorio con **File > Open Folder...**.
3. Los archivos `.sql` se pueden editar directamente con el resaltado basico incluido.
4. Para ejecutar consultas desde VS Code, instala una extension SQLite como [SQLite de alexcvzz](https://marketplace.visualstudio.com/items?itemName=alexcvzz.vscode-sqlite) y abre `fundamentos.db`. La extension es opcional; DB Browser basta para los ejercicios.

## SQLite desde terminal (opcional)

1. Descarga las herramientas de linea de comandos desde la [pagina oficial de SQLite para Windows](https://www.sqlite.org/download.html).
2. Extrae `sqlite3.exe` en una carpeta conocida y agrega esa carpeta al `PATH`, o ejecuta el programa mediante su ruta completa.
3. Abre PowerShell en la carpeta de practica y ejecuta:

```powershell
sqlite3 fundamentos.db
```

4. En la consola SQLite puedes escribir consultas SQL y terminarlas con punto y coma. Escribe `.quit` para salir.

## Como trabajar con los archivos de ejercicios

Los ejemplos estan dentro de comentarios para no ejecutar cambios accidentalmente. Primero prepara las tablas con `00_base_practica.sql`; despues, en DB Browser abre **Execute SQL**, copia solo la sentencia de ejemplo que quieras estudiar y ejecutala. Para resolver un ejercicio, escribe tus consultas en el editor o en un archivo SQL de practica y ejecutalas sobre esa base de datos.

SQLite no es un servidor y sus funciones no son identicas a las de PostgreSQL, MySQL o SQL Server. Comprueba la documentacion del motor si mas adelante cambias de dialecto.
