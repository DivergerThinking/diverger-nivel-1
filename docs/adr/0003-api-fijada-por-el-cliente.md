# 0003. La API la fija el cliente

- **Estado:** Propuesto
- **Fecha:** 08/11/2026
- **Contexto delimitado:** cuentas, equipos y prestamos

## Contexto

El inventario de IT se conecta a la aplicación, y la petición del cliente dice que la API tiene que ser exactamente la de su anexo: rutas, métodos, campos, códigos y mensajes de error. El formato de `spec/` tiene sus propias convenciones: rutas bajo `/api/<id-del-contexto>/` y errores RFC 9457 en `application/problem+json`.

## Opciones

1. **Copiar la API del cliente tal cual** en los contratos, por encima de las convenciones: las rutas del anexo (`/api/equipos`, `/api/equipos/{id}/solicitud`, `/api/prestamos/vencidos`…) y los errores como `{"error": "<mensaje>"}` en `application/json`, con sus mensajes carácter a carácter.
2. **Seguir las convenciones** y poner delante del inventario una capa que traduzca a la API del cliente.

## Decisión

La opción 1. Una capa de traducción duplica cada operación y es justo el riesgo que más preocupa al cliente: que el inventario deje de funcionar si la API cambia. Con la opción 1 el contrato es la API del cliente y cualquier cambio incompatible se ve en la revisión del contrato.

## Consecuencias

- Las rutas no llevan el prefijo del contexto: cada operación va al contexto que es dueño de sus datos, aunque su ruta empiece por otro nombre (`GET /api/equipos` va en `prestamos`, ver el ADR 0004).
- Los errores no siguen RFC 9457.
- Lo que el anexo no fija (como la ruta de la sesión de `cuentas`) sigue las convenciones y es un supuesto de `spec/arquitectura.md`.
- Cambiar una ruta, un campo o un mensaje del anexo es un cambio incompatible: tarea propia, en serie y con ADR.
