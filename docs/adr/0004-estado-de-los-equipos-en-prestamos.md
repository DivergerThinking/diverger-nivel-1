# 0004. El estado de cada equipo lo guarda y lo enseña el contexto de préstamos

- **Estado:** Propuesto
- **Fecha:** 14/11/2026
- **Contexto delimitado:** equipos, prestamos

## Contexto

La aplicación tiene dos contextos: `equipos`, que da de alta los equipos, y `prestamos`, que registra lo que les pasa (reservas, préstamos, devoluciones). El listado `GET /api/equipos` de la API del cliente devuelve a la vez el nombre de cada equipo y su estado, su persona y su fecha de devolución. Si el listado estuviera en `equipos`, este tendría que consultar a `prestamos`, que ya depende de `equipos` para saber si un equipo existe: habría un ciclo.

## Opciones

1. **El listado en `prestamos`.** `prestamos` depende de `equipos` (lee los equipos por su `index.ts`) y une a cada equipo su préstamo activo. `equipos` no depende de nadie.
2. **El estado dentro del equipo.** `equipos` guarda el estado, la persona y la fecha en el propio equipo, y `prestamos` los cambia: sería escribir en colecciones de otro contexto, o una transacción que cruza contextos.

## Decisión

Opción 1. Cada contexto escribe solo en sus colecciones, no hay transacciones entre contextos y las dependencias no forman ciclos, como pide la constitución.

## Consecuencias

- `GET /api/equipos` está en el contrato de `prestamos`, y `POST /api/equipos` en el de `equipos`.
- Un equipo sin préstamo activo está `disponible`; el estado no se guarda aparte.
- La pantalla de alta de equipos solo puede llamar al contrato de `equipos`, que no tiene ninguna lectura reservada a IT: se enseña a cualquiera con sesión y el alta responde 403 «Solo IT puede hacer esto.» a quien no es de IT.
