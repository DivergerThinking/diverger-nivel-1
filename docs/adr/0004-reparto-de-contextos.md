# 0004. Reparto de las operaciones entre contextos

- **Estado:** Propuesto
- **Fecha:** 08/11/2026
- **Contexto delimitado:** cuentas, equipos y prestamos

## Contexto

Las operaciones de la API escriben dos tipos de datos: el inventario (los equipos y sus nombres) y lo que les pasa con el tiempo (reservas, préstamos, devoluciones). La sesión y la lista de cuentas de IT las usan todos. Ver los equipos con su estado necesita las dos cosas: el nombre del equipo y su préstamo activo.

## Opciones

1. **Tres contextos.** `cuentas` resuelve la persona de la sesión y si es de IT, sin datos propios. `equipos` da de alta los equipos y es dueño de su nombre. `prestamos` es dueño de las reservas, los préstamos y su historial, y sirve también `GET /api/equipos`, porque el estado de un equipo es suyo y lee los nombres por el `index.ts` de `equipos`.
2. **`GET /api/equipos` en `equipos`.** Tendría que leer los préstamos activos de `prestamos`, que a su vez necesita `equipos` para saber si un equipo existe: un ciclo de dependencias.
3. **Un solo contexto.** Juntaría el inventario y los préstamos, que escriben datos distintos.

## Decisión

La opción 1. Evita el ciclo: `prestamos` depende de `equipos` y de `cuentas`, `equipos` depende de `cuentas`, y `cuentas` no depende de nadie. Cada contexto escribe solo en sus colecciones.

## Consecuencias

- `equipos` publica en su `index.ts` la consulta de un equipo por id y la lista de equipos.
- `cuentas` publica en su `index.ts` si un correo es de IT, según `CORREOS_IT`.
- Ninguna transacción cruza contextos: el alta solo escribe en `equipos_*` y los préstamos solo en `prestamos_*`.
