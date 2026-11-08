# Préstamos

## Propósito

Registra lo que pasa con cada equipo: las reservas que piden los empleados, las entregas, los préstamos en el mostrador y las devoluciones. Con ello sirve la lista de equipos con su estado, los préstamos vencidos y el historial de cada equipo.

## Modelo

- **Préstamo** (agregado): id, id del equipo, persona, fecha de devolución, estado del préstamo (`reservado`, `prestado` o `devuelto`) y el momento en que se creó, que ordena el historial.
- **Préstamo activo**: por cada equipo reservado o prestado, la referencia a su único préstamo vigente.
- **Estado del equipo**: `reservado` o `prestado` según su préstamo activo, y `disponible` sin préstamo activo.
- **Fecha de devolución**: texto `AAAA-MM-DD` de una fecha que existe, devuelto tal como llega.
- **Hoy**: el día actual en Madrid.

## Invariantes

- Un equipo no está reservado o prestado dos veces a la vez. De dos solicitudes o préstamos en el mostrador simultáneos sobre el mismo equipo disponible, uno sale bien y el otro recibe 409 con `{"error": "El equipo no está disponible"}`; nunca salen bien los dos (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Pedir un equipo reservado o prestado responde 409 con `{"error": "El equipo no está disponible"}`; la persona de la solicitud es el correo del token.
- La fecha de devolución es obligatoria y tiene que ser una fecha real en formato `AAAA-MM-DD`. Si falta en una solicitud: 400 con `{"error": "Falta la fecha de devolución"}`. Si falta la persona o la fecha en un préstamo en el mostrador: 400 con `{"error": "Faltan la persona o la fecha de devolución"}`. Si no es una fecha real: 400 con `{"error": "La fecha de devolución no es válida"}`.
- Quien pide un equipo no puede poner una fecha anterior a hoy: 400 con `{"error": "La fecha de devolución ya ha pasado"}`. IT sí puede en el mostrador, y ese préstamo aparece ya entre los vencidos.
- Solo se entrega un equipo reservado (409 con `{"error": "El equipo no está reservado"}`), y conserva la persona y la fecha de devolución de la solicitud (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Solo se apunta la devolución de un equipo prestado (409 con `{"error": "El equipo no está prestado"}`); el préstamo pasa a `devuelto` y el equipo queda disponible, sin persona ni fecha de devolución (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Un id de equipo que no existe responde 404 con `{"error": "No existe el equipo"}`.
- Entregar, prestar en el mostrador, apuntar la devolución, ver los vencidos y ver el historial son operaciones «Solo IT»: cualquier otra cuenta recibe 403 con `{"error": "Solo IT puede hacer esto."}`.
- Los vencidos son los equipos prestados con fecha de devolución anterior a hoy, del más antiguo al más reciente; una reserva no vence.
- El historial lista todos los préstamos del equipo, del más reciente al más antiguo, cada uno con persona, fecha de devolución y estado.

## Persistencia

- `prestamos_prestamos`: un documento por préstamo. La entrega y la devolución cambian su estado; nunca se borra.
- `prestamos_activos`: un documento por equipo reservado o prestado, cuyo id es el del equipo y que apunta a su préstamo. Solicitar y prestar lo crean, entregar lo lee y apuntar la devolución lo borra, siempre en la misma transacción que el préstamo (`Almacen.transaccion`).

## Dependencias

- `equipos`: para saber si un equipo existe y para su nombre, por su `index.ts` (`obtenerEquipo`, `listarEquipos`).
- `cuentas`: para saber si la persona es una cuenta de IT en las operaciones «Solo IT».

## Decisiones

- [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md): un préstamo activo por equipo, con un documento por equipo en una transacción.
- [ADR 0003](../../../docs/adr/0003-api-fijada-por-el-cliente.md): rutas y errores de la API fijada por el cliente, también bajo `/api/equipos/`.
- [ADR 0004](../../../docs/adr/0004-reparto-de-contextos.md): este contexto sirve la lista de equipos con su estado.
