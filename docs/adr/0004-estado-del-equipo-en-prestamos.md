# 0004. El estado de un equipo vive en el contexto de préstamos

- **Estado:** Propuesto
- **Fecha:** 06/11/2026
- **Contexto delimitado:** equipos, prestamos

## Contexto

La aplicación tiene dos contextos: `equipos`, que da de alta los equipos, y `prestamos`, que registra lo que les pasa con el tiempo. El estado de un equipo (disponible, reservado o prestado), la persona y la fecha de devolución cambian con cada solicitud, entrega, préstamo y devolución, y esos cambios tienen que ser atómicos (ADR 0001). No puede haber transacciones que crucen contextos.

## Opciones

1. **El estado vive en `prestamos`.** `prestamos` guarda el estado de cada equipo y su historial, y lee los equipos de `equipos` a través de su `index.ts`. Un equipo sin documento de estado está disponible. El listado de equipos con su estado (`GET /api/equipos`) lo sirve `prestamos`, que tiene los dos datos.
2. **El estado vive en `equipos`.** `prestamos` tendría que escribir en las colecciones de `equipos` o pedirle cada cambio, y la reserva y la entrada del historial ya no podrían ir en la misma transacción.

## Decisión

Opción 1. Cada contexto escribe solo en sus colecciones, las operaciones que cambian el estado son atómicas dentro de `prestamos` y la dependencia va en un solo sentido: `prestamos` depende de `equipos`.

## Consecuencias

- `equipos` expone en su `index.ts` la lectura de un equipo, la lista de equipos y la comprobación de si una cuenta es de IT.
- `GET /api/equipos` está en el contrato de `prestamos` y `POST /api/equipos` en el de `equipos`.
- Un equipo recién dado de alta no tiene documento de estado y se lista como disponible.
