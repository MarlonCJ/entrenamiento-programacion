/*
TEMA 17: EXCEPCIONES Y ERRORES unknown

`try` contiene codigo que podria fallar, `catch` maneja el error y `finally`
se ejecuta al salir. En TypeScript el valor capturado es unknown en modo
estricto: comprueba `instanceof Error` antes de leer message. Lanza instancias
de Error o subclases. Los tipos estaticos no eliminan errores de ejecucion.

Sintaxis:
try {
  throw new RangeError("Valor fuera de rango");
} catch (error: unknown) {
  if (error instanceof Error) console.error(error.message);
} finally {
  console.log("Finalizado");
}

EJERCICIOS:
1. Protege division por cero con una validacion.
2. Maneja error de conversion de datos sin usar any.
3. Lanza RangeError para edad fuera de rango.
4. Maneja error de archivo inexistente con Node.
5. Usa finally para liberar o informar cierre.
6. Distingue TypeError de Error general.
7. Valida precio y lanza excepcion si es negativo.
8. Propaga error de funcion auxiliar y capturalo arriba.
9. Diferencia dato invalido de fallo inesperado.
10. Comunica un mensaje util y conserva contexto de error.
*/

// Zona de trabajo: escribe aqui tus soluciones.
