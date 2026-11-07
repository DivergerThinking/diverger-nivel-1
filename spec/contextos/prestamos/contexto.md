# Préstamos

## Propósito

Registra lo que les pasa a los equipos con el tiempo: las solicitudes de los empleados, las entregas, los préstamos en el mostrador y las devoluciones. A partir de ahí da el estado de cada equipo, los préstamos vencidos y el historial.

## Modelo

- **Préstamo activo** (`ActiveLoan`): agregado, como mucho uno por equipo, con `equipoId`, `persona`, `devolucion` y estado `reservado` o `prestado`.
- **Estado del equipo** (`EquipmentStatus`): `disponible` si el equipo no tiene préstamo activo; si no, el estado del préstamo activo.
- **Entrada del historial** (`HistoryEntry`): `persona`, `devolucion`, estado (`reservado`, `prestado` o `devuelto`) y el momento en que se creó, para ordenar.
- **Fecha de devolución** (`returnDate`): valor de texto `AAAA-MM-DD` que tiene que ser una fecha que exista.
- **Hoy** (`todayInMadrid`): el día actual en Madrid.
- **Préstamo vencido** (`OverdueLoan`): un préstamo activo `prestado` cuya fecha de devolución es anterior a hoy.

## Invariantes

- Un equipo no está reservado o prestado dos veces a la vez: con dos peticiones simultáneas sobre el mismo equipo disponible, sean solicitudes o préstamos en el mostrador, una sale bien y la otra recibe 409 «El equipo no está disponible». (concurrencia) [ADR 0002](../../../docs/adr/0002-un-prestamo-activo-por-equipo.md)
- Una solicitud deja el equipo `reservado` a nombre de la persona de la sesión. Sin fecha responde 400 «Falta la fecha de devolución»; con una fecha que no existe, 400 «La fecha de devolución no es válida»; con una fecha anterior a hoy, 400 «La fecha de devolución ya ha pasado».
- El préstamo en el mostrador (Solo IT) admite una fecha anterior a hoy, y ese préstamo aparece ya entre los vencidos. Sin persona o sin fecha responde 400 «Faltan la persona o la fecha de devolución»; con una fecha que no existe, 400 «La fecha de devolución no es válida».
- La entrega (Solo IT) solo se hace sobre un equipo `reservado` y conserva su persona y su fecha; si no, responde 409 «El equipo no está reservado».
- La devolución (Solo IT) solo se apunta sobre un equipo `prestado` y lo deja `disponible`, sin persona ni fecha; si no, responde 409 «El equipo no está prestado».
- Una operación sobre un equipo que no existe responde 404 «No existe el equipo».
- La fecha de devolución se devuelve como se recibió.
- Los vencidos (Solo IT) van del más antiguo al más reciente; el historial (Solo IT), del más reciente al más antiguo.

## Persistencia

- `prestamos_activos`: un documento por equipo con préstamo activo, cuyo id es el id del equipo.
- `prestamos_historial`: un documento por entrada del historial, con el id del equipo.
- La solicitud, el préstamo en el mostrador, la entrega y la devolución escriben las dos colecciones en una transacción del puerto de persistencia (`lib/datos.ts`).

## Dependencias

- `accesos`: para exigir la sesión, saber la persona y comprobar las operaciones «Solo IT».
- `equipos`: para saber si un equipo existe y leer el catálogo (id y nombre) al listar.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): rutas y errores de la API fijada por el cliente.
- [ADR 0002](../../../docs/adr/0002-un-prestamo-activo-por-equipo.md): un préstamo activo por equipo con un documento por equipo en una transacción.
- [ADR 0004](../../../docs/adr/0004-estado-del-equipo-en-prestamos.md): el estado del equipo vive en este contexto.
