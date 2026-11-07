# Accesos

## Propósito

Identifica a quien hace cada petición y dice si su cuenta es de IT. Los demás contextos lo usan a través de su `index.ts` para exigir la sesión en todas sus rutas y reservar a IT las operaciones «Solo IT».

## Modelo

- **Sesión** (`Session`): la **persona** (el correo del token) y si es **cuenta de IT**.
- **Lista de IT** (`itAccountList`): los correos de `CORREOS_IT`, separados por comas, leídos de la configuración del despliegue.

## Invariantes

- Sin un token de identidad de Google válido (correo verificado y emitido para el cliente OAuth de la aplicación), toda ruta responde 401 con `{"error": "Inicia sesión con Google."}`. Vale el token de una persona o de una cuenta de servicio.
- Una cuenta es de IT solo si su correo está en la lista de IT, comparado sin distinguir mayúsculas.
- Una operación «Solo IT» responde 403 con `{"error": "Solo IT puede hacer esto."}` a cualquier cuenta que no sea de IT.
- La lista de IT no está en el código: se lee de la variable de entorno `CORREOS_IT`.

## Persistencia

Ninguna: no guarda datos. La sesión sale del token de cada petición (`lib/auth.ts`) y la lista de IT, de la configuración.

## Dependencias

Ninguna.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): la ruta de la sesión sigue las convenciones del formato, pero sus errores usan el formato del cliente.
