/*
TEMA 07: COMPARACION Y LOGICA

`===`, `!==`, `<`, `>`, `<=` y `>=` producen boolean. `&&`, `||` y `!`
combinan condiciones y usan cortocircuito. TypeScript no convierte
automaticamente valores al comparar con igualdad estricta. Las comprobaciones
tambien pueden estrechar un tipo union dentro de una rama.

Sintaxis:
const puedeEntrar: boolean = edad >= 18 && autorizado;
const fuera = edad < 0 || edad > 120;
const nombreSeguro = typeof dato === "string";

EJERCICIOS:
1. Comprueba si la edad es al menos 18.
2. Valida numero dentro de 1..10 inclusive.
3. Valida nota y decide si aprueba.
4. Comprueba multiplos de 3 o de 5.
5. Evalua acceso usando edad y autorizacion.
6. Determina anio bisiesto con operadores logicos.
7. Comprueba usuario desbloqueado y con intentos restantes.
8. Detecta temperatura fuera del rango permitido.
9. Usa typeof para estrechar string | number.
10. Agrupa condiciones mixtas y explica cortocircuito.
*/

// Zona de trabajo: escribe aqui tus soluciones.
