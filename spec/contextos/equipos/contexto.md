# Contexto «Equipos»

## Propósito

Mantiene el inventario de equipos de la oficina: IT da de alta cada equipo con un nombre único. Los demás contextos leen los equipos a través de su `index.ts`.

## Modelo

- **Equipo** (agregado): `id`, `nombre` y **nombre normalizado**.
- **Cuenta de IT**: el alta solo la hace una cuenta de IT.

## Invariantes

- Todas las operaciones exigen sesión con un token de identidad de Google con el correo verificado, emitido para el cliente OAuth de la aplicación; sin él responden 401 «Inicia sesión con Google.».
- Solo una cuenta de IT da de alta equipos; con otra cuenta, 403 «Solo IT puede hacer esto.».
- El nombre es obligatorio: si falta o está vacío, 400 «Falta el nombre del equipo».
- Dos equipos no comparten nombre normalizado: el alta de uno repetido responde 409 «Ya hay un equipo con ese nombre», también con dos altas a la vez (concurrencia, [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md)).

## Persistencia

- `equipos`: un documento por equipo con `nombre` y `nombreNormalizado`.
- `nombresEquipo`: un documento por nombre normalizado con el id del equipo; se crea en la misma transacción que el equipo.

## Dependencias

Ninguna.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): el contrato sigue la API fijada por el cliente.
- [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md): unicidad del nombre con un documento índice.
