# Contexto «Préstamos»

## Propósito

Lleva el estado de cada equipo y sus préstamos: las solicitudes de los empleados, las entregas, los préstamos en el mostrador y las devoluciones de IT, los préstamos vencidos y el historial de cada equipo.

## Modelo

- **Estado del equipo** (agregado, uno por equipo): `estado` (`disponible`, `reservado` o `prestado`) y, si está reservado o prestado, **persona** y **fecha de devolución**.
- **Préstamo**: cada reserva o préstamo de un equipo, con persona, fecha de devolución y estado en el historial (`reservado`, `prestado` o `devuelto`).
- **Hoy**: el día actual en Madrid.

## Invariantes

- Todas las operaciones exigen sesión; sin token válido, 401 «Inicia sesión con Google.». Entregar, prestar en el mostrador, apuntar la devolución, ver los vencidos y ver el historial son solo de IT: con otra cuenta, 403 «Solo IT puede hacer esto.».
- Un equipo no está reservado o prestado dos veces a la vez: si llegan dos solicitudes o préstamos en el mostrador para el mismo equipo disponible, uno sale bien y el otro recibe 409 «El equipo no está disponible» (concurrencia, [ADR 0002](../../../docs/adr/0002-un-equipo-no-se-reserva-ni-presta-dos-veces.md)).
- La fecha de devolución es texto `AAAA-MM-DD` de un día que existe; si no, 400 «La fecha de devolución no es válida». Se devuelve igual que llegó.
- Quien pide un equipo no puede poner una fecha anterior a hoy (400 «La fecha de devolución ya ha pasado»); IT sí, al prestar en el mostrador.
- Solo se entrega un equipo reservado (409 «El equipo no está reservado») y solo se devuelve uno prestado (409 «El equipo no está prestado»). Entregar mantiene la persona y la fecha de la solicitud; devolver deja el equipo disponible, sin persona ni fecha.
- Un préstamo vence cuando el equipo está prestado y su fecha de devolución es anterior a hoy.
- Un equipo que no existe responde 404 «No existe el equipo».

## Persistencia

- `estadosEquipo`: un documento por equipo, con el id del equipo, con `estado`, `persona` y `devolucion`.
- `prestamos`: un documento por préstamo, con `equipo`, `persona`, `devolucion`, `estado` y la fecha en que se creó, para ordenar el historial.
- Cada cambio de estado escribe el estado del equipo y su préstamo en la misma transacción (ADR 0002). Un equipo sin documento de estado está disponible.

## Dependencias

- `equipos`: comprueba que el equipo existe y lee su nombre a través de su `index.ts`.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): el contrato sigue la API fijada por el cliente.
- [ADR 0002](../../../docs/adr/0002-un-equipo-no-se-reserva-ni-presta-dos-veces.md): transacción de Firestore sobre el estado del equipo.
