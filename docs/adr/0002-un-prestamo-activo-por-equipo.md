# 0002. Un equipo tiene como mucho una reserva o un préstamo activo

- **Estado:** Propuesto
- **Fecha:** 07/11/2026
- **Contexto delimitado:** prestamos

## Contexto

Un equipo no puede estar reservado o prestado dos veces a la vez. Si llegan dos solicitudes, o una solicitud y un préstamo en el mostrador, para el mismo equipo disponible, una sale bien y la otra recibe 409 «El equipo no está disponible». Comprobar el estado antes de escribir no basta: las dos peticiones pueden leer «disponible» antes de que ninguna escriba.

## Opciones

1. **Documento del préstamo activo por equipo, en una transacción.** En la colección `prestamos_activos`, el id del documento es el id del equipo. La transacción del puerto de persistencia (`lib/datos.ts`) lee ese documento y, solo si no existe, lo crea junto con la entrada del historial. Si otra transacción lo crea antes, la transacción se repite, ve el documento y responde 409.
2. **Campo de estado en el documento del equipo.** La transacción lee el estado del equipo y lo cambia. Obliga a que el contexto que presta escriba en la colección del catálogo de equipos, y por tanto a una transacción que cruza contextos.

## Decisión

La opción 1. Garantiza la regla con una sola transacción dentro del contexto `prestamos`, que escribe solo en sus colecciones, como pide la constitución. El estado del equipo se deduce del documento activo: sin documento, `disponible`.

## Consecuencias

- La solicitud, el préstamo en el mostrador, la entrega y la devolución leen y escriben `prestamos_activos` y `prestamos_historial` en la misma transacción.
- La devolución borra el documento activo y marca su entrada del historial como `devuelto`.
- Las pruebas lanzan peticiones en paralelo contra el almacén en memoria y contra Firestore, y comprueban que exactamente una devuelve 201.
