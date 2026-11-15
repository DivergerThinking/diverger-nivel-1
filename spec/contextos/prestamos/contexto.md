# Contexto «Préstamos»

## Propósito

Lleva lo que pasa con cada equipo a lo largo del tiempo: los empleados lo piden y queda reservado, IT lo entrega, lo presta en el mostrador y apunta su devolución, y revisa los préstamos vencidos y el historial de cada equipo. Es dueño del estado de cada equipo y garantiza que un equipo nunca se reserva ni se presta dos veces a la vez.

## Modelo

- **Estado del equipo** (agregado, uno por equipo): `estado` (`disponible`, `reservado` o `prestado`) y, cuando está reservado o prestado, `persona`, `devolucion` y el id del préstamo en curso. Un equipo sin estado guardado está `disponible`.
- **Préstamo** (entidad): `id`, id del equipo, `persona`, `devolucion`, `estado` en el historial (`reservado`, `prestado` o `devuelto`) y el momento en que empezó.
- **Fecha de devolución** (objeto valor): texto `AAAA-MM-DD` que tiene que ser una fecha que exista; se devuelve igual.
- **Hoy** (objeto valor): el día actual en Madrid.
- **Persona** (objeto valor): el correo de quien tiene el equipo; en una solicitud, el correo del token.

## Invariantes

- Un equipo no puede estar reservado o prestado dos veces a la vez: de dos peticiones simultáneas sobre el mismo equipo disponible, sean solicitudes o préstamos en el mostrador, una sale bien y la otra recibe 409 «El equipo no está disponible» (concurrencia, [ADR 0003](../../../docs/adr/0003-un-equipo-no-se-reserva-ni-se-presta-dos-veces.md)).
- Solo se pide o se presta en el mostrador un equipo `disponible`; si no, 409 «El equipo no está disponible».
- Solo se entrega un equipo `reservado` (si no, 409 «El equipo no está reservado»), y pasa a `prestado` con la misma persona y fecha de devolución.
- Solo se apunta la devolución de un equipo `prestado` (si no, 409 «El equipo no está prestado»), y vuelve a `disponible` sin persona ni fecha de devolución.
- La fecha de devolución es obligatoria y tiene que existir: «Falta la fecha de devolución» o «La fecha de devolución no es válida» (400).
- Quien pide un equipo no puede poner una fecha anterior a hoy en Madrid (400 «La fecha de devolución ya ha pasado»); IT sí en el mostrador, y ese préstamo aparece ya entre los vencidos.
- En el mostrador, faltar la persona o la fecha de devolución responde 400 «Faltan la persona o la fecha de devolución».
- Una operación sobre un id que no corresponde a ningún equipo responde 404 «No existe el equipo».
- Un préstamo vencido es un equipo prestado cuya fecha de devolución es anterior a hoy; se listan del más antiguo al más reciente.
- El historial de un equipo lista sus préstamos del más reciente al más antiguo.
- Las operaciones «Solo IT» responden 403 «Solo IT puede hacer esto.» a cualquier cuenta que no sea de IT; para saberlo usa el `index.ts` de `equipos`.

## Persistencia

- `prestamos_estados`: un documento por equipo, con id el id del equipo (`estado`, `persona`, `devolucion`, id del préstamo en curso).
- `prestamos_historial`: un documento por préstamo (`equipoId`, `persona`, `devolucion`, `estado`, momento de inicio).
- La solicitud, el préstamo en el mostrador, la entrega y la devolución leen `prestamos_estados/<id del equipo>` y escriben ese documento y el del préstamo en una sola transacción del puerto de persistencia (`lib/datos.ts`).

## Dependencias

- `equipos`: comprueba que el equipo existe y toma su nombre (para la lista de equipos y la de vencidos), y sabe si la cuenta de la sesión es de IT. Lo usa por el `index.ts` de `equipos`, nunca por sus colecciones.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): el contrato sigue la API fijada por el cliente.
- [ADR 0003](../../../docs/adr/0003-un-equipo-no-se-reserva-ni-se-presta-dos-veces.md): el estado de cada equipo se cambia en una transacción, que impide reservarlo o prestarlo dos veces.
