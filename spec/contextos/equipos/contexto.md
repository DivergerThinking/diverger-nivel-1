# Contexto «Equipos»

## Propósito

Mantiene el inventario de equipos de la oficina: IT da de alta cada equipo con su nombre, sin nombres repetidos. También decide qué cuentas son cuentas de IT, para que `prestamos` aplique la misma regla en sus operaciones «Solo IT».

## Modelo

- **Equipo** (agregado): `id` (texto generado), `nombre` (el nombre del equipo tal como lo da IT, sin los espacios del principio y del final) y `nombreNormalizado`.
- **Nombre normalizado** (objeto valor): el nombre del equipo sin espacios al principio y al final y en minúsculas.
- **Cuenta de IT** (objeto valor): un correo de la variable de entorno `CORREOS_IT`, con los correos separados por comas, comparado sin distinguir mayúsculas. La lista se fija en la configuración del despliegue, no en el código.

El `index.ts` del contexto ofrece a los demás: obtener un equipo por id, listar los equipos y saber si un correo es de una cuenta de IT.

## Invariantes

- El nombre del equipo es obligatorio: si falta o está vacío, el alta responde 400 «Falta el nombre del equipo».
- Dos equipos no tienen el mismo nombre normalizado; un alta repetida responde 409 «Ya hay un equipo con ese nombre» (concurrencia, [ADR 0002](../../../docs/adr/0002-nombre-de-equipo-unico.md)).
- Un equipo nuevo empieza `disponible`.
- Solo una cuenta de IT da de alta equipos; cualquier otra recibe 403 «Solo IT puede hacer esto.».
- Los equipos no se borran.

## Persistencia

- `equipos_equipos`: un documento por equipo, con id el id del equipo (`id`, `nombre`, `nombreNormalizado`).
- `equipos_nombres`: un documento por nombre normalizado, con id ese nombre y el id de su equipo.
- El alta lee `equipos_nombres/<nombreNormalizado>` y escribe los dos documentos en una sola transacción del puerto de persistencia (`lib/datos.ts`).

## Dependencias

Ninguna.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): el contrato sigue la API fijada por el cliente.
- [ADR 0002](../../../docs/adr/0002-nombre-de-equipo-unico.md): el nombre único se garantiza con un documento por nombre normalizado en una transacción.
