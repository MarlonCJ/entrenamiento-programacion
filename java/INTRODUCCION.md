# Introduccion a Java

## Que es Java

Java es un lenguaje de programacion de proposito general, tipado estatico y orientado a objetos. El codigo fuente se compila a bytecode, que puede ejecutarse en una maquina virtual Java (JVM). Esto permite usar Java en aplicaciones de escritorio, servidores y sistemas empresariales en distintas plataformas.

## Para que se utiliza

- Crear aplicaciones y servicios de backend.
- Desarrollar sistemas empresariales de larga duracion.
- Construir aplicaciones Android (junto con las herramientas Android).
- Crear herramientas, aplicaciones de escritorio y programas educativos.

## Herramientas necesarias

1. **JDK (Java Development Kit)**: incluye el compilador `javac` y el lanzador `java`. Se necesita un JDK para compilar y ejecutar estos ejercicios.
2. **Visual Studio Code**: editor para escribir, ejecutar y depurar archivos `.java`.
3. **Extension Pack for Java de Microsoft**: agrega soporte de lenguaje, ejecucion, depuracion y administracion de proyectos.
4. **Terminal de Windows**: permite comprobar la instalacion y ejecutar los programas compilados.

Para estos ejercicios no hace falta Maven ni Gradle.

## Como funciona un programa Java

Java declara tipos y organiza el codigo en clases. El nombre de una clase publica debe coincidir con el nombre del archivo. `javac` compila el `.java`; `java` ejecuta la clase resultante.

```java
public class Hola {
    public static void main(String[] args) {
        String nombre = "Ana";
        System.out.println("Hola, " + nombre);
    }
}
```

En este repositorio las clases ya tienen un metodo `main`. Desde la raiz, compila y ejecuta, por ejemplo, `javac java\Tema01Variables.java` y `java -cp java Tema01Variables`. La carpeta contiene 24 temas numerados; empieza por el 01 y avanza en orden.

## Siguiente paso

Continua con la [guia para instalar un JDK y configurar VS Code en Windows](./INSTALACION.md) y luego practica con los archivos tematicos de este directorio.
