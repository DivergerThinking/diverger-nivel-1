# Cuentas

## Propósito

Resuelve quién hace cada petición y si es una cuenta de IT. Todas las rutas de la aplicación necesitan una persona con sesión, y las operaciones «Solo IT» necesitan además una cuenta de IT.

## Modelo

- **Persona**: el correo verificado del token de identidad de Google, emitido para el cliente OAuth de la aplicación (`GOOGLE_CLIENT_ID`). Vale tanto para personas como para cuentas de servicio.
- **Cuenta de IT**: una persona cuyo correo está en la variable de entorno `CORREOS_IT`, una lista de correos separados por comas que se fija en la configuración del despliegue, no en el código.

## Invariantes

- Una petición sin token, con un token que no es de Google, con el correo sin verificar o emitido para otro cliente OAuth recibe 401 con `{"error": "Inicia sesión con Google."}`.
- Una operación «Solo IT» con una persona que no es cuenta de IT recibe 403 con `{"error": "Solo IT puede hacer esto."}` y no cambia nada.
- Dos correos son el mismo aunque cambien las mayúsculas, también al compararlos con `CORREOS_IT`.
- Una cuenta de IT puede hacer también todo lo que hace un empleado.

## Persistencia

Ninguna: la persona sale del token en cada petición y las cuentas de IT de la variable de entorno `CORREOS_IT`.

## Dependencias

Ninguna.

## Decisiones

- [ADR 0003](../../../docs/adr/0003-api-fijada-por-el-cliente.md): los mensajes y el formato de error de 401 y 403 son los del cliente.
- [ADR 0004](../../../docs/adr/0004-reparto-de-contextos.md): `cuentas` es el contexto común de la sesión y del permiso de IT.
