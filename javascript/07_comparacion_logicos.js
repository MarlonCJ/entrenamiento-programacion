/*
TEMA 07: OPERADORES DE COMPARACION Y LOGICOS

`===`, `!==`, `<`, `>`, `<=` y `>=` comparan valores. Prefiere igualdad
estricta (`===`) porque no convierte tipos automaticamente. `&&` exige que
ambas condiciones sean verdaderas; `||` exige al menos una; `!` niega una.
JavaScript usa cortocircuito: puede no evaluar la parte derecha si ya conoce
el resultado. Usa parentesis para hacer las reglas legibles.

Sintaxis:
const edad = 20;
const autorizado = true;
const puedeEntrar = edad >= 18 && autorizado;
const fueraDeRango = edad < 0 || edad > 120;
const noAutorizado = !autorizado;

EJERCICIOS:
1. Comprueba si una edad es mayor o igual a 18.
2. Comprueba si un numero esta dentro del rango inclusivo de 1 a 10.
3. Determina si una nota aprueba y esta dentro del rango de 0 a 100.
4. Comprueba si un entero es multiplo de 3 o de 5.
5. Decide si una persona puede entrar por edad y autorizacion.
6. Determina si un ano es bisiesto usando comparaciones y operadores logicos.
7. Comprueba que un usuario no este bloqueado y tenga intentos disponibles.
8. Indica si una temperatura esta fuera del rango entre 18 y 26 grados.
9. Compara 5 y "5" con igualdad estricta y no estricta; explica la diferencia.
10. Agrupa condiciones mezcladas con parentesis y predice su resultado.
*/

// Zona de trabajo: escribe aqui tus soluciones.
