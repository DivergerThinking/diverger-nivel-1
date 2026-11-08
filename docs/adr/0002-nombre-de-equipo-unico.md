# 0002. El nombre de un equipo es único

- **Estado:** Propuesto
- **Fecha:** 08/11/2026
- **Contexto delimitado:** equipos

## Contexto

Dos equipos no pueden tener el mismo nombre. Dos nombres son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final: « portátil 07 » repite «Portátil 07». Si dos altas con el mismo nombre llegan a la vez, buscar el nombre antes de escribir dejaría pasar las dos.

## Opciones

1. **Documento por nombre normalizado, dentro de una transacción.** La colección `equipos_nombres` tiene un documento cuyo id es el nombre normalizado (sin espacios al principio ni al final y en minúsculas) y que apunta al equipo. El alta lee ese documento y, si no existe, crea el equipo y el documento en la misma transacción; si existe, responde 409 «Ya hay un equipo con ese nombre».
2. **Buscar el nombre en la lista de equipos antes de crear.** Más simple, pero dos altas simultáneas con el mismo nombre crean dos equipos.

## Decisión

La opción 1: garantiza la regla también con altas simultáneas, con la transacción del puerto de persistencia y sin índices propios de la base de datos.

## Consecuencias

- El nombre se guarda tal como lo escribe IT, sin los espacios del principio y del final; el normalizado solo sirve de clave.
- El inventario de IT puede dar de alta equipos a la vez que una persona de IT sin crear duplicados.
