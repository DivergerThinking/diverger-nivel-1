# Cuentas

## Propósito

Identifica la cuenta de cada petición a partir del token de identidad de Google y dice si es una cuenta de IT. Los demás contextos lo usan para exigir la sesión y para proteger las operaciones «Solo IT».

## Modelo

- **Cuenta** (`Account`): el correo verificado del token y si es cuenta de IT (`isIt`). No se guarda: se calcula en cada petición.
- **Cuenta de IT**: cuenta cuyo correo está en la variable de entorno `CORREOS_IT`, leída de la configuración del despliegue.

## Invariantes

- Toda ruta exige un token de identidad de Google válido, con el correo verificado y emitido para el cliente OAuth de la aplicación (`GOOGLE_CLIENT_ID`), de una persona o de una cuenta de servicio; sin él responde 401 con `{"error": "Inicia sesión con Google."}`.
- La persona de cada operación es el correo del token.
- Una cuenta es de IT si su correo está en `CORREOS_IT`, separada por comas, comparando sin distinguir mayúsculas y sin espacios alrededor de cada correo. La lista nunca está en el código.
- Una operación «Solo IT» con una cuenta que no es de IT responde 403 con `{"error": "Solo IT puede hacer esto."}` y no cambia nada.
- Una cuenta de IT también puede hacer todo lo de un empleado.

## Persistencia

Ninguna: no escribe en Firestore.

## Dependencias

Ninguna.

## Decisiones

- [ADR 0003](../../../docs/adr/0003-api-fijada-por-el-cliente.md): formato de los errores y la operación auxiliar `GET /api/cuentas/yo`.
