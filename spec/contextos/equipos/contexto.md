# Equipos

## Propósito

Guarda los equipos de la oficina que se prestan. IT los da de alta con un nombre que no se repite, y los demás contextos los consultan por id.

## Modelo

- **Equipo** (`Device`): `id`, generado al darlo de alta, y **nombre del equipo** (`name`).
- **Nombre normalizado** (`normalizedName`): el nombre sin espacios al principio y al final y en minúsculas.

## Invariantes

- Solo una cuenta de IT da de alta un equipo; con otra cuenta, 403 `{"error": "Solo IT puede hacer esto."}`.
- El nombre es obligatorio: si falta, no es un texto o queda vacío al quitarle los espacios, 400 `{"error": "Falta el nombre del equipo"}`.
- Dos equipos no comparten nombre normalizado: el alta con un nombre repetido responde 409 `{"error": "Ya hay un equipo con ese nombre"}` y no crea nada, también con dos altas a la vez (concurrencia, [ADR 0002](../../../docs/adr/0002-nombre-de-equipo-unico.md)).
- Un equipo recién dado de alta responde 201 con `{"id", "nombre", "estado": "disponible"}`; el nombre se guarda sin los espacios al principio y al final.

## Persistencia

- `equipos_equipos`: un documento por equipo, con id el del equipo, y campos `nombre` y `creadoEn`.
- `equipos_nombres`: un documento por nombre normalizado, con id ese nombre y el campo `equipoId`.
- El alta escribe los dos documentos en una transacción de `Almacen.transaccion` (`lib/datos.ts`) que crea el de `equipos_nombres` solo si no existe.

## Dependencias

- `cuentas`: para exigir la sesión y comprobar que el alta la hace una cuenta de IT.

## Decisiones

- [ADR 0002](../../../docs/adr/0002-nombre-de-equipo-unico.md): unicidad del nombre con un documento por nombre normalizado.
- [ADR 0003](../../../docs/adr/0003-api-fijada-por-el-cliente.md): ruta y errores fijados por el cliente.
- [ADR 0004](../../../docs/adr/0004-reparto-de-contextos.md): la lista de equipos con su estado está en `prestamos`; `equipos` expone en su `index.ts` la consulta de un equipo y la lista de equipos.
