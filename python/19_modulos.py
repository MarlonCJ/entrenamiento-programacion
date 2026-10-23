"""
TEMA 19: MODULOS E IMPORTACIONES

Cada archivo `.py` puede funcionar como modulo. `import` carga un modulo;
`from modulo import nombre` carga un nombre especifico. `as` permite un alias.
El archivo ejecutado directamente tiene `__name__ == "__main__"`; usa esa
condicion para separar el punto de entrada del codigo reutilizable. Evita
nombres de archivo que oculten modulos estandar como random o pathlib.

Sintaxis:
import math
from pathlib import Path as Ruta
print(math.sqrt(16))
if __name__ == "__main__":
    print("Programa principal")

EJERCICIOS:
1. Importa math y calcula la raiz de un numero.
2. Crea un modulo propio con una funcion de saludo y usalo desde otro archivo.
3. Separa operaciones matematicas en un modulo.
4. Importa una funcion con un alias.
5. Crea un modulo de conversion de temperaturas.
6. Guarda constantes reutilizables en un archivo aparte.
7. Usa el bloque __main__ para ejecutar una demostracion solo al correr el modulo.
8. Organiza funciones de texto en su propio modulo.
9. Explica que ocurre al importar un nombre inexistente.
10. Divide un programa pequeno en modulos por responsabilidad.
"""

# Zona de trabajo: escribe aqui tus soluciones.
