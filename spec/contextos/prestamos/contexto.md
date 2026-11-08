# Préstamos

## Propósito

Registra qué pasa con cada equipo a lo largo del tiempo: las solicitudes de los empleados, las entregas, los préstamos en el mostrador y las devoluciones. A partir de ahí da el estado de cada equipo, los préstamos vencidos y el historial.

## Modelo

- **Préstamo** (agregado): `id`, `equipo` (id del equipo), `persona` (correo), `devolucion` (fecha de devolución `AAAA-MM-DD`), `estado` (`reservado`, `prestado` o `devuelto`) y `creado` (instante de la solicitud o del préstamo en el mostrador, para ordenar el historial).
- **Préstamo activo**: el préstamo reservado o prestado de un equipo; como mucho uno por equipo.
- **Estado** de un equipo: `reservado` o `prestado` según su préstamo activo, y `disponible` sin préstamo activo.
- **Hoy**: el día actual en Madrid (zona Europe/Madrid).

## Invariantes

- Un equipo no tiene nunca dos préstamos activos; de dos solicitudes o préstamos en el mostrador simultáneos sobre un equipo disponible, uno recibe 201 y el otro 409 con `{"error": "El equipo no está disponible"}` (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Una solicitud o un préstamo sobre un equipo reservado o prestado recibe 409 con `{"error": "El equipo no está disponible"}`.
- Un equipo que no existe recibe 404 con `{"error": "No existe el equipo"}` en la solicitud, la entrega, el préstamo, la devolución y el historial.
- La fecha de devolución es texto `AAAA-MM-DD` de una fecha que existe y se devuelve igual; si no, 400 con `{"error": "La fecha de devolución no es válida"}`.
- Quien pide un equipo no puede poner una fecha anterior a hoy: 400 con `{"error": "La fecha de devolución ya ha pasado"}`. La fecha de hoy sí vale.
- Una solicitud sin fecha recibe 400 con `{"error": "Falta la fecha de devolución"}`.
- IT puede prestar en el mostrador con una fecha anterior a hoy, y ese préstamo aparece entre los vencidos.
- Un préstamo en el mostrador sin persona o sin fecha recibe 400 con `{"error": "Faltan la persona o la fecha de devolución"}`.
- Solo se entrega un equipo reservado: si no, 409 con `{"error": "El equipo no está reservado"}`. La entrega conserva la persona y la fecha de la solicitud (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Solo se devuelve un equipo prestado: si no, 409 con `{"error": "El equipo no está prestado"}`. Tras la devolución el equipo está disponible, sin persona ni fecha, y el préstamo queda `devuelto` (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Los vencidos son los equipos prestados (no reservados) con fecha de devolución anterior a hoy, del más antiguo al más reciente.
- El historial lista los préstamos del equipo del más reciente al más antiguo.
- La entrega, el préstamo en el mostrador, la devolución, los vencidos y el historial son operaciones solo de IT.

## Persistencia

- `prestamos_prestamos`: un documento por préstamo, con id el id del préstamo. Guarda el historial completo.
- `prestamos_activos`: un documento por equipo con préstamo activo, con id el id del equipo y el campo `prestamo` con el id del préstamo. Sin documento, el equipo está disponible.
- La solicitud y el préstamo en el mostrador leen `prestamos_activos/<equipo>` y, si no existe, crean ese documento y el préstamo en una transacción. La entrega lee el activo y actualiza el préstamo en una transacción. La devolución lee el activo, marca el préstamo como `devuelto` y borra el activo en una transacción.

## Dependencias

- `equipos`: para saber si un equipo existe, su nombre y la lista de equipos.
- `cuentas`: para la persona de la sesión y si es una cuenta de IT.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md): un préstamo activo por equipo, con una transacción sobre `prestamos_activos`.
- [ADR 0003](../../../docs/adr/0003-api-fijada-por-el-cliente.md): las rutas y los errores son los del cliente.
- [ADR 0004](../../../docs/adr/0004-reparto-de-contextos.md): este contexto sirve `GET /api/equipos`.
