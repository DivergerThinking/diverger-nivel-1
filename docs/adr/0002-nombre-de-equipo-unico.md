# 0002. El nombre de un equipo es único

- **Estado:** Propuesto
- **Fecha:** 08/11/2026
- **Contexto delimitado:** equipos

## Contexto

Dos equipos no pueden tener el mismo nombre, y dos nombres son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final: « portátil 07 » repite «Portátil 07». Dos altas a la vez con el mismo nombre no pueden salir bien las dos.

## Opciones

1. **Un documento por nombre normalizado.** En `equipos_nombres`, con id igual al nombre sin espacios en los extremos y en minúsculas, que apunta al id del equipo. El alta lee ese documento y crea el equipo y el nombre en la misma transacción de `Almacen.transaccion`.
2. **Buscar en la lista antes de guardar.** Listar `equipos_equipos`, comparar los nombres y guardar si no hay ninguno igual.

## Decisión

La opción 1. La opción 2 no es atómica: dos altas a la vez no ven el equipo de la otra y guardan las dos. Además obliga a leer toda la colección en cada alta.

## Consecuencias

- El alta responde 409 «Ya hay un equipo con ese nombre» cuando el documento del nombre normalizado ya existe.
- El nombre que se guarda y se devuelve es el que se envió; solo el id del documento de `equipos_nombres` está normalizado.
