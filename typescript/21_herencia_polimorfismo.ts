/*
TEMA 21: HERENCIA, ABSTRACCION Y POLIMORFISMO

`extends` hereda de una clase y `super` invoca constructor o metodo base.
Una clase abstracta puede declarar metodos que las clases concretas deben
implementar. Interfaces describen contratos; el polimorfismo permite trabajar
con distintos objetos mediante ese contrato. Prefiere composicion a jerarquias
profundas cuando un objeto usa otro colaborador.

Sintaxis:
abstract class Figura { abstract area(): number; }
class Cuadrado extends Figura {
  constructor(private lado: number) { super(); }
  area(): number { return this.lado ** 2; }
}

EJERCICIOS:
1. Animal y dos clases derivadas con sonidos.
2. Sobrescribe metodo y observa despacho polimorfico.
3. Figura abstracta con metodo area.
4. Circulo y rectangulo implementan calculo de area.
5. Interfaz Notificable con dos implementaciones.
6. Recorre objetos de tipos distintos por interfaz comun.
7. Empleados con calculos salariales especializados.
8. Inyecta metodo de pago por composicion.
9. Extrae comportamiento comun sin duplicarlo.
10. Agrega nuevo metodo de pago sin cambiar el consumidor.
*/

// Zona de trabajo: escribe aqui tus soluciones.
