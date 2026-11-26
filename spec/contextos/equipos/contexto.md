# Contexto «Equipos»

## Propósito

Mantiene el inventario de equipos que se prestan: IT los da de alta con un nombre único. También aplica el control de acceso común: quién ha iniciado sesión y quién es una cuenta de IT.

## Modelo

- **Equipo** (agregado): `id`, **Nombre del equipo**.
- **Cuenta de IT**: correo incluido en `CORREOS_IT`, comparado sin distinguir mayúsculas.

## Invariantes

- El nombre del equipo es obligatorio y no puede estar vacío.
- No hay dos equipos con el mismo nombre, sin distinguir mayúsculas ni espacios al principio o al final (concurrencia, [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md)).
- Solo una cuenta de IT da de alta equipos; cualquier otra recibe 403 «Solo IT puede hacer esto.».
- Toda petición necesita un token de identidad de Google válido, con el correo verificado y emitido para el cliente OAuth de la aplicación; sin él, 401 «Inicia sesión con Google.».

## Persistencia

- `equipos`: un documento por equipo (`id`, `nombre`).
- `nombresEquipos`: un documento por nombre normalizado, creado en la misma transacción que el equipo.

## Dependencias

Ninguna.

Su `index.ts` ofrece a `prestamos` la consulta de un equipo por id y la lista de equipos, y la comprobación de sesión y de cuenta de IT.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): los contratos siguen la API fijada por el cliente.
- [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md): el nombre de un equipo es único.
