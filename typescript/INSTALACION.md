# Instalar TypeScript y configurar VS Code en Windows

## 1. Instalar Node.js

1. Descarga la versión **LTS** de [Node.js](https://nodejs.org/en/download) (22 o superior).
2. Ejecuta el instalador de Windows y conserva la opción para agregar Node a `PATH`.
3. Abre una nueva terminal y verifica:

```powershell
node --version
npm --version
```

## 2. Instalar TypeScript en el proyecto

Desde la raíz del repositorio, ejecuta:

```powershell
npm install --save-dev typescript @types/node
npx tsc --init --rootDir .\typescript --outDir .\typescript\dist --target ES2022 --lib ES2024 --module commonjs --strict --noUncheckedIndexedAccess --types node
```

Esto crea `package.json`, `package-lock.json`, `node_modules` y `tsconfig.json` en la raíz:

- `--strict` activa todas las comprobaciones estrictas (`strictNullChecks`, `noImplicitAny`, etc.); los temas asumen este modo.
- `--lib ES2024` habilita APIs modernas usadas en los temas (`toSorted`, `Object.groupBy`, `Array.prototype.at`...).
- `--noUncheckedIndexedAccess` hace que `arreglo[i]` sea `T | undefined`, como ocurre realmente en runtime.
- `@types/node` permite que TypeScript reconozca las APIs de Node (`node:fs/promises`, `node:crypto`, `process`...).

Si el proyecto ya tiene estos archivos, no vuelvas a inicializarlo: instala las dependencias que falten y revisa la configuración existente antes de cambiarla.

> Si quieres usar `await` en el nivel superior de un archivo, necesitas módulos ESM: agrega `"type": "module"` en `package.json` y usa `--module nodenext`.

## 3. Configurar VS Code

1. Descarga [Visual Studio Code](https://code.visualstudio.com/download).
2. Abre la raíz del repositorio con **File > Open Folder...**.
3. VS Code incluye soporte para TypeScript; no requiere extensiones para estos ejercicios. Para usar la versión del proyecto, abre un `.ts`, pulsa Ctrl+Shift+P y elige **TypeScript: Select TypeScript Version > Use Workspace Version**.
4. Opcional: instala la extensión ESLint para detectar malas prácticas además de errores de tipos.

## 4. Compilar y ejecutar un ejercicio

```powershell
npx tsc -p .
node typescript\dist\01_variables_tipos.js
```

Para otro tema cambia el nombre del `.js` generado, por ejemplo `17_excepciones.js`. Otras opciones útiles:

```powershell
npx tsc --noEmit -p .          # solo verificar tipos, sin generar JavaScript
npx tsc -p . --watch           # recompilar automáticamente al guardar
node --experimental-strip-types typescript\01_variables_tipos.ts   # Node 22.6+, sin verificar tipos
```

## Si algo no funciona

- Cada archivo `.ts` del curso termina con `export {};`. Esa línea lo convierte en un módulo, para que las variables y funciones de un tema no colisionen con las de otro al compilar toda la carpeta ("Cannot redeclare block-scoped variable"). No la borres.
- Abre una terminal nueva después de instalar Node.js.
- Si `npx tsc` no se encuentra, ejecuta `npm install` en la raíz.
- Si aparecen errores como "Property 'toSorted' does not exist", revisa que `lib` incluya `ES2024` en `tsconfig.json`.
- Si PowerShell bloquea `npx` por la política de ejecución (ExecutionPolicy restrictiva), usa `npx.cmd tsc -p .` o `cmd /c npx tsc -p .`, o ejecuta los comandos desde CMD.
