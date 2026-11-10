# 0002. Dos equipos no tienen el mismo nombre

- **Estado:** Propuesto
- **Fecha:** 10/11/2026
- **Contexto delimitado:** equipos

## Contexto

Dos nombres de equipo son el mismo si solo se diferencian en mayúsculas o en espacios al principio o al final: « portátil 07 » repite «Portátil 07», y el segundo alta responde 409 «Ya hay un equipo con ese nombre». Dos altas simultáneas con el mismo nombre podrían pasar las dos la comprobación si se hace leyendo la lista antes de escribir.

## Opciones

1. **Documento por nombre normalizado, en una transacción.** La colección `equipos_nombres` tiene un documento cuyo id es el nombre normalizado (sin espacios en los extremos y en minúsculas). El alta lo lee y, si no existe, lo crea junto con el equipo en la misma transacción.
2. **Listar los equipos y comparar.** Leer todos los equipos, comparar los nombres normalizados y crear el equipo si no hay coincidencia. No es atómico: dos altas a la vez pueden crear el mismo nombre.

## Decisión

Opción 1: garantiza la regla también con altas simultáneas y usa solo lecturas por id y escrituras atómicas del puerto de persistencia.

## Consecuencias

- El nombre se guarda tal como llega, sin los espacios de los extremos; la normalización solo sirve para la comprobación.
- Un id de documento no puede contener «/»: el nombre normalizado se codifica antes de usarlo como id.
