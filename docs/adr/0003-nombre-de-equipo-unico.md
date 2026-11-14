# 0003. El nombre de un equipo es único aunque lleguen dos altas a la vez

- **Estado:** Propuesto
- **Fecha:** 14/11/2026
- **Contexto delimitado:** equipos

## Contexto

Dos nombres de equipo son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final, y un alta con un nombre repetido responde 409 «Ya hay un equipo con ese nombre». Dos altas simultáneas con el mismo nombre podrían crear dos equipos si se comprueba y se escribe por separado.

## Opciones

1. **Transacción sobre un documento por nombre.** Un documento en `equipos_nombres` cuyo id es la clave del nombre (sin espacios al principio ni al final y en minúsculas). El alta lo lee y, si no existe, lo crea junto con el equipo en la misma transacción.
2. **Buscar el nombre en la lista de equipos antes de crear.** Sin documento por nombre: se listan los equipos y se compara la clave, y después se crea el equipo.

## Decisión

Opción 1. La opción 2 deja una ventana entre la búsqueda y la escritura en la que dos altas pasan a la vez. La transacción del puerto de persistencia la cierra.

## Consecuencias

- El alta lee `equipos_nombres/<clave>` y escribe ese documento y el del equipo en la misma transacción.
- La clave del nombre se calcula en un solo sitio del contexto `equipos`.
