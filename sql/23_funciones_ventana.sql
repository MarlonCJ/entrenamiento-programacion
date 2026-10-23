/*
TEMA 23: FUNCIONES DE VENTANA

Una funcion de ventana calcula sobre filas relacionadas sin colapsarlas como
GROUP BY. OVER define ventana; PARTITION BY separa grupos y ORDER BY define
orden. SQLite soporta ROW_NUMBER, RANK, LAG, LEAD y agregados como ventana.
Comprueba version del motor si una funcion no esta disponible.

Sintaxis:
SELECT nombre, nota,
       ROW_NUMBER() OVER (PARTITION BY curso_id ORDER BY nota DESC) AS puesto
FROM resultados;

EJERCICIOS:
1. Numera pedidos por fecha usando ROW_NUMBER.
2. Calcula ranking de notas por curso con RANK.
3. Muestra venta anterior por cliente con LAG.
4. Calcula total acumulado de ventas por fecha.
5. Encuentra el pedido mas alto de cada cliente con ranking.
6. Compara ROW_NUMBER, RANK y DENSE_RANK con empates.
7. Calcula promedio movil de ventas.
8. Usa PARTITION BY para reiniciar numeracion por categoria.
9. Muestra valor siguiente de una serie con LEAD.
10. Explica por que ventana conserva filas y GROUP BY las agrupa.
*/
