# 0003. La API es la que fijó el cliente

- **Estado:** Propuesto
- **Fecha:** 07/11/2026
- **Contexto delimitado:** equipos y prestamos

## Contexto

El inventario de IT se conecta a la aplicación, así que la petición fija la API exacta: rutas, métodos, campos, códigos y mensajes, con errores `{"error": "<mensaje>"}`. Las convenciones de la especificación ponen las rutas bajo `/api/<contexto>/` y los errores en RFC 9457 (`application/problem+json`).

## Opciones

1. **La API del cliente tal cual.** Cada operación usa la ruta, los campos, los códigos y los mensajes del anexo, con errores `{"error": "<mensaje>"}` en `application/json`.
2. **Las convenciones y una capa de traducción.** Rutas bajo `/api/<contexto>/` con RFC 9457 y otra capa que traduce a la API del cliente.

## Decisión

Opción 1. El cliente exige esa API exactamente; una capa de traducción duplica las rutas y es otro sitio donde puede romperse el inventario.

## Consecuencias

- Las rutas no llevan el prefijo del contexto: `POST /api/equipos` es del contexto `equipos`, y `GET /api/equipos`, las operaciones sobre `/api/equipos/{id}/…` y `GET /api/prestamos/vencidos` son del contexto `prestamos`.
- Los errores son `{"error": "<mensaje>"}` en `application/json`, igual que el 401 del servidor del golden path.
- Cambiar una ruta, un campo, un código o un mensaje rompe el inventario: es un cambio incompatible del contrato.
