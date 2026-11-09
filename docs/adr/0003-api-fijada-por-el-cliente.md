# 0003. La API la fija el cliente

- **Estado:** Propuesto
- **Fecha:** 09/11/2026
- **Contexto delimitado:** cuentas, equipos y prestamos

## Contexto

El inventario de IT se va a conectar a la aplicación, así que el cliente fijó la API en el anexo de su petición (`.diverger/prestamo-de-equipos-de-it/intent.md`, sección «API fijada por el cliente»): rutas, métodos, campos, códigos de estado y mensajes de error exactos. Las convenciones del formato de la especificación dicen otra cosa: rutas bajo `/api/<contexto>/` y errores RFC 9457 en `application/problem+json`.

## Opciones

1. **Seguir la API del cliente.** Rutas exactas del anexo (`/api/equipos`, `/api/equipos/{id}/solicitud`, `/api/prestamos/vencidos`…) y errores como `{"error": "<mensaje>"}` en `application/json`, con los mensajes carácter por carácter.
2. **Seguir las convenciones y poner una capa de traducción.** Duplica rutas y deja dos API que mantener.

## Decisión

La opción 1. Las convenciones solo rigen lo que el cliente no fija: la operación auxiliar `GET /api/cuentas/yo` del contexto `cuentas`, que el anexo no lista, usa el prefijo del contexto pero el mismo formato de error que el resto, para que la aplicación tenga uno solo.

## Consecuencias

- Ningún contrato usa `application/problem+json`.
- Cambiar una ruta, un campo o un mensaje del anexo rompe el inventario: es un cambio incompatible, con su propia tarea, en serie y con un ADR que sustituya a este.
