/*
TEMA 08: BITWISE, TERNARIO Y PRECEDENCIA

`&`, `|`, `^`, `~`, `<<`, `>>` y `>>>` manipulan bits de enteros de 32 bits.
El ternario `condicion ? a : b` elige un valor; el operador `??` solo reemplaza
null o undefined. La precedencia determina el orden; usa parentesis para
expresar la intencion. Operaciones bitwise son un tema especializado.

Sintaxis:
const estado = nota >= 60 ? "Aprobado" : "Reprobado";
const nombreSeguro = nombre ?? "Invitado";
const duplicado = numero << 1;
const bandera = (permisos & 2) !== 0;

EJERCICIOS:
1. Clasifica numero positivo/no positivo con ternario.
2. Decide mayoria de edad con ternario.
3. Comprueba paridad con el bit menos significativo.
4. Duplica un entero pequeño mediante desplazamiento.
5. Combina banderas con OR y comprueba una con AND.
6. Selecciona precio con descuento mediante ternario.
7. Compara una expresion con y sin parentesis.
8. Usa ?? y compara con || para un valor cero y cadena vacia.
9. Activa/desactiva una bandera usando XOR.
10. Reescribe una expresion mixta con parentesis claros.
*/

// Zona de trabajo: escribe aqui tus soluciones.
