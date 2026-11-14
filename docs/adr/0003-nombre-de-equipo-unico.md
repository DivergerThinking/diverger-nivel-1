# 0003. Dos equipos no tienen el mismo nombre

- **Estado:** Propuesto
- **Fecha:** 14/11/2026
- **Contexto delimitado:** equipos

## Contexto

Dos nombres de equipo son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final: « portátil 07 » repite «Portátil 07», y el alta responde 409 «Ya hay un equipo con ese nombre». Dos altas a la vez con el mismo nombre no deben crear dos equipos.

## Opciones

1. **Transacción con un índice de nombres.** El nombre normalizado (sin espacios al principio ni al final y en minúsculas) es el id de un documento de `equipos_nombres`. El alta lee ese documento en una transacción; si existe, responde 409, y si no, crea el equipo en `equipos_equipos` y su nombre en `equipos_nombres`.
2. **Comprobar la lista de equipos antes de crear.** Listar los equipos, comparar los nombres normalizados y crear el equipo si no hay ninguno igual.

## Decisión

Opción 1. La opción 2 deja pasar dos altas simultáneas con el mismo nombre, y recorre todos los equipos en cada alta.

## Consecuencias

- El equipo guarda el nombre tal como se dio de alta, sin los espacios del principio y del final, y se devuelve así.
- El id del documento de `equipos_nombres` se codifica para que un nombre con «/» sea un id válido de Firestore.
