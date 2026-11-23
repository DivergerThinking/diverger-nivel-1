# Contexto «Préstamos»

## Propósito

Lleva el estado de cada equipo y sus préstamos: los empleados ven los equipos y piden uno disponible; IT entrega los reservados, presta en el mostrador, apunta las devoluciones, revisa los préstamos vencidos y consulta el historial. Garantiza que un equipo nunca se reserve ni se preste dos veces a la vez.

## Modelo

- **Préstamo activo** (agregado, uno por equipo como mucho): el `id` del equipo, la **persona**, la **fecha de devolución**, el estado (`reservado` o `prestado`) y el id de su **préstamo**. Sin préstamo activo, el equipo está **disponible**.
- **Préstamo** (entidad): id, id del equipo, persona, fecha de devolución, estado (`reservado`, `prestado` o `devuelto`) y momento de creación, para ordenar el **historial**.
- **Fecha de devolución** (valor): texto `AAAA-MM-DD` de una fecha que existe; se devuelve tal cual.
- **Hoy** (valor): el día actual en Madrid.
- **Equipo** (de `equipos`): id y nombre, leídos a través del `index.ts` de `equipos`.

## Invariantes

- Todas las operaciones exigen sesión: sin un token válido responden 401 «Inicia sesión con Google.». La persona de cada operación es el correo del token.
- La entrega, el préstamo en el mostrador, la devolución, los vencidos y el historial son solo de una **cuenta de IT**; cualquier otra cuenta recibe 403 «Solo IT puede hacer esto.». Ver los equipos y pedir uno lo puede hacer cualquier persona con sesión, también una cuenta de IT.
- Un equipo tiene como mucho un **préstamo activo**: una solicitud o un préstamo en el mostrador sobre un equipo reservado o prestado responde 409 «El equipo no está disponible», y de dos peticiones a la vez sobre el mismo equipo disponible solo una sale bien (concurrencia, [ADR 0002](../../../docs/adr/0002-un-prestamo-activo-por-equipo.md)).
- Una operación sobre un id de equipo que no existe en `equipos` responde 404 «No existe el equipo».
- La **solicitud** exige fecha de devolución (400 «Falta la fecha de devolución»), real (400 «La fecha de devolución no es válida») y no anterior a **hoy** (400 «La fecha de devolución ya ha pasado»). Deja el equipo reservado a nombre de quien la pide.
- El **préstamo en el mostrador** exige persona y fecha de devolución (400 «Faltan la persona o la fecha de devolución») y una fecha real (400 «La fecha de devolución no es válida»); la fecha puede ser anterior a hoy.
- La **entrega** solo vale para un equipo reservado (409 «El equipo no está reservado») y lo deja prestado con la misma persona y fecha de devolución.
- La **devolución** solo vale para un equipo prestado (409 «El equipo no está prestado»); el equipo vuelve a estar disponible, sin persona ni fecha de devolución, y su préstamo pasa a devuelto.
- Un **préstamo vencido** es un equipo prestado con la fecha de devolución anterior a hoy; los reservados nunca están vencidos. Se listan del más antiguo al más reciente.
- El **historial** lista los préstamos del equipo del más reciente al más antiguo.

## Persistencia

- `prestamos_activos`: un documento por equipo con préstamo activo, con id el del equipo.
- `prestamos_prestamos`: un documento por préstamo.

La solicitud, la entrega, el préstamo en el mostrador y la devolución leen el préstamo activo del equipo y escriben el préstamo activo y el préstamo en una sola transacción del puerto de persistencia, con todas las lecturas antes de las escrituras. La existencia del equipo se comprueba a través de `equipos` antes de la transacción. Solo este contexto escribe en estas colecciones.

## Dependencias

- `equipos`: para saber si un equipo existe y para listar los equipos con su nombre, a través de su `index.ts`.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): el contrato sigue la API fijada por el cliente.
- [ADR 0002](../../../docs/adr/0002-un-prestamo-activo-por-equipo.md): un préstamo activo por equipo, garantizado con una transacción.
- [ADR 0004](../../../docs/adr/0004-estado-de-los-equipos-en-prestamos.md): el estado de cada equipo lo lleva este contexto.
