# 0004. La lista de equipos con su estado es del contexto de préstamos

- **Estado:** Propuesto
- **Fecha:** 09/11/2026
- **Contexto delimitado:** equipos y prestamos

## Contexto

La API del cliente pone en la misma ruta `/api/equipos` el alta de un equipo (`POST`) y la lista de equipos con su estado, persona y devolución (`GET`). El alta escribe los datos del equipo; el estado sale de las reservas y préstamos. Cada contexto escribe solo en sus colecciones y no hay transacciones que crucen contextos.

## Opciones

1. **`POST /api/equipos` en `equipos` y `GET /api/equipos` en `prestamos`.** `prestamos` lee la lista de equipos a través del `index.ts` de `equipos` y le añade el estado de su préstamo activo.
2. **Las dos en `equipos`.** `equipos` tendría que leer los préstamos activos, y `prestamos` ya depende de `equipos` para saber si un equipo existe: sería un ciclo.

## Decisión

La opción 1: cada operación va al contexto dueño de los datos que devuelve, y las dependencias quedan en un solo sentido (`prestamos` → `equipos` → `cuentas`).

## Consecuencias

- El servidor registra las dos operaciones de la misma ruta desde dos módulos distintos, una por método.
- `equipos` expone en su `index.ts` la consulta de un equipo por id y la lista de equipos.
