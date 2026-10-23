"""
TEMA 08: OPERADORES BIT A BIT, TERNARIO Y PRECEDENCIA

`&`, `|`, `^`, `~`, `<<` y `>>` trabajan sobre bits enteros. El operador
ternario de Python se escribe `valor_si_verdadero if condicion else otro`.
La precedencia determina que operacion ocurre primero; los parentesis hacen
explicita la intencion. `or` permite un valor alternativo para valores falsy,
mientras que no existe un operador `??` incorporado.

Sintaxis:
etiqueta = "Aprobado" if nota >= 60 else "Reprobado"
nombre = entrada or "Invitado"
duplicado = numero << 1
bandera_activa = (permisos & 2) != 0

EJERCICIOS:
1. Usa el ternario para clasificar un numero como positivo o no positivo.
2. Usa el ternario para indicar si una persona es mayor de edad.
3. Comprueba si un entero es par con el bit menos significativo.
4. Multiplica un entero pequeno por dos con desplazamiento de bits.
5. Combina banderas con OR y comprueba una con AND.
6. Elige precio normal o con descuento usando expresion condicional.
7. Compara dos expresiones con agrupaciones distintas y predice sus resultados.
8. Usa or para un nombre por defecto y explica que pasa si la entrada es vacia.
9. Activa o desactiva una bandera usando XOR.
10. Agrega parentesis a una expresion aritmetica/logica para aclarar prioridad.

Usa operadores bit a bit solo con enteros; no los confundas con and y or.
"""

# Zona de trabajo: escribe aqui tus soluciones.
