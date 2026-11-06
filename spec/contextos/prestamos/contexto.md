# Préstamos

## Propósito

Registra lo que les pasa a los equipos con el tiempo: la solicitud de una persona, la entrega, el préstamo en el mostrador y la devolución. Guarda el estado de cada equipo y su historial, y con ellos responde qué está libre, qué préstamos han vencido y quién ha tenido cada equipo.

## Modelo

- **Estado del equipo** (agregado, uno por equipo): `disponible`, `reservado` o `prestado`; cuando está reservado o prestado lleva también la **persona** y la **fecha de devolución**, y el id del **préstamo** activo. Un equipo sin estado guardado está disponible.
- **Préstamo** (entidad del historial): equipo, persona, fecha de devolución, estado (`reservado`, `prestado` o `devuelto`) y el momento en que empezó, que ordena el historial.
- **Fecha de devolución** (valor): texto `AAAA-MM-DD` que tiene que ser una fecha que exista; se devuelve igual que se recibió.
- **Hoy** (valor): el día en curso en la zona horaria Europe/Madrid.

## Invariantes

- Un equipo nunca está reservado o prestado dos veces a la vez. Con dos solicitudes o préstamos en el mostrador a la vez sobre el mismo equipo disponible, uno sale bien y el otro recibe 409 «El equipo no está disponible» (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Solo se pide un equipo disponible; si está reservado o prestado, 409 «El equipo no está disponible». Queda reservado a la persona de la sesión con la fecha de devolución pedida.
- Al pedir, la fecha de devolución es obligatoria (400 «Falta la fecha de devolución»), tiene que existir (400 «La fecha de devolución no es válida») y no puede ser anterior a hoy (400 «La fecha de devolución ya ha pasado»).
- Solo se entrega un equipo reservado (409 «El equipo no está reservado»); pasa a prestado con la misma persona y fecha de devolución.
- En el mostrador, la persona y la fecha de devolución son obligatorias (400 «Faltan la persona o la fecha de devolución») y la fecha tiene que existir (400 «La fecha de devolución no es válida»), pero puede ser anterior a hoy; ese préstamo aparece ya entre los vencidos. Solo se presta un equipo disponible (409 «El equipo no está disponible»).
- Solo se devuelve un equipo prestado (409 «El equipo no está prestado»); vuelve a estar disponible, sin persona ni fecha de devolución, y su préstamo pasa a devuelto.
- Una operación sobre un equipo que no existe responde 404 «No existe el equipo».
- Entregar, prestar en el mostrador, apuntar la devolución, ver los vencidos y ver el historial solo los hace una cuenta de IT; cualquier otra recibe 403 «Solo IT puede hacer esto.».
- Los préstamos vencidos son los equipos prestados con fecha de devolución anterior a hoy, ordenados del más antiguo al más reciente.
- El historial de un equipo lista sus préstamos del más reciente al más antiguo.
- Los errores son `{"error": "<mensaje>"}` con el mensaje exacto del contrato.

## Persistencia

- `prestamos_estados`: un documento por equipo que no está disponible, con id el del equipo y los campos `estado`, `persona`, `devolucion` y `prestamoId`. Al devolver el equipo, el documento se borra.
- `prestamos_prestamos`: un documento por préstamo, con id generado y los campos `equipoId`, `persona`, `devolucion`, `estado` e `inicio` (fecha y hora ISO 8601 en UTC).
- La solicitud, la entrega, el préstamo en el mostrador y la devolución leen `prestamos_estados/<id del equipo>` y escriben el estado y el préstamo en la misma transacción del puerto de persistencia (`lib/datos.ts`).

## Dependencias

- `equipos`: a través de su `index.ts`, para saber si un equipo existe, obtener los nombres de los equipos del listado y de los vencidos, y saber si la cuenta de la sesión es de IT. Nunca escribe en sus colecciones.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md): un equipo tiene como mucho una reserva o un préstamo activo, garantizado con una transacción.
- [ADR 0002](../../../docs/adr/0002-api-fijada-por-el-cliente.md): las rutas y los errores siguen la API fijada por el cliente.
- [ADR 0004](../../../docs/adr/0004-estado-del-equipo-en-prestamos.md): el estado del equipo vive en este contexto, que también sirve el listado de equipos.
