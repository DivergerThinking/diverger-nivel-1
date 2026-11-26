# Contexto «Préstamos»

## Propósito

Registra lo que les pasa a los equipos: solicitudes, entregas, préstamos en el mostrador y devoluciones. Calcula el estado de cada equipo, los préstamos vencidos y el historial.

## Modelo

- **Préstamo** (agregado, uno activo como mucho por **Equipo**): **Persona**, **Fecha de devolución**, estado `reservado` o `prestado`.
- **Historial**: movimientos de un equipo con estado `reservado`, `prestado` o `devuelto`.
- **Estado del equipo**: `disponible` sin préstamo activo; si no, el estado del préstamo activo.

## Invariantes

- Un equipo no puede estar reservado o prestado dos veces a la vez; con dos peticiones simultáneas, una sale bien y la otra recibe 409 «El equipo no está disponible» (concurrencia, [ADR 0002](../../../docs/adr/0002-un-prestamo-activo-por-equipo.md)).
- La fecha de devolución es un texto `AAAA-MM-DD` que existe; si no, 400 «La fecha de devolución no es válida».
- «Hoy» es el día en Madrid. Una solicitud no admite una fecha anterior a hoy (400 «La fecha de devolución ya ha pasado»); un préstamo en el mostrador sí.
- La persona de una solicitud es el correo del token.
- Solo se entrega un equipo reservado (409 «El equipo no está reservado») y solo se devuelve uno prestado (409 «El equipo no está prestado»).
- Entregar, prestar en el mostrador, devolver, ver vencidos y ver el historial son operaciones solo de IT (403 «Solo IT puede hacer esto.»).
- Un préstamo vencido es uno prestado con fecha de devolución anterior a hoy; se listan del más antiguo al más reciente.
- El historial va del préstamo más reciente al más antiguo.

## Persistencia

- `prestamosActivos`: un documento por equipo con reserva o préstamo activo, cuyo id es el del equipo (`persona`, `devolucion`, `estado`). Se crea, cambia o borra en una transacción.
- `historialPrestamos`: un documento por préstamo (`equipoId`, `persona`, `devolucion`, `estado`, fechas), escrito en la misma transacción que `prestamosActivos`.

## Dependencias

- `equipos`: comprueba que el equipo existe (404 «No existe el equipo»), obtiene su nombre y la lista de equipos, y usa la comprobación de sesión y de cuenta de IT.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): los contratos siguen la API fijada por el cliente.
- [ADR 0002](../../../docs/adr/0002-un-prestamo-activo-por-equipo.md): un equipo tiene como mucho una reserva o un préstamo activo.
