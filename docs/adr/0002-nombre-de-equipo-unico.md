# 0002. El nombre de un equipo no se repite

- **Estado:** Propuesto
- **Fecha:** 09/11/2026
- **Contexto delimitado:** equipos

## Contexto

Dos equipos no pueden tener el mismo nombre, y dos nombres son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final: « portátil 07 » repite «Portátil 07». Si dos altas con el mismo nombre llegan a la vez, consultar antes de escribir no impide que se creen las dos.

## Opciones

1. **Documento por nombre normalizado.** Una colección `equipos_nombres` con un documento cuyo id es el nombre normalizado (sin espacios al principio y al final y en minúsculas). El alta lo crea en la misma transacción que el equipo, solo si no existe; si existe, responde 409 «Ya hay un equipo con ese nombre».
2. **Consulta por nombre normalizado dentro de una transacción.** Guardar el nombre normalizado en el equipo y consultarlo antes de crear. Depende de consultas dentro de transacciones.

## Decisión

La opción 1, por la misma razón que el ADR 0001: la colisión se produce en un único documento y la transacción la detecta.

## Consecuencias

- El equipo guarda el nombre tal como se dio de alta, sin los espacios al principio y al final; el documento de `equipos_nombres` solo sirve para la unicidad.
- La normalización vive en una función del contexto `equipos` con sus tests.
