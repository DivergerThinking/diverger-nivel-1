# 0002. Los nombres de equipo son únicos

- **Estado:** Propuesto
- **Fecha:** 07/11/2026
- **Contexto delimitado:** equipos

## Contexto

Dos nombres de equipo son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final, y dar de alta un nombre repetido responde 409 «Ya hay un equipo con ese nombre». Dos altas simultáneas del mismo nombre no pueden salir bien las dos.

## Opciones

1. **Documento por nombre normalizado, en una transacción.** La colección `equipos_nombres` usa como id el nombre normalizado (sin espacios en los extremos y en minúsculas). El alta lee ese documento y, si no existe, lo crea junto con el equipo en la misma transacción.
2. **Recorrer todos los equipos.** Listar los equipos y comparar los nombres antes de guardar, sin transacción.

## Decisión

Opción 1. Es atómica con el puerto de persistencia y no depende del número de equipos. La opción 2 deja pasar dos altas simultáneas del mismo nombre.

## Consecuencias

- El nombre se guarda tal como llega, sin los espacios de los extremos; la comparación usa la forma normalizada.
- Un test da de alta a la vez «Portátil 07» y « portátil 07 » y comprueba que solo una sale bien.
