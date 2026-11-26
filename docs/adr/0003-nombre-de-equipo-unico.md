# 0003. El nombre de un equipo es único

- **Estado:** Propuesto
- **Fecha:** 26/11/2026
- **Contexto delimitado:** equipos

## Contexto

Dos nombres de equipo son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final. Dos altas simultáneas con el mismo nombre no deben crear dos equipos.

## Opciones

1. **Documento de reserva del nombre normalizado, en una transacción.** La colección `nombresEquipos` usa como id el nombre recortado y en minúsculas; el alta crea ese documento y el equipo en la misma transacción solo si el nombre no existe.
2. **Consultar por nombre antes de crear**, sin transacción. Dos altas a la vez pasarían las dos.

## Decisión

Opción 1: la comprobación y la escritura son atómicas y la segunda alta recibe 409 «Ya hay un equipo con ese nombre».

## Consecuencias

- El equipo guarda el nombre tal como se dio («Portátil 07»); la normalización solo se usa como clave.
