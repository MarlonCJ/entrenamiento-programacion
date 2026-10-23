"""
TEMA 18: LECTURA Y ESCRITURA DE ARCHIVOS

`open` abre un archivo y el administrador de contexto `with` lo cierra incluso
si ocurre un error. Usa `encoding="utf-8"` para texto. Los modos comunes son
"r" leer, "w" crear/reemplazar y "a" agregar. `pathlib.Path` permite construir
rutas. Maneja FileNotFoundError y escribe solo en archivos de practica.

Sintaxis:
from pathlib import Path
ruta = Path("datos.txt")
with ruta.open("r", encoding="utf-8") as archivo:
    contenido = archivo.read()

EJERCICIOS:
1. Escribe una frase en un archivo de practica.
2. Lee y muestra el contenido de un archivo de notas.
3. Cuenta cuantas lineas tiene un archivo de texto.
4. Agrega una linea sin borrar el contenido existente.
5. Guarda una lista de nombres, uno por linea, y vuelvela a leer.
6. Cuenta los caracteres de un archivo.
7. Maneja el caso en que el archivo no exista.
8. Copia el contenido de un archivo a otro.
9. Cuenta cuantas palabras contiene un archivo.
10. Lee un registro de gastos y calcula su total.

Usa with para que los archivos se cierren correctamente.
"""

# Zona de trabajo: escribe aqui tus soluciones.
