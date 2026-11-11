# Préstamos

## Propósito

Lleva lo que les pasa a los equipos: las solicitudes de los empleados, las entregas, los préstamos en el mostrador y las devoluciones de IT. Sirve la lista de equipos con su estado, los préstamos vencidos y el historial de cada equipo.

## Modelo

- **Estado del equipo** (agregado, uno por equipo): `disponible`, `reservado` o `prestado`; cuando está reservado o prestado lleva **persona** y **fecha de devolución**, y el id del **préstamo** en curso. Un equipo sin estado guardado está disponible.
- **Préstamo** (entidad): equipo, persona, fecha de devolución, estado (`reservado`, `prestado` o `devuelto`) y el momento en que se creó, que ordena el historial.
- **Fecha de devolución** (objeto de valor): texto `AAAA-MM-DD` que es una fecha que existe; se devuelve igual que se recibe.
- **Hoy** (objeto de valor): el día actual en Madrid.

## Invariantes

- Un equipo nunca está reservado o prestado dos veces a la vez: con dos peticiones simultáneas sobre el mismo equipo disponible, sean solicitudes o préstamos en el mostrador, una sale bien y la otra recibe 409 «El equipo no está disponible» (concurrencia, [ADR 0002](../../../docs/adr/0002-una-reserva-o-prestamo-activo-por-equipo.md)).
- Una solicitud solo se hace sobre un equipo disponible y lo deja reservado a nombre del correo del token, con su fecha de devolución.
- La entrega solo se hace sobre un equipo reservado (409 «El equipo no está reservado») y lo deja prestado con la misma persona y fecha de devolución.
- El préstamo en el mostrador solo se hace sobre un equipo disponible (409 «El equipo no está disponible») y exige persona y fecha de devolución (400 «Faltan la persona o la fecha de devolución»).
- La devolución solo se hace sobre un equipo prestado (409 «El equipo no está prestado») y lo deja disponible, sin persona ni fecha de devolución; el préstamo pasa a devuelto.
- La fecha de devolución tiene el formato `AAAA-MM-DD` y existe (400 «La fecha de devolución no es válida»); en una solicitud es obligatoria (400 «Falta la fecha de devolución») y no puede ser anterior a hoy (400 «La fecha de devolución ya ha pasado»); en el mostrador sí puede serlo.
- Un id de equipo que no existe responde 404 «No existe el equipo».
- Los préstamos vencidos son los equipos prestados con fecha de devolución anterior a hoy, del más antiguo al más reciente.
- El historial de un equipo lista sus préstamos del más reciente al más antiguo.
- Entregar, prestar en el mostrador, apuntar devoluciones y ver vencidos e historial solo lo hacen las cuentas de IT; las demás reciben 403 «Solo IT puede hacer esto.».
- Sin token de identidad de Google válido, la respuesta es 401 «Inicia sesión con Google.».

## Persistencia

- `prestamos_estados`: un documento por equipo, con id el del equipo: `{ estado, persona, devolucion, prestamoId }`.
- `prestamos_prestamos`: un documento por préstamo: `{ id, equipoId, persona, devolucion, estado, creadoEn }`.
- Cada transición de estado lee el documento de `prestamos_estados` y escribe el estado y el préstamo en una sola transacción del puerto de persistencia (`lib/datos.ts`). Comprobar que el equipo existe se hace antes, con el `index.ts` de `equipos`, fuera de la transacción.

## Dependencias

- `equipos`: para saber si un equipo existe (404) y para obtener los nombres de la lista de equipos y de los vencidos, con su `index.ts`.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): las rutas y los errores son los de la API fijada por el cliente.
- [ADR 0002](../../../docs/adr/0002-una-reserva-o-prestamo-activo-por-equipo.md): un equipo con como mucho una reserva o préstamo activo, con una transacción sobre su estado.
- [ADR 0004](../../../docs/adr/0004-la-lista-de-equipos-la-sirve-prestamos.md): este contexto sirve `GET /api/equipos`.
