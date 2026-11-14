# 0001. Los contratos siguen la API fijada por el cliente

- **Estado:** Propuesto
- **Fecha:** 14/11/2026
- **Contexto delimitado:** equipos, prestamos

## Contexto

El inventario de IT se va a conectar a la aplicación y el cliente fijó la API exacta en el anexo de su petición, copiado en la sección «API fijada por el cliente» de `intent.md`. Esa API choca con dos convenciones del formato de `spec/`: las rutas van bajo `/api/<id>/` y los errores siguen RFC 9457 (`application/problem+json`).

## Opciones

1. **Copiar la API del cliente tal cual.** Las rutas son `/api/equipos…` y `/api/prestamos/vencidos`, sin el prefijo del contexto, y los errores son `{"error": "<mensaje>"}` en `application/json`, con los mensajes exactos del anexo.
2. **Seguir las convenciones y traducir.** Rutas `/api/<id>/…` y errores RFC 9457, con una capa que traduzca a la API del cliente.

## Decisión

Opción 1. El cliente exige que la API sea exactamente la del anexo, y una capa de traducción añadiría código y otra fuente de diferencias sin aportar nada. Cada operación va al contexto que posee sus datos; solo las rutas, los campos, los códigos y los errores son del cliente.

## Consecuencias

- Los contratos `spec/contextos/equipos/api.openapi.json` y `spec/contextos/prestamos/api.openapi.json` usan las rutas del cliente y el esquema `Error` con la propiedad `error`.
- `POST /api/equipos` está en el contrato de `equipos` y `GET /api/equipos` en el de `prestamos`: la misma ruta con métodos distintos en dos contratos (ADR 0004).
- Cambiar una ruta, un campo o un mensaje rompe el inventario de IT: es un cambio incompatible de contrato, con su propia tarea y su ADR.
