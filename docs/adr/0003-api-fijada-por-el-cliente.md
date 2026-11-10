# 0003. Los contratos siguen la API fijada por el cliente

- **Estado:** Propuesto
- **Fecha:** 10/11/2026
- **Contexto delimitado:** equipos, prestamos

## Contexto

El inventario de IT se conecta a la aplicación y el cliente ha fijado la API exactamente (sección «API fijada por el cliente» de la intención de la iniciativa): rutas, métodos, campos, códigos y errores como `{"error": "<mensaje>"}` con mensajes exactos. Las convenciones del formato de la especificación ponen las rutas bajo `/api/<id>/` y los errores en RFC 9457 (`application/problem+json`).

## Opciones

1. **Seguir la API del cliente por encima de las convenciones.** Las rutas son las del cliente (`/api/equipos`, `/api/equipos/{id}/...`, `/api/prestamos/vencidos`) y los errores son `application/json` con la propiedad `error` y el mensaje exacto.
2. **Seguir las convenciones y adaptar con una capa de traducción.** Rutas `/api/<id>/` y RFC 9457, con un adaptador para el inventario. Duplica rutas y añade una capa que el problema no pide.

## Decisión

Opción 1. Que el inventario deje de funcionar si la API cambia es uno de los riesgos que preocupan al cliente; la API se expone tal como la fijó.

## Consecuencias

- No hay prefijo `/api/<id>/` ni errores RFC 9457 en ningún contrato.
- Lo que la API del cliente no fija (el esquema exacto de un campo, el orden de las comprobaciones) sigue las convenciones y queda como supuesto en `spec/arquitectura.md`.
- Cambiar una ruta, un campo, un código o un mensaje de esta API es un cambio incompatible: una tarea propia, en serie y con ADR.
