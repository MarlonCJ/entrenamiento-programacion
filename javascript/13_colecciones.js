/*
TEMA 13: MAP, SET Y COLECCIONES

Ademas de Array, JavaScript ofrece Map para pares clave-valor y Set para
valores unicos. Map permite claves de cualquier tipo y conserva orden de
insercion; usa set, get, has y entries. Set elimina duplicados; usa add, has
y delete. Elige estructuras por la operacion que necesitas, no solo por su forma.

Sintaxis:
const edades = new Map([["Ana", 20], ["Luis", 25]]);
edades.set("Mia", 22);
const edad = edades.get("Ana");
const unicos = new Set([2, 2, 3]);
unicos.add(4);

EJERCICIOS:
1. Crea un Map de productos y precios; recorre y muestra cada par.
2. Suma cantidades almacenadas por nombre de producto en un Map.
3. Cuenta la frecuencia de cada palabra de una frase usando Map.
4. Elimina duplicados de una lista conservando el orden con Set.
5. Guarda nombres y notas; consulta la nota de un estudiante.
6. Actualiza el precio asociado a una clave existente.
7. Combina dos Map y define que hacer si una clave se repite.
8. Agrupa numeros pares e impares en un Map de listas.
9. Comprueba si una clave existe antes de utilizar su valor.
10. Representa inventario y muestra los productos con cantidad cero.
*/

// Zona de trabajo: escribe aqui tus soluciones.
