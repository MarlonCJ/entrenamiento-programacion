# Introducción a Python

## Qué es Python

Python es un lenguaje de programación de propósito general conocido por su sintaxis legible. Se utiliza en automatización, desarrollo web, análisis de datos, inteligencia artificial, ciencia, educación y muchas otras áreas. La implementación de referencia, **CPython**, compila tu código a *bytecode* y lo ejecuta en una máquina virtual; en este curso aprenderás cómo funciona por dentro para escribir código correcto y eficiente.

Dos ideas te acompañarán durante todo el curso:

- **Todo es un objeto** y las variables son nombres que apuntan a objetos (no cajas que los contienen).
- **Tipado dinámico pero fuerte**: el tipo pertenece al valor y Python no convierte tipos a escondidas (`"3" + 4` es un error).

## Para qué se utiliza

- Aprender lógica y fundamentos de programación.
- Automatizar tareas y procesar archivos (Excel, CSV, PDF, correos).
- Crear aplicaciones y servicios web (Django, FastAPI, Flask).
- Analizar datos y construir herramientas de ciencia de datos (pandas, NumPy).
- Desarrollar proyectos de inteligencia artificial y aprendizaje automático.

## Herramientas necesarias

1. **Python 3.12 o superior**: intérprete que ejecuta archivos `.py`. Algunos ejemplos usan novedades recientes (`itertools.batched`, mejoras de f-strings).
2. **Visual Studio Code**: editor para escribir, ejecutar y depurar código.
3. **Extensión Python de Microsoft**: integra ejecución, depuración y selección del intérprete en VS Code.
4. **Pylance**: mejora el autocompletado y verifica los *type hints*.
5. **Terminal de Windows**: permite ejecutar directamente los programas.

Los ejercicios no requieren paquetes de terceros. Un entorno virtual (`python -m venv .venv`) se vuelve útil cuando un proyecto necesita librerías externas, por ejemplo `pytest`, `mypy` o `ruff`, que se recomiendan en algunos retos avanzados.

## Cómo funciona un programa Python

Guarda el código en un archivo `.py`. La indentación (4 espacios) delimita los bloques y `print` muestra información:

```python
nombre = "Ana"
print(f"Hola, {nombre}")
```

Desde la raíz del proyecto ejecuta `python python\01_variables.py`. Si `python` no está configurado en Windows, prueba `py python\01_variables.py`.

## Cómo están organizados los temas

La carpeta contiene 30 temas numerados, del `01` al `30`, agrupados en cuatro fases (fundamentos, estructuras y sistema, POO y algoritmia, ingeniería avanzada). Cada archivo explica el tema en seis secciones dentro de un docstring y termina con diez retos progresivos para resolver en la zona de trabajo.

## Siguiente paso

Continúa con la [guía para instalar Python y configurar VS Code en Windows](./INSTALACION.md) y luego sigue el [plan de estudios](./README.md).
