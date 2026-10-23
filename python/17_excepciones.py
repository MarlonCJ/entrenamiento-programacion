"""
TEMA 17: EXCEPCIONES Y MANEJO DE ERRORES

Una excepcion indica que una operacion no pudo completarse normalmente.
`try` contiene el codigo de riesgo; `except` maneja un tipo de error;
`else` se ejecuta si no hubo excepcion y `finally` se ejecuta siempre.
`raise` lanza una excepcion. Captura errores especificos y evita `except`
vacio, que oculta fallos importantes.

Sintaxis:
try:
    resultado = 10 / divisor
except ZeroDivisionError as error:
    print(f"Division invalida: {error}")
else:
    print(resultado)
finally:
    print("Operacion terminada")

EJERCICIOS:
1. Protege una division y maneja divisor cero.
2. Convierte texto a entero y maneja ValueError.
3. Lanza ValueError si una edad esta fuera del rango esperado.
4. Maneja FileNotFoundError al abrir un archivo inexistente.
5. Usa finally para informar que una operacion termino.
6. Captura dos errores especificos en bloques except apropiados.
7. Valida un precio positivo y lanza una excepcion si no cumple.
8. Propaga un error desde una funcion y manejalo en quien la llama.
9. Distingue una validacion normal de un fallo inesperado.
10. Comunica un error util sin ocultar la informacion necesaria para depurar.
"""

# Zona de trabajo: escribe aqui tus soluciones.
