# 0001. Los contratos siguen la API fijada por el cliente

- **Estado:** Propuesto
- **Fecha:** 25/11/2026
- **Contexto delimitado:** equipos, prestamos

## Contexto

El inventario de IT se conecta a la aplicación y el cliente ha fijado la API exacta en el anexo de su petición: rutas bajo `/api/equipos` y `/api/prestamos`, errores como `{"error": "<mensaje>"}` con mensajes literales, y 401 y 403 con textos concretos. Las convenciones de la especificación piden rutas bajo `/api/<contexto>/` y errores RFC 9457.

## Opciones

1. **Copiar la API del cliente tal cual.** Rutas, campos, códigos y mensajes exactos, con errores en `application/json` con la propiedad `error`.
2. **Seguir las convenciones** (`/api/<contexto>/…` y `application/problem+json`) y poner delante un adaptador para el inventario.

## Decisión

Opción 1: el inventario dejaría de funcionar con cualquier diferencia, y un adaptador duplicaría la API sin aportar nada. Las convenciones siguen valiendo para lo que el cliente no fija (nombres de `operationId`, esquemas que no describe).

## Consecuencias

- Las rutas no llevan el prefijo del contexto: `GET /api/equipos` está en el contexto `prestamos`, porque el estado de cada equipo es suyo.
- Cambiar una ruta, un campo o un mensaje rompe el inventario: es un cambio de contrato incompatible, con su tarea y su ADR, y se acuerda antes con IT.
