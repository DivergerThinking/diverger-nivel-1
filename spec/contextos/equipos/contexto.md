# Contexto «Equipos»

## Propósito

Guarda qué equipos tiene la oficina: IT los da de alta con un nombre único. También decide qué cuentas son de IT, a partir de la variable de entorno `CORREOS_IT`, para todas las operaciones «Solo IT» de la aplicación.

## Modelo

- **Equipo** (agregado): `id` (generado al dar de alta), **nombre del equipo** tal como lo escribió IT y **clave del nombre**.
- **Cuenta de IT** (objeto de valor): un correo de `CORREOS_IT`, comparado sin distinguir mayúsculas.

## Invariantes

- Un equipo siempre tiene nombre: un alta sin nombre o con el nombre vacío responde 400 «Falta el nombre del equipo» y no crea nada.
- No hay dos equipos con la misma clave del nombre: « portátil 07 » repite «Portátil 07», y el alta responde 409 «Ya hay un equipo con ese nombre», también si llegan dos altas a la vez (concurrencia, [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md)).
- Solo una cuenta de IT da de alta equipos; cualquier otra recibe 403 «Solo IT puede hacer esto.».
- La lista de cuentas de IT se lee de `CORREOS_IT` (correos separados por comas), nunca del código; dos correos son el mismo aunque cambien las mayúsculas.

## Persistencia

- `equipos_equipos`: un documento por equipo, con id el del equipo y los campos `id`, `nombre` y `claveNombre`.
- `equipos_nombres`: un documento por clave del nombre, con id la clave y el campo `equipoId`.
- El alta es una transacción del puerto de persistencia que lee `equipos_nombres/<clave>` y, si no existe, escribe los dos documentos.

## Dependencias

Ninguna.

Su `index.ts` ofrece a los demás contextos cómo obtener un equipo por su id, cómo listar los equipos y cómo saber si un correo es de una cuenta de IT.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): el contrato sigue la API fijada por el cliente.
- [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md): el nombre único se garantiza con una transacción sobre un documento por clave del nombre.
- [ADR 0004](../../../docs/adr/0004-lista-de-equipos-en-prestamos.md): la lista de equipos con su estado la sirve `prestamos`, y la comprobación de cuentas de IT vive aquí.
