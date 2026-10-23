/*
TEMA 08: OPERADORES BIT A BIT, TERNARIO Y PRECEDENCIA

`&`, `|`, `^`, `~`, `<<` y `>>` operan sobre bits; se usan para banderas y
mascaras. El ternario `condicion ? valor1 : valor2` elige un valor segun una
condicion. `??` proporciona un valor por defecto solo ante null o undefined;
`||` tambien reemplaza valores falsy como 0 y "". La precedencia decide el
orden; usa parentesis para que la intencion no dependa de memorizarla.

Sintaxis:
const etiqueta = nota >= 60 ? "Aprobado" : "Reprobado";
const nombre = entrada ?? "Invitado";
const duplicado = numero << 1;
const banderaActiva = (permisos & 2) !== 0;

EJERCICIOS:
1. Usa ternario para clasificar un numero como positivo o no positivo.
2. Usa ternario para indicar si una persona es mayor de edad.
3. Comprueba si un entero es par con su bit menos significativo.
4. Multiplica un entero pequeno por 2 mediante desplazamiento a la izquierda.
5. Combina banderas con OR y comprueba una con AND.
6. Elige precio con descuento o precio normal usando ternario.
7. Compara el resultado de dos expresiones con distinta agrupacion.
8. Usa ?? para dar nombre por defecto y compara su comportamiento con ||.
9. Activa y desactiva una bandera usando XOR.
10. Agrega parentesis a una expresion aritmetica/logica para aclarar prioridad.

Usa bitwise con enteros y no lo confundas con && ni ||.
*/

// Zona de trabajo: escribe aqui tus soluciones.
