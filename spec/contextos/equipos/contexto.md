# Equipos

## Propósito

Mantiene el catálogo de equipos de IT: los da de alta con un nombre único y dice si existe un equipo y cómo se llama. También decide qué cuentas son de IT, para que las operaciones «Solo IT» de toda la aplicación usen la misma regla.

## Modelo

- **Equipo** (agregado): `id` generado por la aplicación y **nombre del equipo**, guardado sin los espacios de los extremos.
- **Nombre normalizado** (objeto de valor): el nombre sin espacios en los extremos y en minúsculas.
- **Cuenta de IT** (regla): un correo de la lista `CORREOS_IT`, comparado sin distinguir mayúsculas.

## Invariantes

- El nombre del equipo es obligatorio: si falta, está vacío o solo tiene espacios, el alta responde 400 «Falta el nombre del equipo».
- Dos equipos nunca tienen el mismo nombre normalizado: el alta de un nombre repetido responde 409 «Ya hay un equipo con ese nombre», también con dos altas simultáneas (concurrencia, [ADR 0002](../../../docs/adr/0002-nombres-de-equipo-unicos.md)).
- Un equipo recién dado de alta está disponible.
- Solo una cuenta de IT da de alta equipos; cualquier otra recibe 403 «Solo IT puede hacer esto.».
- La lista de cuentas de IT sale de la variable de entorno `CORREOS_IT`, nunca del código.
- Sin un token de Google válido, toda ruta responde 401 «Inicia sesión con Google.» (lo hace el servidor del golden path antes de llegar al contexto).

## Persistencia

- `equipos_equipos`: un documento por equipo, con id el del equipo y los campos `id` y `nombre`.
- `equipos_nombres`: un documento por nombre normalizado, con el id del equipo. El alta lee este documento y crea los dos en la misma transacción del puerto de persistencia.

## Dependencias

Ninguna.

Su `index.ts` ofrece a otros contextos: obtener un equipo por id, listar los equipos y saber si un correo es de una cuenta de IT.

## Decisiones

- [ADR 0002](../../../docs/adr/0002-nombres-de-equipo-unicos.md): nombres únicos con un documento por nombre normalizado.
- [ADR 0003](../../../docs/adr/0003-api-fijada-por-el-cliente.md): la ruta y los errores son los que fijó el cliente.
- [ADR 0004](../../../docs/adr/0004-cuentas-de-it-en-el-contexto-equipos.md): este contexto decide qué cuentas son de IT.
