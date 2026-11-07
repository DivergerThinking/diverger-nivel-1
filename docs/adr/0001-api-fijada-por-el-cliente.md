# 0001. Los contratos siguen la API fijada por el cliente

- **Estado:** Propuesto
- **Fecha:** 07/11/2026
- **Contexto delimitado:** equipos, prestamos

## Contexto

El inventario de IT se conecta a la aplicación, y la petición del cliente fija la API exactamente: rutas, métodos, campos, códigos y mensajes de error. Las convenciones del formato de `spec/` ponen las rutas bajo `/api/<contexto>/` y los errores en RFC 9457 (`application/problem+json`). Si se siguieran, el inventario dejaría de funcionar.

## Opciones

1. **Copiar la API del cliente tal cual.** Rutas como `/api/equipos/{id}/solicitud` y `/api/prestamos/vencidos`, y errores `{"error": "<mensaje>"}` en `application/json`, con los mensajes exactos.
2. **Seguir las convenciones del formato** y ofrecer al inventario una capa de traducción aparte.

## Decisión

La opción 1. La API es un contrato con otro sistema que no controlamos, y una capa de traducción duplicaría cada ruta sin aportar nada. Las operaciones se reparten entre los contextos según el dueño de sus datos; solo las rutas, los campos, los códigos y los errores son del cliente.

## Consecuencias

- Los contratos de `equipos` y `prestamos` no llevan el prefijo `/api/<contexto>/` en las rutas del cliente, y sus errores usan el esquema `Error` con la propiedad obligatoria `error`.
- La ruta `GET /api/equipos` es de `prestamos` y `POST /api/equipos` es de `equipos`: comparten la ruta, pero cada método tiene un único dueño.
- Lo que el cliente no fija (la ruta de la sesión del contexto `accesos`) sigue las convenciones del formato, salvo el formato de error, que se unifica con el del cliente.
- Cambiar una ruta o un mensaje rompe el inventario: cualquier cambio de contrato es incompatible y necesita su propio ADR.
