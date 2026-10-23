/*
TEMA 19: MODULOS, EXPORTACION Y CONFIGURACION

`export` publica funciones, tipos o valores; `import` los consume. TypeScript
resuelve modulos segun tsconfig (module/moduleResolution). Un archivo tsconfig
define opciones del compilador, como strict y outDir. `import type` deja claro
que una importacion solo se usa como tipo y desaparece del JavaScript.

Sintaxis:
export function sumar(a: number, b: number): number { return a + b; }
export type Usuario = { nombre: string };
import { sumar } from "./matematicas";

EJERCICIOS:
1. Exporta y reutiliza una funcion de saludo.
2. Separa operaciones matematicas.
3. Exporta tipo Producto e importalo en otro modulo.
4. Crea modulo de conversiones.
5. Usa import type para un tipo compartido.
6. Exporta constantes de configuracion.
7. Organiza utilidades de texto en modulo.
8. Crea punto de entrada que combine dos modulos.
9. Detecta error de ruta de importacion.
10. Configura salida compilada separada de fuentes y explica su proposito.
*/

// Zona de trabajo: escribe aqui tus soluciones.
