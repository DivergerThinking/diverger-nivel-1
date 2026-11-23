# Contexto «Equipos»

## Propósito

Lleva el inventario de equipos que se prestan: IT los da de alta con un nombre que no se repite. Es la referencia de qué equipos existen para el contexto de préstamos.

## Modelo

- **Equipo** (agregado): `id` (texto generado al darlo de alta) y `nombre` (texto tal como lo escribió IT).
- **Nombre normalizado** (valor): el nombre sin espacios al principio ni al final y en minúsculas.

## Invariantes

- Solo una **cuenta de IT** da de alta equipos; cualquier otra cuenta recibe 403 «Solo IT puede hacer esto.».
- Un equipo tiene nombre: si falta o está vacío, el alta responde 400 «Falta el nombre del equipo».
- Dos equipos no tienen el mismo **nombre normalizado**: el alta de uno repetido responde 409 «Ya hay un equipo con ese nombre», también con dos altas a la vez (concurrencia, [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md)).
- Un equipo recién dado de alta está disponible; su estado lo lleva el contexto de préstamos ([ADR 0004](../../../docs/adr/0004-estado-de-los-equipos-en-prestamos.md)).

## Persistencia

- `equipos_equipos`: un documento por equipo, con id el del equipo, con `id` y `nombre`.
- `equipos_nombres`: un documento por nombre normalizado, con el `id` del equipo. El alta lee este documento y, si no existe, guarda el equipo y el nombre en la misma transacción del puerto de persistencia.

Solo este contexto escribe en estas colecciones. Su `index.ts` ofrece a otros contextos leer un equipo por id y listar todos los equipos.

## Dependencias

Ninguna.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): el contrato sigue la API fijada por el cliente.
- [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md): nombre único con un documento por nombre normalizado.
- [ADR 0004](../../../docs/adr/0004-estado-de-los-equipos-en-prestamos.md): el estado de cada equipo lo lleva el contexto de préstamos.
