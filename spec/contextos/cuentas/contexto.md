# Cuentas

## Propósito

Decide quién es la persona de cada petición y si es una cuenta de IT. El inicio de sesión con Google lo verifica la plantilla del golden path en todas las rutas de `/api`; este contexto ofrece a los demás la comprobación de cuenta de IT y a la interfaz una ruta para saber quién ha iniciado sesión.

## Modelo

- **Persona**: el correo y el nombre del token de identidad verificado.
- **Cuenta de IT**: una persona cuyo correo está en `CORREOS_IT`.
- **Empleado**: una persona que no es cuenta de IT.

## Invariantes

- Sin un token de identidad de Google válido, con el correo verificado y emitido para el cliente OAuth de la aplicación, toda ruta de `/api` responde 401 con `{"error": "Inicia sesión con Google."}` (lo hace la plantilla).
- Una persona es cuenta de IT si y solo si su correo está en la lista `CORREOS_IT`, separada por comas, comparando sin distinguir mayúsculas y sin los espacios de alrededor de cada correo.
- La lista `CORREOS_IT` sale de la configuración del despliegue, nunca del código.
- Una cuenta de IT puede hacer también todo lo de un empleado.

## Persistencia

Ninguna colección: la lista de cuentas de IT se lee de la variable de entorno `CORREOS_IT`.

## Dependencias

Ninguna.

## Decisiones

- [ADR 0003](../../../docs/adr/0003-api-fijada-por-el-cliente.md): formato de error `{"error": "<mensaje>"}` también en sus rutas.
- [ADR 0004](../../../docs/adr/0004-reparto-de-contextos.md): este contexto decide quién es de IT para toda la aplicación.
