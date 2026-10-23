<?php

declare(strict_types=1);

/*
TEMA 20: PROGRAMACION ORIENTADA A OBJETOS

Una clase define datos y comportamientos; un objeto es una instancia. Las
propiedades guardan estado y los metodos realizan acciones. `public`,
`protected` y `private` controlan acceso. El constructor inicializa el objeto.
Encapsula el estado y valida los cambios; no hagas publica cada propiedad
sin necesidad.

Sintaxis:
class Producto
{
    public function __construct(
        private string $nombre,
        private float $precio
    ) {}

    public function obtenerPrecio(): float
    {
        return $this->precio;
    }
}
$producto = new Producto('Libro', 12.5);

EJERCICIOS:
1. Crea una clase Persona con nombre y un metodo para presentarse.
2. Crea una clase Rectangulo que calcule area y perimetro.
3. Crea una clase CuentaBancaria con depositar y retirar.
4. Valida que el precio de un Producto no sea negativo.
5. Crea un constructor que inicialice las propiedades requeridas.
6. Usa propiedades privadas y metodos publicos para consultar estado.
7. Crea una clase Libro con titulo, autor y un metodo de descripcion.
8. Modela un Termometro con un metodo para convertir Celsius a Fahrenheit.
9. Crea una clase Carrito que almacene varios productos y calcule total.
10. Diseña clases para estudiante y curso, y relaciona sus responsabilidades.
*/

// Zona de trabajo: escribe aqui tus soluciones.
