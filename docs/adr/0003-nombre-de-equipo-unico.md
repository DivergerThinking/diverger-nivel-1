# 0003. El nombre de un equipo es único

- **Estado:** Propuesto
- **Fecha:** 11/11/2026
- **Contexto delimitado:** equipos

## Contexto

No puede haber dos equipos con el mismo nombre: dos nombres son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final. Dos altas simultáneas con el mismo nombre no deben crear dos equipos.

## Opciones

1. **Índice de nombres en una transacción.** Un documento en `equipos_nombres` cuyo id es el nombre normalizado (sin espacios en los extremos y en minúsculas). El alta lee ese documento y, si no existe, escribe el índice y el equipo en la misma transacción; si existe, responde 409 «Ya hay un equipo con ese nombre».
2. **Listar y comparar.** Leer todos los equipos, comparar los nombres normalizados y guardar el nuevo si no se repite.

## Decisión

Opción 1. Es atómica con el puerto de persistencia y no depende del número de equipos; la opción 2 deja pasar dos altas simultáneas y lee toda la colección en cada alta.

## Consecuencias

- El nombre se guarda como lo escribió IT y su forma normalizada solo se usa como id del índice.
- Los tests comprueban « portátil 07 » frente a «Portátil 07» y dos altas simultáneas.
