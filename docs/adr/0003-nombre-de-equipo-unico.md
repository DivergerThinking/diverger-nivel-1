# 0003. El nombre de un equipo es único con un documento por nombre normalizado

- **Estado:** Propuesto
- **Fecha:** 06/11/2026
- **Contexto delimitado:** equipos

## Contexto

Dos equipos no pueden tener el mismo nombre, y dos nombres son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final. Si se comprueba recorriendo la lista de equipos, dos altas a la vez con «Portátil 07» y « portátil 07 » podrían salir bien las dos.

## Opciones

1. **Documento por nombre normalizado dentro de una transacción.** La colección `equipos_nombres` usa como id el nombre normalizado (sin espacios en los extremos y en minúsculas). El alta lee ese documento en una transacción y, si no existe, crea en la misma transacción el equipo y el documento del nombre; si existe, responde 409 «Ya hay un equipo con ese nombre».
2. **Recorrer todos los equipos y comparar.** Más sencillo, pero no impide dos altas simultáneas con el mismo nombre y crece con el inventario.

## Decisión

Opción 1. Garantiza la unicidad también con peticiones a la vez y usa solo lo que ofrece el puerto de persistencia (`obtener` y `guardar` en una transacción).

## Consecuencias

- La normalización se hace en un solo sitio del contexto `equipos` y la usan el alta y las pruebas.
- Si algún día se renombra o se da de baja un equipo, hay que mover o borrar su documento de nombre en la misma transacción.
