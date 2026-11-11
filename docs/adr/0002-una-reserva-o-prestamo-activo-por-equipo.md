# 0002. Un equipo tiene como mucho una reserva o un préstamo activo

- **Estado:** Propuesto
- **Fecha:** 11/11/2026
- **Contexto delimitado:** prestamos

## Contexto

Un equipo no puede estar reservado o prestado dos veces a la vez. Si llegan dos peticiones a la vez para el mismo equipo disponible (dos solicitudes, o una solicitud y un préstamo en el mostrador), una sale bien y la otra recibe 409 «El equipo no está disponible». Comprobar el estado y escribir después no basta: las dos peticiones leerían «disponible».

## Opciones

1. **Transacción del almacén sobre el estado del equipo.** Un documento por equipo en `prestamos_estados`, con el id del equipo. La solicitud, la entrega, el préstamo y la devolución leen ese documento y escriben el nuevo estado y el registro del préstamo en la misma transacción (`almacen.transaccion` de `lib/datos.ts`). Si otra petición cambia el estado antes de terminar, la transacción se repite y entonces ve el equipo ocupado.
2. **Documento de préstamo activo que solo se crea si no existe.** Un documento por equipo cuyo id es el del equipo, creado con «crear si no existe» y borrado en la devolución.

## Decisión

Opción 1. El puerto de persistencia de la plantilla ofrece transacciones con reintento y no ofrece «crear si no existe»; además, la misma transacción cubre todas las transiciones de estado (reservado, prestado, disponible) y el historial, no solo el alta del préstamo.

## Consecuencias

- Toda transición de estado de un equipo se hace dentro de una transacción que primero lee el documento de estado y después escribe.
- Los tests de concurrencia lanzan dos peticiones a la vez y comprueban un 201 y un 409.
- La opción 2 queda descartada; volver a ella sería un ADR nuevo.
