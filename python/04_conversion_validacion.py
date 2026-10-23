"""
TEMA 04: CONVERSION Y VALIDACION DE DATOS

`input()` devuelve texto. Convierte explicitamente con `int`, `float` o `str`;
una conversion invalida puede lanzar ValueError. `isinstance` comprueba el
tipo de un valor. Valida la entrada antes de calcular y maneja conversiones
invalidas con try/except. Comprueba tambien rangos: que un valor sea numero
no significa que tenga sentido para el problema.

Sintaxis:
texto = "42"
numero = int(texto)
es_numero = isinstance(numero, (int, float))
try:
    precio = float("3.5")
except ValueError:
    print("Entrada no numerica")

EJERCICIOS:
1. Convierte una cadena con digitos a entero y muestra su tipo.
2. Convierte una cadena decimal y calcula el doble.
3. Pide una edad y valida que sea entero no negativo.
4. Pide un precio y rechaza entradas vacias o no numericas.
5. Convierte segundos ingresados como texto a minutos y segundos restantes.
6. Valida que una cantidad entera este entre 1 y 100.
7. Suma dos entradas solo cuando ambas son numeros validos.
8. Valida que la temperatura sea numerica y finita.
9. Distingue entrada vacia, texto "0" y numero cero.
10. Solicita una nota hasta recibir un numero entre 0 y 100.

No confundas entrada vacia con cero ni conversion correcta con rango valido.
"""

# Zona de trabajo: escribe aqui tus soluciones.
