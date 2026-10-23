/*
TEMA 17: EXCEPCIONES Y MANEJO DE ERRORES

`try` contiene codigo que podria lanzar una excepcion; `catch` recibe el
error; `finally` se ejecuta al salir, haya ocurrido error o no. `throw` lanza
un error. Para errores propios puedes crear instancias de Error o de clases
derivadas. Captura errores que puedas manejar y evita ocultarlos con catch
vacios: registra o comunica informacion util.

Sintaxis:
try {
  if (divisor === 0) throw new RangeError("El divisor no puede ser cero");
  console.log(10 / divisor);
} catch (error) {
  console.error(error.message);
} finally {
  console.log("Operacion terminada");
}

EJERCICIOS:
1. Protege una division y maneja el caso de divisor cero.
2. Convierte una entrada y comunica cuando no sea un numero valido.
3. Lanza RangeError si una edad sale del rango permitido.
4. Maneja un error al leer un archivo que no existe con Node.
5. Usa finally para informar que una operacion termino.
6. Distingue un TypeError de otros errores que puedas manejar.
7. Crea una funcion que valide precio positivo y lance un error si no lo es.
8. Propaga un error desde una funcion auxiliar y capturalo en quien la llama.
9. Diferencia una validacion normal de un fallo inesperado.
10. Maneja un error sin ocultarlo y conserva un mensaje util para diagnostico.
*/

// Zona de trabajo: escribe aqui tus soluciones.
