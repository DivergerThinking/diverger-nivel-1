# Contexto «Equipos»

## Propósito

Mantiene el inventario de equipos de la oficina que se pueden prestar. IT da de alta cada equipo con un nombre que no repite el de otro. Los demás contextos leen aquí qué equipos existen y cómo se llaman.

## Modelo

- **Equipo** (agregado): `id` (generado), `nombre` (como se dio de alta, sin espacios al principio ni al final) y **nombre normalizado** (el nombre en minúsculas).
- El tipo de equipo (portátil, monitor, proyector) forma parte del nombre; no hay un campo propio.

## Invariantes

- El nombre de un equipo no puede faltar ni estar vacío: el alta responde 400 «Falta el nombre del equipo».
- Dos equipos no tienen el mismo nombre normalizado: el alta responde 409 «Ya hay un equipo con ese nombre» (concurrencia, [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md)).
- Solo una cuenta de IT da de alta equipos; cualquier otra recibe 403 «Solo IT puede hacer esto.».
- Toda petición necesita un token de identidad de Google válido, con el correo verificado y emitido para el cliente OAuth de la aplicación; sin él, 401 «Inicia sesión con Google.».
- Un equipo recién dado de alta está `disponible`.

## Persistencia

- `equipos_equipos`: un documento por equipo, con id el del equipo.
- `equipos_nombres`: un documento por nombre normalizado (codificado como id válido), con el id del equipo.
- El alta lee `equipos_nombres` y escribe los dos documentos en una sola transacción del puerto de persistencia.

## Dependencias

Ninguna.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): la ruta y los errores siguen la API fijada por el cliente.
- [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md): nombre único con un índice de nombres en transacción.
- [ADR 0004](../../../docs/adr/0004-estado-de-los-equipos-en-prestamos.md): el estado de los equipos y su listado están en el contexto de préstamos.
