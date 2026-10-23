<?php

declare(strict_types=1);

/*
TEMA 17: EXCEPCIONES Y MANEJO DE ERRORES

Una excepcion representa una situacion anormal que puede interrumpir el flujo
normal. `try` contiene codigo que podria fallar; `catch` recibe una excepcion
compatible; `finally` se ejecuta al salir de la estructura. `throw` lanza una
excepcion. Usa excepciones para errores excepcionales, no para reemplazar
todas las condiciones normales.

Sintaxis:
try {
    if ($divisor === 0) {
        throw new InvalidArgumentException('El divisor no puede ser cero');
    }
    $resultado = 10 / $divisor;
} catch (InvalidArgumentException $error) {
    echo $error->getMessage();
} finally {
    echo PHP_EOL . 'Operacion terminada';
}

EJERCICIOS:
1. Protege una division y maneja el caso de divisor cero.
2. Convierte una cadena numerica y comunica claramente una entrada invalida.
3. Lanza InvalidArgumentException si una edad esta fuera del rango permitido.
4. Maneja una excepcion al abrir un archivo que no existe.
5. Usa finally para informar que una operacion termino, haya fallado o no.
6. Captura una excepcion especifica antes de una mas general.
7. Crea una funcion que valide un precio positivo y lance una excepcion si no lo es.
8. Propaga una excepcion desde una funcion auxiliar y capturala en quien la llama.
9. Diferencia un error de validacion esperado de un fallo inesperado.
10. Diseña una operacion segura que capture el error y conserve un mensaje util.
*/

// Zona de trabajo: escribe aqui tus soluciones.
