<?php

declare(strict_types=1);

/*
TEMA 21: HERENCIA, ABSTRACCION Y POLIMORFISMO

La herencia permite que una clase extienda otra. Una clase abstracta define
comportamiento comun y metodos que las hijas deben implementar. Una interfaz
declara un contrato; una clase puede implementar varias interfaces. El
polimorfismo permite tratar objetos diferentes mediante el mismo tipo o
contrato. Prefiere composicion cuando modelar una relacion "tiene un" sea mas
claro que heredar una relacion "es un".

Sintaxis:
interface Pagable { public function calcularTotal(): float; }
abstract class Producto implements Pagable {
    abstract public function calcularTotal(): float;
}
class Libro extends Producto {
    public function calcularTotal(): float { return 10.0; }
}

EJERCICIOS:
1. Crea una clase base Animal y dos clases hijas con sonidos distintos.
2. Sobrescribe un metodo y explica que version se ejecuta en cada objeto.
3. Crea una clase abstracta Figura con un metodo abstracto area.
4. Implementa Figura en circulo y rectangulo y calcula ambas areas.
5. Define una interfaz Notificable y aplicala a dos clases diferentes.
6. Recorre una lista de figuras y calcula sus areas sin comprobar cada clase.
7. Crea una jerarquia de empleados con calculos de salario especializados.
8. Compara herencia con composicion en un carrito que usa un metodo de pago.
9. Evita duplicacion extrayendo comportamiento comun en una clase base.
10. Diseña un sistema de pagos extensible a un nuevo metodo sin modificar el cliente.
*/

// Zona de trabajo: escribe aqui tus soluciones.
