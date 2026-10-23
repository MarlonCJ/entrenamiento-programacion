"""
TEMA 15: AMBITO Y VIDA DE LAS VARIABLES

Python resuelve nombres con la regla LEGB: Local, Enclosing (funcion externa),
Global y Built-in. Una variable creada dentro de una funcion es local. Para
modificar una variable global existe `global`, pero pasar y devolver valores
suele hacer el codigo mas claro. Las funciones anidadas pueden recordar
variables externas mediante clausuras; evita estado global mutable innecesario.

Sintaxis:
tasa = 0.1
def calcular(precio, porcentaje):
    descuento = precio * porcentaje
    return precio - descuento

EJERCICIOS:
1. Muestra que una variable local solo se utiliza dentro de su funcion.
2. Pasa una tasa como argumento en vez de leer una global.
3. Crea dos funciones con variables locales del mismo nombre.
4. Explica con codigo la diferencia entre parametro y variable global.
5. Devuelve un resultado sin cambiar una variable externa.
6. Compara variable local, global y nombre incorporado.
7. Pasa una configuracion explicitamente a dos funciones.
8. Corrige una funcion que depende innecesariamente de global.
9. Crea una clausura que mantenga un contador privado.
10. Diseña funciones con entradas explicitas y sin estado oculto.
"""

# Zona de trabajo: escribe aqui tus soluciones.
