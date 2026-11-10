# Préstamos

## Propósito

Registra lo que pasa con cada equipo a lo largo del tiempo: las solicitudes de los empleados, las entregas, los préstamos en el mostrador y las devoluciones. Sirve la lista de equipos con su estado, los préstamos vencidos y el historial de cada equipo, y garantiza que un equipo nunca se reserva ni se presta dos veces a la vez.

## Modelo

- **Préstamo** (agregado): `id`, id del **equipo**, **persona** (correo), **fecha de devolución** (`AAAA-MM-DD`), estado (`reservado`, `prestado` o `devuelto`) y el momento en que se creó, que ordena el **historial**.
- **Préstamo activo** (entidad): como mucho uno por equipo, con el id del préstamo, su estado, la persona y la fecha de devolución.
- **Estado del equipo** (objeto de valor): `disponible` si no tiene préstamo activo; si no, el estado del préstamo activo (`reservado` o `prestado`).
- **Préstamo vencido** (vista): préstamo activo en estado prestado con fecha de devolución anterior a hoy en Madrid.

## Invariantes

- Toda operación exige sesión con un token de identidad de Google válido; sin él, 401 «Inicia sesión con Google.».
- Entregar, prestar en el mostrador, apuntar la devolución, ver los vencidos y ver el historial son solo de IT; cualquier otra cuenta recibe 403 «Solo IT puede hacer esto.». Ver los equipos y pedir uno es de todos, IT incluida.
- Un equipo nunca está reservado o prestado dos veces a la vez: de dos peticiones simultáneas por el mismo equipo disponible, una sale bien y la otra recibe 409 «El equipo no está disponible» (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- La fecha de devolución es texto `AAAA-MM-DD` de un día que existe y se devuelve igual; si no, 400 «La fecha de devolución no es válida».
- Quien pide un equipo no puede poner una fecha anterior a hoy en Madrid (400 «La fecha de devolución ya ha pasado»); IT sí al prestar en el mostrador, y ese préstamo aparece ya entre los vencidos.
- Pedir un equipo lo deja reservado a nombre del correo del token; entregarlo lo deja prestado con la misma persona y fecha; devolverlo lo deja disponible, sin persona ni fecha, y el préstamo pasa a devuelto.
- Solo se entrega un equipo reservado (409 «El equipo no está reservado») y solo se devuelve uno prestado (409 «El equipo no está prestado»).
- Una operación sobre un equipo que no existe responde 404 «No existe el equipo».
- Los vencidos van del más antiguo al más reciente; el historial, del más reciente al más antiguo.

## Persistencia

- `prestamos_prestamos`: un documento por préstamo, con id el `id` del préstamo.
- `prestamos_activos`: como mucho un documento por equipo, con id el id del equipo.
- Solicitar, prestar, entregar y devolver se hacen en una transacción del puerto de persistencia que primero lee `prestamos_activos/<idEquipo>` y después escribe el préstamo y el préstamo activo (ADR 0001).
- La lista de equipos lee los equipos a través de equipos y los préstamos activos de `prestamos_activos`.

## Dependencias

- **equipos**: a través de su `index.ts`, para saber si un equipo existe (404) y para leer el nombre de los equipos en la lista y en los vencidos.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md): un préstamo activo por equipo, en una transacción.
- [ADR 0003](../../../docs/adr/0003-api-fijada-por-el-cliente.md): el contrato sigue la API fijada por el cliente.
- [ADR 0004](../../../docs/adr/0004-la-lista-de-equipos-la-sirve-prestamos.md): este contexto sirve la lista de equipos con su estado.
