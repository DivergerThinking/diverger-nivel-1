# 0001. Un equipo tiene como mucho un préstamo activo

- **Estado:** Propuesto
- **Fecha:** 08/11/2026
- **Contexto delimitado:** prestamos

## Contexto

Un equipo no puede estar reservado o prestado dos veces a la vez. Si llegan a la vez dos peticiones para el mismo equipo disponible, sean solicitudes o préstamos en el mostrador, una sale bien y la otra recibe 409 «El equipo no está disponible». Comprobar el estado antes de escribir no basta: las dos peticiones leerían «disponible» y las dos escribirían.

## Opciones

1. **Documento del préstamo activo por equipo, dentro de una transacción.** La colección `prestamos_activos` tiene un documento por equipo, con el id del equipo, que apunta a su préstamo vigente (reservado o prestado). Solicitar y prestar leen ese documento y, si no existe, crean el préstamo y el documento en la misma transacción del puerto de persistencia (`Almacen.transaccion` de `lib/datos.ts`); si existe, responden 409. Entregar y apuntar la devolución lo leen y lo cambian o lo borran en otra transacción.
2. **Estado guardado en el documento del equipo.** El documento del equipo lleva su estado, persona y fecha de devolución, y la transacción lo lee y lo cambia. El equipo pertenece al contexto `equipos`, así que `prestamos` escribiría en una colección de otro contexto o haría una transacción que cruza contextos, y la constitución no lo permite.

## Decisión

La opción 1. Cada contexto escribe solo en sus colecciones, y la transacción del puerto de persistencia repite el trabajo si otra transacción cambia lo leído, así que de dos peticiones simultáneas solo una encuentra el equipo sin préstamo activo.

## Consecuencias

- El estado de un equipo (`disponible`, `reservado` o `prestado`) se deduce de su préstamo activo: sin documento en `prestamos_activos`, está disponible.
- Todas las operaciones que cambian el estado de un equipo pasan por una transacción que lee `prestamos_activos/<id del equipo>`.
- Los tests de concurrencia lanzan dos peticiones a la vez contra el mismo equipo y comprueban que una recibe 409 y que el equipo queda con una sola persona.
