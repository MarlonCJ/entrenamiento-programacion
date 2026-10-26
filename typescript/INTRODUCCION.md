# Introducción a TypeScript

## Qué es TypeScript

TypeScript es un lenguaje basado en JavaScript que agrega un sistema de tipos estático y herramientas para detectar errores mientras escribes. El compilador (`tsc`) verifica los tipos y transforma los archivos `.ts` en JavaScript que se ejecuta en Node.js o en un navegador.

Dos ideas te acompañarán durante todo el curso:

- **Tipado estructural**: dos tipos son compatibles si tienen la misma forma, sin importar su nombre.
- **Borrado de tipos (*type erasure*)**: los tipos desaparecen al compilar. En tiempo de ejecución solo queda JavaScript, así que los datos externos (formularios, APIs, archivos) deben validarse siempre: un `as Usuario` no comprueba nada.

## Para qué se utiliza

- Desarrollar aplicaciones JavaScript grandes con tipos y mejor mantenimiento.
- Crear aplicaciones web (React, Angular, Vue) y de servidor (Node.js, NestJS).
- Compartir contratos de datos entre frontend, backend y equipos.
- Detectar errores antes de ejecutar y refactorizar con seguridad.

## Herramientas necesarias

1. **Node.js LTS**, que incluye npm.
2. **TypeScript**, instalado en el proyecto con npm.
3. **Visual Studio Code**, con soporte TypeScript integrado.
4. **Terminal** para compilar y ejecutar el JavaScript generado.

## Ejemplo

```typescript
type Moneda = "COP" | "USD";

function formatearPrecio(valor: number, moneda: Moneda): string {
  return `${valor.toFixed(2)} ${moneda}`;
}

console.log(formatearPrecio(19.9, "USD")); // 19.90 USD
// formatearPrecio(19.9, "EUR");           // Error de compilación: "EUR" no es una Moneda
```

## Cómo están organizados los temas

La carpeta contiene 30 temas numerados, del `01` al `30`, agrupados en cuatro fases (fundamentos, estructuras y sistema, POO y algoritmia, ingeniería avanzada). Cada archivo explica el tema en seis secciones y termina con diez retos progresivos para resolver en la zona de trabajo. Se recomienda haber visto antes la ruta de JavaScript o estudiarlas en paralelo.

## Siguiente paso

Sigue la [instalación de Node.js, TypeScript y la configuración de VS Code](./INSTALACION.md). Luego avanza por los archivos `01` a `30` según el [plan de estudios](./README.md).
