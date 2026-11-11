# 0001. Los contratos siguen la API fijada por el cliente

- **Estado:** Propuesto
- **Fecha:** 11/11/2026
- **Contexto delimitado:** equipos, prestamos

## Contexto

El inventario de IT se va a conectar a la aplicación y la petición del cliente fija la API exactamente: rutas, campos, códigos de estado y errores como `{"error": "<mensaje>"}` con mensajes literales. Las convenciones de la especificación ponen las rutas bajo `/api/<contexto>/` y los errores en formato RFC 9457 (`application/problem+json`), y eso rompería el inventario.

## Opciones

1. **Copiar la API del cliente tal cual.** Las rutas, los campos, los códigos y el cuerpo de error del anexo, sin prefijo de contexto ni RFC 9457.
2. **Usar las convenciones y traducir.** Rutas `/api/<contexto>/…` con errores RFC 9457, y una capa de traducción para el inventario.

## Decisión

Opción 1. La petición dice que la API «tiene que ser exactamente esta», y una capa de traducción añadiría una pieza que el problema no pide y que podría desviarse del anexo. Cada operación va al contexto dueño de sus datos; solo las rutas, los campos, los códigos y los errores son del cliente.

## Consecuencias

- Las rutas no llevan el prefijo `/api/<contexto>/`: `POST /api/equipos` es de `equipos` y `GET /api/equipos` es de `prestamos`.
- Los errores son `application/json` con la propiedad `error` y los mensajes del anexo, carácter a carácter.
- Cambiar una ruta, un campo o un mensaje rompe el inventario: es un cambio incompatible de contrato, una tarea propia y con su ADR.
