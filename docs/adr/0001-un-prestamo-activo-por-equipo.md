# 0001. Un equipo tiene como mucho una reserva o un préstamo activo

- **Estado:** Propuesto
- **Fecha:** 09/11/2026
- **Contexto delimitado:** prestamos

## Contexto

Un equipo no puede estar reservado o prestado dos veces a la vez. Si llegan dos peticiones a la vez para el mismo equipo disponible, sean solicitudes o préstamos en el mostrador, una sale bien y la otra recibe 409 «El equipo no está disponible»; nunca salen bien las dos. Comprobar el estado antes de escribir no basta: las dos peticiones pueden leer «disponible» antes de que ninguna escriba.

## Opciones

1. **Transacción sobre el préstamo activo del equipo.** Un documento por equipo en `prestamos_activos`, cuyo id es el id del equipo. La solicitud y el préstamo en el mostrador leen ese documento y lo crean en la misma transacción (`Almacen.transaccion` del puerto `lib/datos.ts`) solo si no existe; la entrega lo actualiza y la devolución lo borra, también en transacción.
2. **Transacción que lee todos los préstamos del equipo.** Consultar en `prestamos_prestamos` los préstamos no devueltos del equipo y crear el nuevo en la misma transacción. Firestore no bloquea por consulta en todos los modos, y la regla depende de un índice.

## Decisión

La opción 1: el documento del préstamo activo con el id del equipo hace que dos escrituras sobre el mismo equipo choquen en el mismo documento, y la transacción reintenta o falla la segunda, que responde 409 «El equipo no está disponible». La entrada del historial en `prestamos_prestamos` se escribe en la misma transacción.

## Consecuencias

- El estado de un equipo (`disponible`, `reservado`, `prestado`) se deduce de su préstamo activo: sin documento, está disponible.
- Los tests de aceptación prueban dos peticiones simultáneas; los tests unitarios usan el doble en memoria del puerto, que también serializa las transacciones.
- La opción 2 queda descartada por depender de consultas dentro de transacciones.
