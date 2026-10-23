/*
TEMA 13: MAP, SET Y RECORD

Map<K,V> relaciona claves y valores; Set<T> mantiene valores unicos; Record<K,V>
describe un objeto cuyas claves pertenecen a un conjunto de claves. Los tipos
genericos conservan la relacion entre clave y valor. Usa has antes de suponer
que una clave existe; get puede devolver undefined.

Sintaxis:
const edades = new Map<string, number>();
edades.set("Ana", 20);
const etiquetas = new Set<string>(["ts", "logica"]);
type Config = Record<string, boolean>;

EJERCICIOS:
1. Crea Map de productos y precios y recorre entradas.
2. Acumula cantidad por nombre de producto en Map.
3. Cuenta frecuencia de palabras con Map.
4. Elimina duplicados conservando orden mediante Set.
5. Guarda estudiantes y notas; maneja claves ausentes.
6. Actualiza precio de un producto.
7. Combina dos mapas con regla explicita para claves repetidas.
8. Agrupa numeros pares e impares en Map de arreglos.
9. Define configuracion booleana con Record.
10. Modela inventario y enumera productos agotados.
*/

// Zona de trabajo: escribe aqui tus soluciones.
