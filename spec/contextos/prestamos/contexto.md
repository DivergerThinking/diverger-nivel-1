# Préstamos

## Propósito

Registra lo que les pasa a los equipos con el tiempo: solicitudes, entregas, préstamos en el mostrador y devoluciones. Sabe en qué estado está cada equipo y quién lo tiene, y a partir de eso muestra la lista de equipos con su estado, los préstamos vencidos y el historial de cada equipo.

## Modelo

- **Préstamo activo** (agregado, uno por equipo como mucho): id del equipo, **estado del equipo** (`reservado` o `prestado`), **persona**, **fecha de devolución** e id del préstamo del historial.
- **Préstamo** (entidad del historial): id, id del equipo, persona, fecha de devolución, estado (`reservado`, `prestado` o `devuelto`) y momento de creación.
- **Fecha de devolución** (objeto de valor): texto `AAAA-MM-DD` que es una fecha que existe; se devuelve igual que llega.
- **Hoy**: el día en curso en Madrid (Europe/Madrid).
- Un equipo sin préstamo activo está `disponible`; el nombre y la existencia del equipo los da el contexto equipos.

## Invariantes

- Un equipo tiene como mucho un préstamo activo: nunca está reservado o prestado dos veces a la vez, y de dos solicitudes o préstamos en el mostrador simultáneos sobre el mismo equipo disponible, una sale bien y la otra recibe 409 «El equipo no está disponible» (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- La solicitud deja el equipo `reservado` a nombre del correo del token. Falta la fecha: 400 «Falta la fecha de devolución»; no es una fecha que exista: 400 «La fecha de devolución no es válida»; es anterior a hoy: 400 «La fecha de devolución ya ha pasado»; el equipo no existe: 404 «No existe el equipo»; no está disponible: 409 «El equipo no está disponible».
- La entrega solo vale para un equipo reservado y lo deja `prestado` con la misma persona y fecha de devolución; si no está reservado: 409 «El equipo no está reservado» (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- El préstamo en el mostrador deja `prestado` un equipo disponible y admite una fecha anterior a hoy. Faltan la persona o la fecha: 400 «Faltan la persona o la fecha de devolución»; la fecha no existe: 400 «La fecha de devolución no es válida»; no está disponible: 409 «El equipo no está disponible».
- La devolución solo vale para un equipo prestado, lo deja `disponible` sin persona ni fecha de devolución y marca el préstamo como `devuelto`; si no está prestado: 409 «El equipo no está prestado» (concurrencia, [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md)).
- Toda operación sobre un equipo que no existe responde 404 «No existe el equipo».
- Los préstamos vencidos son los equipos prestados con fecha de devolución anterior a hoy, del más antiguo al más reciente; un equipo reservado nunca está vencido.
- El historial lista los préstamos del equipo del más reciente al más antiguo.
- Entrega, préstamo en el mostrador, devolución, vencidos e historial son «Solo IT»: cualquier otra cuenta recibe 403 «Solo IT puede hacer esto.». Ver los equipos y pedir uno es para todos.
- Sin un token de Google válido, toda ruta responde 401 «Inicia sesión con Google.» (lo hace el servidor del golden path).

## Persistencia

- `prestamos_activos`: un documento por equipo reservado o prestado, con id el del equipo.
- `prestamos_historial`: un documento por préstamo.
- Solicitud, préstamo en el mostrador, entrega y devolución leen `prestamos_activos/<id del equipo>` y escriben ese documento y el del historial en una sola transacción del puerto de persistencia.

## Dependencias

- **equipos**: para saber si existe un equipo, su nombre y la lista de equipos, y si un correo es de una cuenta de IT. Lo usa a través de su `index.ts`, sin leer sus colecciones.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-un-prestamo-activo-por-equipo.md): un préstamo activo por equipo, garantizado con una transacción.
- [ADR 0003](../../../docs/adr/0003-api-fijada-por-el-cliente.md): las rutas y los errores son los que fijó el cliente.
- [ADR 0004](../../../docs/adr/0004-cuentas-de-it-en-el-contexto-equipos.md): las cuentas de IT se comprueban con la función del contexto equipos.
