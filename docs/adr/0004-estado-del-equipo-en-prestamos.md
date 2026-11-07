# 0004. El estado del equipo lo lleva el contexto de préstamos

- **Estado:** Propuesto
- **Fecha:** 07/11/2026
- **Contexto delimitado:** equipos, prestamos

## Contexto

La API del cliente muestra cada equipo con su estado (`disponible`, `reservado` o `prestado`), su persona y su fecha de devolución. El catálogo de equipos (alta y nombre) y lo que les pasa con el tiempo (reservas, préstamos y devoluciones) son datos distintos, y la regla de un préstamo activo por equipo (ADR 0002) necesita que el estado y el historial se escriban juntos.

## Opciones

1. **El estado vive en `prestamos`.** `equipos` guarda el catálogo. `prestamos` guarda el préstamo activo y el historial, deduce el estado y responde `GET /api/equipos`, combinando el catálogo, que lee del `index.ts` de `equipos`, con sus préstamos activos.
2. **El estado vive en `equipos`.** `prestamos` tendría que escribir en las colecciones de `equipos` en la misma transacción que el historial, o `equipos` tendría que depender de `prestamos` para listar, lo que crearía un ciclo con la comprobación de que el equipo existe.

## Decisión

La opción 1. Cada contexto escribe solo en sus colecciones, no hay transacciones entre contextos y las dependencias van en un solo sentido: `prestamos` depende de `equipos`, y los dos dependen de `accesos`.

## Consecuencias

- `equipos` ofrece en su `index.ts` la consulta de un equipo por id y la lista del catálogo.
- La lista `GET /api/equipos` y la de vencidos combinan los dos datos en `prestamos`.
- Un equipo recién dado de alta aparece `disponible` porque no tiene préstamo activo.
