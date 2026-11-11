# Equipos

## Propósito

Da de alta los equipos de la oficina y guarda su nombre, que no se repite. Es la fuente de qué equipos existen; lo que les pasa después (reservas, préstamos, devoluciones) es del contexto `prestamos`.

## Modelo

- **Equipo** (agregado): `id` generado por la aplicación y **nombre del equipo**, tal como lo escribe IT.
- **Nombre normalizado** (objeto de valor): el nombre sin espacios en los extremos y en minúsculas.

## Invariantes

- Un equipo siempre tiene nombre: un nombre que falta o está vacío responde 400 «Falta el nombre del equipo».
- No hay dos equipos con el mismo nombre normalizado: el segundo responde 409 «Ya hay un equipo con ese nombre» (concurrencia, [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md)).
- Un equipo recién dado de alta está disponible.
- Solo una cuenta de IT da de alta equipos; las demás reciben 403 «Solo IT puede hacer esto.».
- Sin token de identidad de Google válido, la respuesta es 401 «Inicia sesión con Google.».

## Persistencia

- `equipos_equipos`: un documento por equipo, con id el del equipo: `{ id, nombre }`.
- `equipos_nombres`: un documento por nombre normalizado, con id ese nombre: `{ equipoId }`.
- El alta lee `equipos_nombres` y escribe el índice y el equipo en una sola transacción del puerto de persistencia (`lib/datos.ts`).

## Dependencias

Ninguna.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): la ruta y los errores son los de la API fijada por el cliente.
- [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md): el nombre único se garantiza con un índice de nombres en una transacción.
- [ADR 0004](../../../docs/adr/0004-la-lista-de-equipos-la-sirve-prestamos.md): la lista de equipos con su estado la sirve `prestamos`; este contexto expone en su `index.ts` la consulta de un equipo por id y la lista de equipos.
