# 0003. El nombre de un equipo es único

- **Estado:** Propuesto
- **Fecha:** 25/11/2026
- **Contexto delimitado:** equipos

## Contexto

Dos nombres de equipo son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final; el alta de un nombre repetido responde 409 «Ya hay un equipo con ese nombre». Dos altas simultáneas del mismo nombre podrían pasar las dos si se busca el nombre y después se escribe.

## Opciones

1. **Documento índice por nombre normalizado.** El nombre se normaliza (sin espacios alrededor y en minúsculas) y, en la misma transacción, se crea el documento del índice con ese nombre como id y el equipo; si el índice ya existe, la transacción falla con 409.
2. **Buscar por nombre normalizado y después escribir.** Más simple, pero dos altas a la vez pueden crear dos equipos con el mismo nombre.

## Decisión

Opción 1: garantiza la unicidad también con peticiones simultáneas y cuesta una escritura más por alta.

## Consecuencias

- La colección `nombresEquipo` solo la escribe el contexto `equipos`.
- Se guarda el nombre tal como lo escribió IT, sin los espacios de alrededor, y aparte el normalizado.
