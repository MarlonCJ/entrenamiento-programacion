"""
TEMA 16: RECURSION

Una funcion recursiva se llama a si misma para resolver una entrada menor.
Debe tener un caso base que termine y un paso recursivo que se acerque a el.
Sin caso base, la recursion no termina y Python finalmente genera
RecursionError. Para entradas grandes, compara la recursion con bucles o
memorizacion.

Sintaxis:
def cuenta_atras(n):
    if n <= 0:              # caso base
        return
    print(n)
    cuenta_atras(n - 1)

EJERCICIOS:
1. Crea una funcion recursiva que cuente de n a 0.
2. Calcula recursivamente la suma de 1 hasta n.
3. Calcula factorial con factorial(0) igual a 1.
4. Calcula una potencia entera de forma recursiva.
5. Cuenta los digitos de un entero positivo.
6. Suma los digitos de un entero no negativo.
7. Encuentra el maximo de una lista recursivamente.
8. Invierte una cadena con llamadas recursivas.
9. Calcula Fibonacci y observa llamadas del metodo recursivo simple.
10. Comprueba recursivamente si una cadena es palindromo.
"""

# Zona de trabajo: escribe aqui tus soluciones.
