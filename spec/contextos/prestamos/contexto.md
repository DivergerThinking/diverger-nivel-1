# Préstamos

## Propósito

Lleva las reservas, los préstamos y las devoluciones de los equipos, y con ellos el estado de cada equipo. Permite a los empleados pedir un equipo libre y a IT entregarlo, prestarlo en el mostrador, apuntar la devolución, ver los vencidos y consultar el historial.

## Modelo

- **Préstamo activo** (`ActiveLoan`): la reserva o el préstamo en curso de un equipo, con `persona`, `devolucion` y estado `reservado` o `prestado`. Como mucho uno por equipo; sin él, el equipo está `disponible`.
- **Préstamo** (`Loan`): cada entrada del historial de un equipo, con `persona`, `devolucion`, estado `reservado`, `prestado` o `devuelto` y la fecha de creación.
- **Estado del equipo** (`DeviceStatus`): `disponible`, `reservado` o `prestado`.
- **Fecha de devolución** (`returnDate`): texto `AAAA-MM-DD` que tiene que existir; se devuelve igual.
- **Hoy** (`today`): el día actual en la zona horaria Europe/Madrid.

## Invariantes

- La lista de equipos devuelve cada equipo con `id`, `nombre` y `estado`; con `persona` y `devolucion` solo si está reservado o prestado.
- Una solicitud exige `devolucion`: si falta, 400 `{"error": "Falta la fecha de devolución"}`; si no es una fecha real, 400 `{"error": "La fecha de devolución no es válida"}`; si es anterior a hoy, 400 `{"error": "La fecha de devolución ya ha pasado"}`.
- El préstamo en el mostrador exige `persona` y `devolucion`: si falta alguna, 400 `{"error": "Faltan la persona o la fecha de devolución"}`; si la fecha no es real, 400 `{"error": "La fecha de devolución no es válida"}`. Admite fechas anteriores a hoy.
- Una operación sobre un equipo que no existe responde 404 `{"error": "No existe el equipo"}`.
- Un equipo nunca está reservado o prestado dos veces a la vez: una solicitud o un préstamo en el mostrador sobre un equipo reservado o prestado responde 409 `{"error": "El equipo no está disponible"}`; con dos peticiones a la vez sobre el mismo equipo disponible, una sale bien y la otra recibe ese 409 (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Solo se entrega un equipo reservado: si no, 409 `{"error": "El equipo no está reservado"}`. La entrega lo deja prestado con la misma `persona` y `devolucion` (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Solo se devuelve un equipo prestado: si no, 409 `{"error": "El equipo no está prestado"}`. La devolución lo deja disponible, sin `persona` ni `devolucion`, y su préstamo pasa a `devuelto` (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Los préstamos vencidos son los equipos prestados con la devolución anterior a hoy, del más antiguo al más reciente, cada uno con `id`, `nombre`, `persona` y `devolucion`.
- El historial de un equipo lista sus préstamos del más reciente al más antiguo, cada uno con `persona`, `devolucion` y `estado`.
- Entregar, prestar en el mostrador, devolver, ver los vencidos y ver el historial son operaciones «Solo IT»: con otra cuenta, 403 `{"error": "Solo IT puede hacer esto."}`.

## Persistencia

- `prestamos_activos`: un documento por equipo con préstamo activo, con id el del equipo, y campos `estado`, `persona`, `devolucion` y `prestamoId`.
- `prestamos_prestamos`: un documento por préstamo, con campos `equipoId`, `persona`, `devolucion`, `estado` y `creadoEn`.
- La solicitud y el préstamo en el mostrador crean el documento de `prestamos_activos` solo si no existe, y su préstamo en `prestamos_prestamos`, en una transacción de `Almacen.transaccion` (`lib/datos.ts`). La entrega y la devolución actualizan o borran el préstamo activo y actualizan el préstamo en una transacción.

## Dependencias

- `equipos`: para saber si un equipo existe y para obtener la lista de equipos con su nombre, a través de su `index.ts`.
- `cuentas`: para exigir la sesión, saber la persona de la petición y comprobar las operaciones «Solo IT».

## Decisiones

- [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md): un documento de préstamo activo por equipo, creado en transacción.
- [ADR 0003](../../../docs/adr/0003-api-fijada-por-el-cliente.md): rutas y errores fijados por el cliente.
- [ADR 0004](../../../docs/adr/0004-reparto-de-contextos.md): `GET /api/equipos` está en este contexto.
