# Equipos

## Propósito

Es el inventario de equipos de la oficina. IT da de alta los equipos con un nombre único, y los demás contextos consultan aquí si un equipo existe y cómo se llama.

## Modelo

- **Equipo** (agregado): `id`, generado al darlo de alta, y `nombre`, tal como se envió.
- **Nombre normalizado**: el nombre sin espacios en los extremos y en minúsculas. Es la clave de unicidad.

## Invariantes

- Solo una cuenta de IT da de alta equipos.
- Un equipo recién dado de alta está en estado `disponible`.
- El nombre es obligatorio: si falta o está vacío, 400 con `{"error": "Falta el nombre del equipo"}`.
- Dos equipos no tienen el mismo nombre normalizado; el segundo recibe 409 con `{"error": "Ya hay un equipo con ese nombre"}` (concurrencia, [ADR 0002](../../../docs/adr/0002-nombre-de-equipo-unico.md)).

## Persistencia

- `equipos_equipos`: un documento por equipo, con id el id del equipo y los campos `id` y `nombre`.
- `equipos_nombres`: un documento por nombre normalizado, con id ese nombre y el campo `equipo` con el id del equipo.
- El alta lee `equipos_nombres/<nombre normalizado>` y escribe los dos documentos en la misma transacción.

## Dependencias

- `cuentas`: para saber si quien da de alta es una cuenta de IT.

## Decisiones

- [ADR 0002](../../../docs/adr/0002-nombre-de-equipo-unico.md): unicidad del nombre con un documento por nombre normalizado.
- [ADR 0003](../../../docs/adr/0003-api-fijada-por-el-cliente.md): la ruta y los errores son los del cliente.
- [ADR 0004](../../../docs/adr/0004-reparto-de-contextos.md): la lista de equipos con su estado la sirve `prestamos`.
