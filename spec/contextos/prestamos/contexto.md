# Contexto «Préstamos»

## Propósito

Registra lo que pasa con cada equipo a lo largo del tiempo: las solicitudes de los empleados, las entregas, los préstamos en el mostrador y las devoluciones. A partir de eso sirve la lista de equipos con su estado, los préstamos vencidos y el historial de cada equipo.

## Modelo

- **Préstamo** (agregado): `id`, `equipoId`, **persona**, **fecha de devolución** (`AAAA-MM-DD`), estado (`reservado`, `prestado` o `devuelto`) y momento de creación, que ordena el **historial**.
- **Préstamo activo** (entidad): uno por equipo como mucho, con el id del equipo y el id de su préstamo reservado o prestado.
- **Estado del equipo** (objeto de valor, calculado): `disponible` sin préstamo activo; si no, el estado de su préstamo activo, con su **persona** y su **fecha de devolución**.
- **Hoy**: el día actual en Madrid.

## Invariantes

- Un equipo no puede estar reservado o prestado dos veces a la vez: con dos peticiones simultáneas sobre el mismo equipo disponible, sean solicitudes o préstamos en el mostrador, una sale bien y la otra recibe 409 «El equipo no está disponible» (concurrencia, [ADR 0002](../../../docs/adr/0002-un-prestamo-activo-por-equipo.md)).
- Una **solicitud** deja el equipo reservado a nombre de la persona del token, con su fecha de devolución, y responde 201 con el equipo. Errores: 400 «Falta la fecha de devolución», 400 «La fecha de devolución no es válida» si no es una fecha real («2026-02-30» no vale), 400 «La fecha de devolución ya ha pasado» si es anterior a hoy, 404 «No existe el equipo» y 409 «El equipo no está disponible» si está reservado o prestado.
- Un **préstamo en el mostrador** (solo IT) deja el equipo prestado a la persona indicada y responde 201. IT sí puede poner una fecha de devolución anterior a hoy, y ese préstamo ya aparece entre los vencidos. Errores: 400 «Faltan la persona o la fecha de devolución», 400 «La fecha de devolución no es válida», 404 «No existe el equipo» y 409 «El equipo no está disponible».
- Una **entrega** (solo IT) pasa un equipo reservado a prestado, con la misma persona y fecha de devolución, y responde 200. Errores: 404 «No existe el equipo» y 409 «El equipo no está reservado».
- Una **devolución** (solo IT) deja el préstamo como devuelto y el equipo disponible, sin persona ni fecha de devolución, y responde 200. Errores: 404 «No existe el equipo» y 409 «El equipo no está prestado».
- Los **préstamos vencidos** (solo IT) son los equipos prestados cuya fecha de devolución es anterior a hoy, del más antiguo al más reciente, con `id`, `nombre`, `persona` y `devolucion`. Un equipo reservado no aparece aunque su fecha haya pasado.
- El **historial** de un equipo (solo IT) lista sus préstamos del más reciente al más antiguo, con `persona`, `devolucion` y `estado`; un equipo que no existe responde 404 «No existe el equipo».
- La fecha de devolución se devuelve igual que se recibe, como texto `AAAA-MM-DD`.
- Las operaciones «Solo IT» responden 403 «Solo IT puede hacer esto.» a una cuenta que no es de IT. Todos los errores son `{"error": "<mensaje>"}` con el mensaje exacto.

## Persistencia

- `prestamos_prestamos`: un documento por préstamo, con id el del préstamo y los campos `id`, `equipoId`, `persona`, `devolucion`, `estado` y `creadoEn`.
- `prestamos_activos`: un documento por equipo con préstamo activo, con id el del equipo y el campo `prestamoId`.
- La solicitud, el préstamo en el mostrador, la entrega y la devolución son transacciones del puerto de persistencia que primero leen `prestamos_activos/<id del equipo>` y el préstamo, y después escriben.

## Dependencias

- **equipos**: por su `index.ts`, para saber si un equipo existe (404 «No existe el equipo»), obtener el nombre de cada equipo para la lista y los vencidos, y saber si la persona del token es una cuenta de IT.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): el contrato sigue la API fijada por el cliente, también en las rutas que empiezan por `/api/equipos/`.
- [ADR 0002](../../../docs/adr/0002-un-prestamo-activo-por-equipo.md): un préstamo activo por equipo, garantizado con una transacción.
- [ADR 0004](../../../docs/adr/0004-lista-de-equipos-en-prestamos.md): este contexto sirve la lista de equipos con su estado.
