"""
TEMA 13: TUPLAS, CONJUNTOS Y DICCIONARIOS

Una tupla (`tuple`) es una secuencia ordenada que no se modifica despues de
crearla. Un conjunto (`set`) guarda elementos unicos y permite operaciones
como union e interseccion. Un diccionario (`dict`) relaciona claves con
valores; las claves deben ser hashables. Usa `in` para consultar pertenencia
y recorre pares con `items()`.

Sintaxis:
coordenada = (3, 4)
etiquetas = {"python", "logica"}
edades = {"Ana": 20, "Luis": 25}
edades["Mia"] = 22
for nombre, edad in edades.items():
    print(nombre, edad)

EJERCICIOS:
1. Guarda coordenadas en una tupla y muestra cada componente.
2. Crea un conjunto de etiquetas y demuestra que elimina duplicados.
3. Crea un diccionario de productos y precios; recorre sus pares.
4. Cuenta frecuencia de palabras usando un diccionario.
5. Elimina duplicados de una lista manteniendo el orden original.
6. Actualiza el precio asociado a una clave existente.
7. Combina dos diccionarios y define que hacer con claves repetidas.
8. Agrupa numeros pares e impares en un diccionario de listas.
9. Comprueba que una clave exista antes de leer su valor.
10. Representa inventario y muestra productos cuya cantidad sea cero.
"""

# Zona de trabajo: escribe aqui tus soluciones.
