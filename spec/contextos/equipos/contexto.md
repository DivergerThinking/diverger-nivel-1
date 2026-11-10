# Equipos

## Propósito

Mantiene el inventario de equipos de la oficina que se pueden prestar: IT los da de alta con un nombre que no se repite. Es la fuente de qué equipos existen; no sabe quién los tiene.

## Modelo

- **Equipo** (agregado): `id` (generado al dar de alta), **nombre del equipo** tal como lo escribió IT, sin espacios en los extremos.
- **Nombre normalizado** (objeto de valor): el nombre sin espacios en los extremos y en minúsculas.

## Invariantes

- Solo una **cuenta de IT** da de alta equipos; cualquier otra recibe 403 «Solo IT puede hacer esto.».
- Toda operación exige sesión con un token de identidad de Google válido; sin él, 401 «Inicia sesión con Google.».
- Un equipo siempre tiene nombre: un nombre que falta o queda vacío responde 400 «Falta el nombre del equipo».
- Dos equipos nunca tienen el mismo **nombre normalizado**; el segundo alta responde 409 «Ya hay un equipo con ese nombre» (concurrencia, [ADR 0002](../../../docs/adr/0002-nombre-de-equipo-unico.md)).
- Un equipo recién dado de alta está disponible.

## Persistencia

- `equipos_equipos`: un documento por equipo, con id el `id` del equipo y los campos `id` y `nombre`.
- `equipos_nombres`: un documento por nombre normalizado (codificado para que sirva de id) con el `id` del equipo.
- El alta lee `equipos_nombres/<nombre normalizado>` y, si no existe, escribe los dos documentos en la misma transacción del puerto de persistencia.

## Dependencias

Ninguna. Su `index.ts` ofrece a otros contextos la lectura de un equipo por id y la lista de equipos.

## Decisiones

- [ADR 0002](../../../docs/adr/0002-nombre-de-equipo-unico.md): unicidad del nombre con un documento por nombre normalizado.
- [ADR 0003](../../../docs/adr/0003-api-fijada-por-el-cliente.md): el contrato sigue la API fijada por el cliente.
- [ADR 0004](../../../docs/adr/0004-la-lista-de-equipos-la-sirve-prestamos.md): la lista de equipos con su estado la sirve prestamos.
