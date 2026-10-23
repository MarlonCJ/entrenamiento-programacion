# Instalar TypeScript y configurar VS Code en Windows

## 1. Instalar Node.js

1. Descarga la version **LTS** de [Node.js](https://nodejs.org/en/download).
2. Ejecuta el instalador de Windows y conserva la opcion para agregar Node a `PATH`.
3. Abre una nueva terminal y verifica `node --version` y `npm --version`.

## 2. Instalar TypeScript en el proyecto

Desde la raiz del repositorio, ejecuta:

```powershell
npm install --save-dev typescript @types/node
npx tsc --init --rootDir .\typescript --outDir .\typescript\dist --target ES2020 --module commonjs --strict --types node
```

Esto crea `package.json`, `package-lock.json`, `node_modules` y `tsconfig.json` en la raiz. `@types/node` permite que TypeScript reconozca las APIs de Node usadas en los temas. Si el proyecto ya tiene estos archivos, no vuelvas a inicializarlo: instala las dependencias que falten y revisa la configuracion existente antes de cambiarla.

## 3. Configurar VS Code

1. Descarga [Visual Studio Code](https://code.visualstudio.com/download).
2. Abre la raiz del repositorio.
3. VS Code incluye soporte para TypeScript. No requiere una extension para editar estos ejercicios.

## 4. Compilar y ejecutar un ejercicio

```powershell
npx tsc -p .
node typescript\dist\01_variables_tipos.js
```

Para otro tema cambia el nombre del `.js` generado, por ejemplo `17_excepciones.js`. Puedes compilar un solo archivo con `npx tsc typescript\01_variables_tipos.ts --target ES2020 --module commonjs --outDir typescript\dist`.
