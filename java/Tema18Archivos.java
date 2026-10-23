import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/*
 * TEMA 18: LECTURA Y ESCRITURA DE ARCHIVOS
 *
 * `Path` representa una ruta y `Files` ofrece operaciones de lectura y
 * escritura. `readString` lee texto y `writeString` escribe texto. Las
 * operaciones pueden lanzar IOException, que Java obliga a manejar o declarar.
 * Usa archivos de practica y rutas controladas; no sobrescribas datos propios.
 *
 * Sintaxis:
 * Path ruta = Path.of("datos.txt");
 * try {
 *     String contenido = Files.readString(ruta);
 *     Files.writeString(Path.of("salida.txt"), contenido);
 * } catch (IOException error) {
 *     System.out.println("No se pudo acceder al archivo");
 * }
 *
 * EJERCICIOS:
 * 1. Escribe una frase en un archivo de practica.
 * 2. Lee y muestra el contenido de un archivo de notas.
 * 3. Cuenta las lineas de un archivo.
 * 4. Agrega una linea sin borrar lo que ya existe.
 * 5. Guarda nombres, uno por linea, y vuelvelos a leer.
 * 6. Cuenta cuantos caracteres contiene un archivo.
 * 7. Maneja el caso en que el archivo no exista.
 * 8. Copia un archivo de entrada en otro archivo de salida.
 * 9. Cuenta las palabras contenidas en un archivo.
 * 10. Lee un registro de gastos y calcula el total.
 */
public class Tema18Archivos {
    public static void main(String[] args) {
        // Zona de trabajo: escribe aqui tus soluciones.
    }
}
