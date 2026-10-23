/*
TEMA 02: CONSTANTES Y DATOS DE SOLO LECTURA

`const` impide reasignar una variable, pero no vuelve inmutable un objeto.
`readonly` impide reasignar una propiedad desde el codigo tipado. `as const`
conserva valores literales y hace readonly sus propiedades y tuplas. Estos
recursos son comprobaciones de compilacion; no congelan objetos en ejecucion.

Sintaxis:
const IVA: number = 0.19;
type Configuracion = { readonly idioma: string };
const config: Configuracion = { idioma: "es" };
const DIRECCIONES = ["N", "S"] as const;

EJERCICIOS:
1. Declara una constante con el nombre de tu pais.
2. Declara PI como constante y calcula el perimetro de un circulo.
3. Guarda IVA y precio como constantes tipadas y calcula el total.
4. Define los segundos por minuto como una constante.
5. Crea un tipo Configuracion con propiedad idioma readonly.
6. Define una tupla de dias como const y consulta uno de sus valores.
7. Usa constantes para base y altura de un triangulo.
8. Declara un limite de intentos e indica por que no debe ser let.
9. Crea un objeto readonly de producto y lee su precio.
10. Compara const, readonly y as const describiendo que evita cada uno.
*/

// Zona de trabajo: escribe aqui tus soluciones.
