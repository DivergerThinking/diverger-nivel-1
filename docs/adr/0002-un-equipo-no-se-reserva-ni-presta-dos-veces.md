# 0002. Un equipo no se reserva ni se presta dos veces a la vez

- **Estado:** Propuesto
- **Fecha:** 25/11/2026
- **Contexto delimitado:** prestamos

## Contexto

Un equipo solo puede estar disponible, reservado o prestado. Si llegan a la vez dos solicitudes, o una solicitud y un préstamo en el mostrador, para el mismo equipo disponible, una sale bien y la otra recibe 409 «El equipo no está disponible»; nunca salen bien las dos. Comprobar el estado y después escribir no basta: las dos peticiones leerían «disponible».

## Opciones

1. **Transacción de Firestore sobre el estado del equipo.** El contexto guarda un documento por equipo con su estado, persona y fecha de devolución; cada solicitud, préstamo, entrega y devolución lee ese documento y escribe el nuevo estado y la entrada del historial en la misma transacción. Firestore reintenta o rechaza la transacción que pierde.
2. **Documento del préstamo activo con el id del equipo.** Se crea solo si no existe (create) y se borra al devolver; la segunda creación falla.

## Decisión

Opción 1: cubre con el mismo mecanismo todas las transiciones (reservar, prestar, entregar, devolver), y el historial se escribe en la misma transacción. La opción 2 solo protege la creación y obliga a coordinar aparte el resto de cambios de estado.

## Consecuencias

- Todas las escrituras de estado pasan por una transacción del puerto de persistencia (`lib/datos.ts`).
- Hay un test que lanza dos peticiones a la vez sobre el mismo equipo y comprueba que solo una sale bien y que el historial tiene un único préstamo nuevo.
