# Préstamos

## Propósito

Registra qué pasa con cada equipo a lo largo del tiempo: las solicitudes de los empleados, las notas que añaden a una solicitud pendiente, las entregas, los préstamos en el mostrador, las devoluciones y las bajas de los equipos averiados o retirados. A partir de ahí da el estado de cada equipo, los préstamos vencidos y el historial.

## Modelo

- **Préstamo** (agregado): `id`, `equipo` (id del equipo), `persona` (correo), `devolucion` (fecha de devolución `AAAA-MM-DD`), `estado` (`reservado`, `prestado` o `devuelto`), `creado` (instante de la solicitud o del préstamo en el mostrador, para ordenar el historial) y `nota` (texto corto, opcional, de hasta 200 caracteres; solo la añade quien pidió el equipo mientras el préstamo está `reservado`).
- **Préstamo activo**: el préstamo reservado o prestado de un equipo; como mucho uno por equipo.
- **Baja** (agregado): `equipo` (id del equipo) y `motivo` (texto libre, obligatorio). Como mucho una por equipo. Un equipo dado de baja no vuelve a estar disponible en este contexto: reactivar un equipo no está en el alcance.
- **Estado** de un equipo: `dado de baja` si tiene una baja; si no, `reservado` o `prestado` según su préstamo activo, y `disponible` sin préstamo activo ni baja.
- **Hoy**: el día actual en Madrid (zona Europe/Madrid).

## Invariantes

- Un equipo no tiene nunca dos préstamos activos; de dos solicitudes o préstamos en el mostrador simultáneos sobre un equipo disponible, uno recibe 201 y el otro 409 con `{"error": "El equipo no está disponible"}` (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Una solicitud o un préstamo sobre un equipo reservado, prestado o dado de baja recibe 409 con `{"error": "El equipo no está disponible"}`.
- Un equipo que no existe recibe 404 con `{"error": "No existe el equipo"}` en la solicitud, la nota, la consulta de la solicitud, la entrega, el préstamo, la devolución, la baja y el historial.
- La fecha de devolución es texto `AAAA-MM-DD` de una fecha que existe y se devuelve igual; si no, 400 con `{"error": "La fecha de devolución no es válida"}`.
- Quien pide un equipo no puede poner una fecha anterior a hoy: 400 con `{"error": "La fecha de devolución ya ha pasado"}`. La fecha de hoy sí vale.
- Una solicitud sin fecha recibe 400 con `{"error": "Falta la fecha de devolución"}`.
- IT puede prestar en el mostrador con una fecha anterior a hoy, y ese préstamo aparece entre los vencidos.
- Un préstamo en el mostrador sin persona o sin fecha recibe 400 con `{"error": "Faltan la persona o la fecha de devolución"}`.
- Solo se entrega un equipo reservado: si no, 409 con `{"error": "El equipo no está reservado"}`. La entrega conserva la persona, la fecha de la solicitud y la nota (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Solo se devuelve un equipo prestado: si no, 409 con `{"error": "El equipo no está prestado"}`. Tras la devolución el equipo está disponible, sin persona ni fecha, y el préstamo queda `devuelto` (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Solo se da de baja un equipo sin préstamo activo: si tiene uno reservado o prestado, 409 con `{"error": "El equipo tiene un préstamo activo"}` y no se crea la baja. Hay que entregarlo o devolverlo antes (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Un equipo solo se da de baja una vez: si ya lo está, 409 con `{"error": "El equipo ya está dado de baja"}`.
- La baja exige un motivo no vacío: si falta, 400 con `{"error": "Falta el motivo de la baja"}`.
- Un equipo dado de baja no tiene préstamo activo, así que no se entrega ni se devuelve (409 con los mensajes de arriba) y no aparece entre los vencidos. Su historial sigue consultable.
- Los vencidos son los equipos prestados (no reservados) con fecha de devolución anterior a hoy, del más antiguo al más reciente.
- El historial lista los préstamos del equipo del más reciente al más antiguo.
- La entrega, el préstamo en el mostrador, la devolución, la baja, los vencidos, el historial y la consulta de la solicitud pendiente son operaciones solo de IT.
- Solo quien pidió un equipo puede añadirle una nota: si la sesión es de otra persona, 403 con `{"error": "Solo quien pidió el equipo puede añadir una nota"}` y la nota no cambia.
- Una nota solo se añade mientras el préstamo está `reservado`: si el equipo está prestado o no está reservado, 409 con `{"error": "El equipo no está reservado"}` y la nota no cambia.
- La nota es texto no vacío: si falta o está vacía, 400 con `{"error": "Falta la nota"}`; si tiene más de 200 caracteres, 400 con `{"error": "La nota es demasiado larga"}`. Una nota nueva sustituye a la anterior.
- Una nota y una entrega sobre el mismo equipo a la vez: la nota recibe 200 si llega antes que la entrega, y 409 con `{"error": "El equipo no está reservado"}` si llega después; la entrega recibe 200 en ambos casos (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- La nota no sale en `GET /api/equipos` ni en el historial: solo la ve IT en la consulta de la solicitud pendiente (`GET /api/equipos/{id}/solicitud`), que devuelve 409 con `{"error": "El equipo no está reservado"}` si no hay solicitud pendiente.

## Persistencia

- `prestamos_prestamos`: un documento por préstamo, con id el id del préstamo. Guarda el historial completo. El campo `nota`, si existe, es la nota de la solicitud; no se borra al entregar ni al devolver.
- `prestamos_activos`: un documento por equipo con préstamo activo, con id el id del equipo y el campo `prestamo` con el id del préstamo. Sin documento, el equipo no tiene préstamo activo.
- `prestamos_bajas`: un documento por equipo dado de baja, con id el id del equipo y el campo `motivo`. Sin documento, el equipo no está dado de baja.
- La solicitud y el préstamo en el mostrador leen `prestamos_bajas/<equipo>` y `prestamos_activos/<equipo>` y, si no hay baja ni préstamo activo, crean el documento del activo y el préstamo en una transacción. La entrega lee el activo y actualiza el préstamo en una transacción. La devolución lee el activo, marca el préstamo como `devuelto` y borra el activo en una transacción. La baja lee `prestamos_activos/<equipo>` y `prestamos_bajas/<equipo>` y, si no hay préstamo activo ni baja, crea `prestamos_bajas/<equipo>` en una transacción. La nota lee `prestamos_activos/<equipo>`, comprueba que el préstamo está `reservado` y la persona de la sesión, y actualiza el campo `nota` del préstamo en una transacción. La consulta de la solicitud pendiente solo lee.

## Dependencias

- `equipos`: para saber si un equipo existe, su nombre y la lista de equipos.
- `cuentas`: para la persona de la sesión y si es una cuenta de IT.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md): un préstamo activo por equipo, con una transacción sobre `prestamos_activos`. La baja, la nota y la solicitud compiten por el mismo equipo y se garantizan con la misma técnica; el ADR sigue vigente y, si la regla de la baja requiere otra decisión, un ADR nuevo la sustituirá.
- [ADR 0003](../../../docs/adr/0003-api-fijada-por-el-cliente.md): las rutas y los errores son los del cliente. La ruta de baja, el estado `dado de baja` y las rutas de la nota (`PUT /api/equipos/{id}/solicitud/nota` y `GET /api/equipos/{id}/solicitud`) amplían la API fijada: queda pendiente un ADR que lo registre al aplicar el cambio.
- [ADR 0004](../../../docs/adr/0004-reparto-de-contextos.md): este contexto sirve `GET /api/equipos`.
