# 0003. El nombre de un equipo es único, también con altas simultáneas

- **Estado:** Propuesto
- **Fecha:** 07/11/2026
- **Contexto delimitado:** equipos

## Contexto

Dos equipos no pueden tener el mismo nombre. Dos nombres son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final, y el repetido recibe 409 «Ya hay un equipo con ese nombre». Si dos altas con el mismo nombre llegan a la vez, buscar el nombre en la lista antes de guardar no impide que entren las dos.

## Opciones

1. **Documento por nombre normalizado, en una transacción.** En la colección `equipos_nombres`, el id del documento es el nombre sin espacios al principio ni al final y en minúsculas. La transacción lo lee y, solo si no existe, lo crea junto con el equipo.
2. **Buscar el nombre en la lista de equipos antes de guardar**, sin transacción. Es más sencillo, pero deja pasar dos altas simultáneas.

## Decisión

La opción 1. Con muy poco código más, la unicidad no depende de que las altas lleguen de una en una.

## Consecuencias

- El alta escribe `equipos` y `equipos_nombres` en la misma transacción.
- La normalización (recortar y pasar a minúsculas) está en un solo sitio del contexto y tiene sus pruebas, con «PORTÁTIL 07» y « portátil 07 ».
