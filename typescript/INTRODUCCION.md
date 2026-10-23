# Introduccion a TypeScript

## Que es TypeScript

TypeScript es un lenguaje basado en JavaScript que agrega un sistema de tipos estatico y herramientas para detectar errores mientras escribes. El compilador transforma archivos `.ts` en JavaScript que puede ejecutarse en Node.js o en un navegador. Los tipos ayudan a describir datos y contratos, pero se eliminan al compilar: no sustituyen la validacion de datos recibidos en tiempo de ejecucion.

## Para que se utiliza

- Desarrollar aplicaciones JavaScript con tipos y mejor mantenimiento.
- Crear aplicaciones web y de servidor, incluidas aplicaciones Node.js.
- Compartir tipos entre modulos y equipos.
- Detectar errores de tipos antes de ejecutar el programa.

## Herramientas necesarias

1. **Node.js LTS**, que incluye npm.
2. **TypeScript**, instalado en el proyecto con npm.
3. **Visual Studio Code**, con soporte TypeScript integrado.
4. **Terminal** para compilar y ejecutar el JavaScript generado.

## Ejemplo

```typescript
const nombre: string = "Ana";
function saludar(persona: string): string {
  return `Hola, ${persona}`;
}
console.log(saludar(nombre));
```

## Siguiente paso

Sigue la [instalacion de Node.js, TypeScript y la configuracion de VS Code](./INSTALACION.md). Luego avanza por los archivos `01` a `24`.
