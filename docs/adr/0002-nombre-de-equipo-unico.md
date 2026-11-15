# 0002. Dos equipos no tienen el mismo nombre normalizado

- **Estado:** Propuesto
- **Fecha:** 15/11/2026
- **Contexto delimitado:** equipos

## Contexto

Dos nombres de equipo son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final, y un alta repetida responde 409 «Ya hay un equipo con ese nombre». Comprobar la lista de equipos antes de guardar no basta: dos altas del mismo nombre a la vez pasarían las dos la comprobación.

## Opciones

1. **Documento por nombre normalizado en una transacción.** La colección `equipos_nombres` tiene un documento cuyo id es el nombre normalizado (sin espacios al principio y al final, en minúsculas). El alta lee ese documento en una transacción del puerto de persistencia y, si no existe, crea el nombre y el equipo; si existe, responde 409.
2. **Comprobar la lista y guardar.** Listar los equipos, comparar los nombres normalizados y guardar el nuevo, sin transacción.

## Decisión

Opción 1: la transacción hace que de dos altas simultáneas del mismo nombre solo una cree el documento, y la otra vuelve a leer y responde 409. La opción 2 deja pasar el caso simultáneo.

## Consecuencias

- `equipos` escribe dos colecciones propias, `equipos_equipos` y `equipos_nombres`, siempre en la misma transacción.
- Los tests del alta incluyen dos peticiones simultáneas con « portátil 07 » y «Portátil 07».
