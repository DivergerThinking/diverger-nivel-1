# 0001. Los contratos siguen la API fijada por el cliente

- **Estado:** Propuesto
- **Fecha:** 14/11/2026
- **Contexto delimitado:** equipos, prestamos

## Contexto

El inventario de IT se va a conectar a la aplicación, y el cliente fijó la API exactamente en el anexo de su petición (sección «API fijada por el cliente» de `intent.md`): rutas, métodos, campos, códigos y mensajes de error. Las convenciones del formato de `spec/` ponen las rutas bajo `/api/<contexto>/` y los errores en `application/problem+json` (RFC 9457), y no coinciden con esa API.

## Opciones

1. **Copiar la API del cliente tal cual.** Rutas como `/api/equipos/{id}/solicitud` y `/api/prestamos/vencidos`, y errores como objeto JSON `{"error": "<mensaje>"}` en `application/json`, con los mensajes exactos.
2. **Seguir las convenciones del formato.** Rutas `/api/equipos/...` y `/api/prestamos/...` según el contexto dueño y errores RFC 9457, con una capa de traducción para el inventario.

## Decisión

Opción 1. El cliente pide que la API sea «exactamente esta» y teme que el inventario deje de funcionar si cambia; una capa de traducción duplicaría el contrato y sería un punto más donde romperlo. Los contextos se eligen como siempre y cada operación va al contexto dueño de sus datos; solo las rutas, los campos, los códigos y los errores son del cliente.

## Consecuencias

- Algunas rutas del contexto `prestamos` empiezan por `/api/equipos/` porque así las fijó el cliente.
- Ningún contrato usa `application/problem+json`: todos los errores son `{"error": "<mensaje>"}`.
- Cambiar una de esas rutas o mensajes rompe el inventario: es un cambio incompatible, con su tarea propia, en serie y con ADR.
