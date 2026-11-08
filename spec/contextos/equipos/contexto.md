# Equipos

## Propósito

Mantiene el inventario de equipos que IT presta: portátiles, monitores y proyectores. IT los da de alta con un nombre único, y los demás contextos los consultan por su `index.ts`.

## Modelo

- **Equipo** (agregado): id, nombre del equipo y nombre normalizado.
- **Nombre del equipo**: texto obligatorio, guardado sin los espacios del principio y del final.
- **Nombre normalizado**: el nombre en minúsculas y sin esos espacios; clave de unicidad.

## Invariantes

- Solo una cuenta de IT da de alta equipos; cualquier otra recibe 403 con `{"error": "Solo IT puede hacer esto."}`.
- El nombre es obligatorio: si falta o está vacío, 400 con `{"error": "Falta el nombre del equipo"}`.
- No hay dos equipos con el mismo nombre normalizado, tampoco con dos altas a la vez: el segundo recibe 409 con `{"error": "Ya hay un equipo con ese nombre"}` (concurrencia, [ADR 0002](../../../docs/adr/0002-nombre-de-equipo-unico.md)).
- Un equipo recién dado de alta está `disponible`.

## Persistencia

- `equipos_equipos`: un documento por equipo, con su id, nombre y nombre normalizado.
- `equipos_nombres`: un documento por nombre normalizado, con el id del equipo.
- El alta crea los dos documentos en una sola transacción del puerto de persistencia.

`index.ts` ofrece a otros contextos `obtenerEquipo(id)` y `listarEquipos()`, solo de lectura.

## Dependencias

- `cuentas`: para saber si la persona es una cuenta de IT antes de dar de alta.

## Decisiones

- [ADR 0002](../../../docs/adr/0002-nombre-de-equipo-unico.md): nombre único con un documento por nombre normalizado.
- [ADR 0003](../../../docs/adr/0003-api-fijada-por-el-cliente.md): ruta y errores de la API fijada por el cliente.
- [ADR 0004](../../../docs/adr/0004-reparto-de-contextos.md): reparto de contextos.
