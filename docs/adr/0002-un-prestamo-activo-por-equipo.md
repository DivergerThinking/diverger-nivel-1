# 0002. Un equipo tiene como mucho una reserva o un préstamo activo

- **Estado:** Propuesto
- **Fecha:** 14/11/2026
- **Contexto delimitado:** prestamos

## Contexto

Un equipo no puede estar reservado o prestado dos veces a la vez. Si llegan a la vez dos peticiones para el mismo equipo disponible, sean solicitudes o préstamos en el mostrador, una sale bien y la otra recibe 409 «El equipo no está disponible»; nunca salen bien las dos. Comprobar el estado y escribir después no basta: las dos peticiones pueden leer «disponible» antes de que ninguna escriba.

## Opciones

1. **Transacción sobre el préstamo activo del equipo.** Un documento por equipo en `prestamos_activos`, con el id del equipo, que guarda el préstamo en curso. La solicitud y el préstamo en el mostrador lo leen y, si no existe, lo crean junto con el préstamo en la misma transacción del puerto de persistencia (`almacen.transaccion`). Si otra petición lo crea antes, la transacción se repite, lo encuentra y responde 409.
2. **Crear el documento solo si no existe.** El mismo documento por equipo, creado con una operación de Firestore que falla si ya existe, sin transacción.

## Decisión

Opción 1. El puerto de persistencia de la plantilla (`lib/datos.ts`) ofrece transacciones y no ofrece «crear si no existe», y la constitución prohíbe usar el cliente de la base directamente. La transacción también deja el préstamo y su documento activo siempre a la vez, y sirve igual para la entrega y la devolución.

## Consecuencias

- Toda escritura que cambia el estado de un equipo (solicitud, préstamo en el mostrador, entrega y devolución) va en una transacción que primero lee `prestamos_activos/<id del equipo>` y después escribe.
- Las transacciones leen todo antes de escribir, como exige Firestore.
- Los tests de aceptación lanzan peticiones concurrentes reales contra el mismo equipo y comprueban que solo una sale bien.
