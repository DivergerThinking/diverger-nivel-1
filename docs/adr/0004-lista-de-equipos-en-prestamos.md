# 0004. La lista de equipos con su estado la sirve el contexto de préstamos

- **Estado:** Propuesto
- **Fecha:** 14/11/2026
- **Contexto delimitado:** equipos, prestamos

## Contexto

La aplicación tiene dos contextos: `equipos` guarda qué equipos hay y `prestamos` guarda lo que les pasa (reservas, préstamos y devoluciones). La lista de equipos (`GET /api/equipos`) muestra el nombre de cada equipo, que es de `equipos`, y su estado, persona y fecha de devolución, que son de `prestamos`. Además, las operaciones «Solo IT» están en los dos contextos y comparten la lista de cuentas de IT de `CORREOS_IT`.

## Opciones

1. **La lista la sirve `prestamos`.** `prestamos` lee los equipos con el `index.ts` de `equipos` y les añade su estado. `equipos` no depende de nadie, y `prestamos` depende de `equipos`. La comprobación de cuentas de IT vive en `equipos` y `prestamos` la usa por su `index.ts`.
2. **La lista la sirve `equipos`.** `equipos` pide el estado a `prestamos`, pero `prestamos` necesita a `equipos` para saber si un equipo existe: los dos dependerían uno del otro, y la constitución no admite ciclos.

## Decisión

Opción 1: no hay ciclos y cada contexto escribe solo en sus colecciones.

## Consecuencias

- El contrato de `prestamos` tiene `GET /api/equipos`, y el de `equipos`, `POST /api/equipos`: la misma ruta con métodos distintos, como la fijó el cliente.
- `equipos` publica en su `index.ts` cómo obtener y listar equipos y cómo saber si una persona es de IT; `prestamos` solo usa eso.
