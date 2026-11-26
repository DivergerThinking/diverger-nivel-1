# 0001. Los contratos siguen la API fijada por el cliente

- **Estado:** Propuesto
- **Fecha:** 26/11/2026
- **Contexto delimitado:** equipos, prestamos

## Contexto

El inventario de IT se conecta a la aplicación y el cliente ha fijado la API exactamente: rutas, métodos, campos, códigos y mensajes de error. El formato de la especificación propone por defecto rutas bajo `/api/<contexto>/` y errores RFC 9457 (`application/problem+json`), que romperían ese acuerdo.

## Opciones

1. **Copiar la API del cliente tal cual.** Rutas como `/api/equipos/{id}/solicitud` y `/api/prestamos/vencidos`, y errores `{"error": "<mensaje>"}` en `application/json`, con los mensajes carácter a carácter.
2. **Seguir las convenciones del formato** y ofrecer al inventario una capa de traducción aparte.

## Decisión

Opción 1. El cliente exige que la API sea exactamente la del anexo y que el inventario no deje de funcionar; una capa de traducción duplica el contrato y lo que no fija el cliente seguiría sin acuerdo. Los contextos se eligen como siempre y cada operación va al contexto dueño de sus datos; solo las rutas, los campos, los códigos y los errores son del cliente.

## Consecuencias

- Las rutas no llevan el prefijo `/api/<contexto>/`: `GET /api/equipos` está en el contrato de `prestamos`, porque necesita el estado de los préstamos.
- Los errores son `{"error": "<mensaje>"}` en `application/json`, no RFC 9457.
- Cambiar una ruta, un campo o un mensaje rompe el inventario: es un cambio incompatible, una tarea propia, en serie y con ADR.
