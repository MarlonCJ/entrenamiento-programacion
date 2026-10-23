/*
TEMA 04: CONVERSION, NARROWING Y VALIDACION

Las anotaciones TypeScript desaparecen al compilar; no validan entradas
externas automaticamente. Convierte texto explicitamente con Number y valida
con Number.isFinite, Number.isInteger y comprobaciones de rango. `typeof`
ayuda a estrechar tipos. Usa `unknown` en lugar de `any` para datos no fiables
y comprueba su tipo antes de usarlos.

Sintaxis:
function esNumero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}
const edad = Number("20");
const edadValida = Number.isInteger(edad) && edad >= 0;

EJERCICIOS:
1. Convierte texto a entero y verifica que sea entero finito.
2. Convierte decimal y calcula su doble solo si es valido.
3. Valida edad como entero no negativo.
4. Rechaza precio vacio, no numerico o negativo.
5. Convierte segundos a minutos y resto validando entrada.
6. Valida que una cantidad entera este en rango 1..100.
7. Recibe unknown y distingue string, number y boolean sin any.
8. Comprueba que una temperatura sea finita.
9. Distingue cadena vacia, "0" y cero numerico.
10. Valida una nota del 0 al 100 y explica los errores al usuario.
*/

// Zona de trabajo: escribe aqui tus soluciones.
