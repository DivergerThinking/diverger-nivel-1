# Equipos

## Propósito

Da de alta los equipos de la oficina con un nombre único y es la fuente de los equipos que existen. También decide qué cuentas son de IT, porque es la regla que protege el alta y la usan las operaciones de IT del resto de la aplicación.

## Modelo

- **Equipo** (agregado): `id` que genera la aplicación, **nombre del equipo** tal como se dio de alta, sin espacios al principio ni al final, y **nombre normalizado**.
- **Cuenta de IT**: un correo de la lista `CORREOS_IT`. No se guarda: se lee de la configuración del despliegue en cada petición.

## Invariantes

- Un equipo siempre tiene un nombre que no está vacío; si falta o está vacío, el alta responde 400 «Falta el nombre del equipo».
- Dos equipos nunca tienen el mismo nombre normalizado; el segundo alta responde 409 «Ya hay un equipo con ese nombre», también con dos altas a la vez (concurrencia, [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md)).
- Solo una cuenta de IT da de alta equipos; cualquier otra recibe 403 «Solo IT puede hacer esto.».
- Una cuenta es de IT cuando su correo está en `CORREOS_IT` (correos separados por comas), comparando sin distinguir mayúsculas y sin los espacios de alrededor. La lista se fija en la configuración del despliegue, nunca en el código.
- Sin un token de identidad de Google válido para el cliente OAuth de la aplicación, con el correo verificado, ninguna ruta responde otra cosa que 401 «Inicia sesión con Google.»; lo garantiza el servidor común (`app/server.ts` y `lib/auth.ts`) para todas las rutas de `/api`.
- Todo equipo recién dado de alta está disponible.

## Persistencia

- `equipos_equipos`: un documento por equipo, con id el `id` del equipo y los campos `id`, `nombre` y `nombreNormalizado`.
- `equipos_nombres`: un documento por nombre normalizado, con id ese nombre y el campo `equipoId`.
- El alta lee `equipos_nombres/<nombre normalizado>` y, si no existe, escribe el equipo y su nombre en la misma transacción del puerto de persistencia (`lib/datos.ts`).

## Dependencias

Ninguna.

El contexto `prestamos` usa su `index.ts` para leer un equipo, listar los equipos y saber si una cuenta es de IT.

## Decisiones

- [ADR 0002](../../../docs/adr/0002-api-fijada-por-el-cliente.md): la ruta y los errores siguen la API fijada por el cliente.
- [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md): unicidad del nombre con un documento por nombre normalizado.
- [ADR 0004](../../../docs/adr/0004-estado-del-equipo-en-prestamos.md): el estado del equipo no vive aquí sino en `prestamos`.
