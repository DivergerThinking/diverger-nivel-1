# 0003. Un equipo no se reserva ni se presta dos veces a la vez

- **Estado:** Propuesto
- **Fecha:** 15/11/2026
- **Contexto delimitado:** prestamos

## Contexto

Un equipo está `disponible`, `reservado` o `prestado`, y nunca reservado o prestado dos veces a la vez. Si llegan dos peticiones a la vez para el mismo equipo disponible, sean solicitudes o préstamos en el mostrador, una sale bien y la otra recibe 409 «El equipo no está disponible». Comprobar el estado y después escribirlo no basta: las dos peticiones leerían `disponible`.

## Opciones

1. **Transacción sobre el estado del equipo.** El estado de cada equipo vive en `prestamos_estados`, un documento por equipo con el id del equipo. La solicitud, el préstamo en el mostrador, la entrega y la devolución leen ese documento y escriben el nuevo estado y la entrada del historial en una transacción del puerto de persistencia (`Almacen.transaccion`); si otra transacción lo cambia antes, la segunda se repite, lee el estado nuevo y responde 409.
2. **Documento del préstamo activo creado solo si no existe.** Un documento por equipo, con el id del equipo, que se crea al reservar o prestar y se borra al devolver; la creación falla si ya existe.

## Decisión

Opción 1. El puerto de persistencia de la plantilla ya ofrece transacciones que se repiten ante un conflicto, y la misma transacción cubre todas las transiciones (reservar, prestar, entregar y devolver) y la escritura del historial. La opción 2 necesita una operación «crear si no existe» que el puerto no tiene, y la entrega y la devolución seguirían necesitando transacción.

## Consecuencias

- El estado del equipo es de `prestamos`, no de `equipos`: `equipos` solo guarda el nombre, y `prestamos` lo consulta por su `index.ts`. Un equipo sin documento en `prestamos_estados` está disponible.
- No hay transacciones entre contextos: la existencia del equipo se comprueba en `equipos` antes de la transacción, y los equipos no se borran.
- Los tests de aceptación lanzan peticiones simultáneas contra el almacén en memoria, que ejecuta las transacciones de una en una igual que Firestore.
