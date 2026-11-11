# 0004. La lista de equipos con su estado la sirve el contexto de préstamos

- **Estado:** Propuesto
- **Fecha:** 11/11/2026
- **Contexto delimitado:** equipos, prestamos

## Contexto

`GET /api/equipos` devuelve cada equipo con su nombre, que es de `equipos`, y con su estado, persona y fecha de devolución, que son de `prestamos`. `prestamos` ya depende de `equipos` para saber si un equipo existe. Si `equipos` sirviera la lista leyendo el estado de `prestamos`, las dependencias formarían un ciclo.

## Opciones

1. **La sirve `prestamos`.** Lee los equipos con el `index.ts` de `equipos` y les añade el estado de sus propias colecciones; un equipo sin documento de estado está disponible.
2. **La sirve `equipos` con una copia del estado.** `prestamos` publica un evento en cada cambio de estado y `equipos` guarda una copia para servir la lista.

## Decisión

Opción 1. Mantiene una sola dirección de dependencia (`prestamos` → `equipos`) y una sola fuente del estado, sin eventos ni copias que el problema no pide.

## Consecuencias

- `POST /api/equipos` está en el contrato de `equipos` y `GET /api/equipos` en el de `prestamos`, con la misma ruta del cliente.
- `equipos` expone en su `index.ts` la consulta de un equipo por id y la lista de equipos.
