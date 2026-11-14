# Contexto «Préstamos»

## Propósito

Registra lo que pasa con cada equipo: las solicitudes de los empleados, las entregas, los préstamos en el mostrador y las devoluciones. Enseña el estado de cada equipo, los préstamos vencidos y el historial, y garantiza que un equipo nunca se reserva ni se presta dos veces a la vez.

## Modelo

- **Préstamo activo** (agregado, uno por equipo como mucho): id del equipo, id del préstamo, **estado** (`reservado` o `prestado`), **persona** y **fecha de devolución**.
- **Préstamo** (entidad del historial): id, id del equipo, persona, fecha de devolución, estado (`reservado`, `prestado` o `devuelto`) y momento de creación, que ordena el historial.
- **Estado del equipo**: `prestado` o `reservado` si tiene préstamo activo; `disponible` si no lo tiene.
- **Fecha de devolución**: texto `AAAA-MM-DD` de una fecha que existe, que se devuelve igual. **Hoy** es el día en Madrid.

## Invariantes

- Un equipo no está reservado o prestado dos veces a la vez: de dos peticiones simultáneas para el mismo equipo disponible, sean solicitudes o préstamos en el mostrador, una sale bien y la otra recibe 409 «El equipo no está disponible» (concurrencia, [ADR 0002](../../../docs/adr/0002-una-reserva-o-prestamo-activo-por-equipo.md)).
- Solo se solicita o se presta en el mostrador un equipo disponible; si no, 409 «El equipo no está disponible».
- La fecha de devolución de una solicitud no puede faltar (400 «Falta la fecha de devolución»), tiene que existir (400 «La fecha de devolución no es válida») y no puede ser anterior a hoy (400 «La fecha de devolución ya ha pasado»).
- El préstamo en el mostrador exige persona y fecha (400 «Faltan la persona o la fecha de devolución») y una fecha que exista (400 «La fecha de devolución no es válida»); la fecha puede ser anterior a hoy.
- La persona de una solicitud es el correo del token.
- Solo se entrega un equipo reservado (409 «El equipo no está reservado»), que pasa a prestado con la misma persona y fecha.
- Solo se devuelve un equipo prestado (409 «El equipo no está prestado»); el equipo vuelve a estar disponible y su préstamo pasa a `devuelto`.
- Un equipo que no existe responde 404 «No existe el equipo».
- Los préstamos vencidos son los equipos prestados con fecha de devolución anterior a hoy, del más antiguo al más reciente.
- Entregar, prestar en el mostrador, apuntar la devolución, ver los vencidos y ver el historial son solo para cuentas de IT; cualquier otra recibe 403 «Solo IT puede hacer esto.».
- Toda petición necesita un token de identidad de Google válido, con el correo verificado y emitido para el cliente OAuth de la aplicación; sin él, 401 «Inicia sesión con Google.».

## Persistencia

- `prestamos_activos`: un documento por equipo con préstamo activo, con id el del equipo.
- `prestamos_prestamos`: un documento por préstamo, para el historial.
- La solicitud, el préstamo en el mostrador, la entrega y la devolución leen el préstamo activo y escriben el préstamo activo y su préstamo en una sola transacción del puerto de persistencia, primero las lecturas y después las escrituras.

## Dependencias

- `equipos`: comprueba que un equipo existe y lee su nombre, por el `index.ts` del contexto, para el listado, los vencidos y los 404.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): las rutas y los errores siguen la API fijada por el cliente.
- [ADR 0002](../../../docs/adr/0002-una-reserva-o-prestamo-activo-por-equipo.md): un préstamo activo por equipo, garantizado con una transacción.
- [ADR 0004](../../../docs/adr/0004-estado-de-los-equipos-en-prestamos.md): el estado y el listado de los equipos están en este contexto.
