"""
TEMA 02: CONSTANTES

Python no impone constantes inmutables en el lenguaje. Por convencion, un
nombre en MAYUSCULAS comunica que el valor no debe reasignarse. `Final` de
typing ayuda a analizadores estaticos a detectar reasignaciones, pero no
congela el valor durante la ejecucion. Usa constantes para configuracion
estable y evita cambiar su valor en otras partes del programa.

Sintaxis:
from typing import Final

IVA: Final[float] = 0.19
NOMBRE_APP: Final[str] = "Mi aplicacion"
total = 100 * (1 + IVA)
print(NOMBRE_APP, total)

EJERCICIOS:
1. Declara una constante con el nombre de tu pais y muestrala.
2. Declara PI y calcula el perimetro de un circulo.
3. Guarda IVA y precio en constantes; calcula el total.
4. Declara los segundos por minuto y convierte minutos.
5. Declara el nombre de una aplicacion y crea un mensaje de bienvenida.
6. Define los dias de la semana y calcula semanas en 28 dias.
7. Declara los minutos de una hora y convierte horas a minutos.
8. Usa constantes de base y altura para calcular un area triangular.
9. Declara un limite de intentos y comparalo con un contador.
10. Guarda moneda y precio como constantes y presenta un recibo legible.
"""

# Zona de trabajo: escribe aqui tus soluciones.
