# 0001. Los contratos siguen la API fijada por el cliente

- **Estado:** Propuesto
- **Fecha:** 15/11/2026
- **Contexto delimitado:** equipos y prestamos

## Contexto

El inventario de IT se va a conectar a la aplicación, y el cliente ha fijado la API palabra por palabra en el anexo de su petición (`.diverger/prestamo-de-equipos-de-oficina/intent.md`, «API fijada por el cliente»). Las convenciones del formato de `spec/` ponen las rutas bajo `/api/<id>/` y los errores en RFC 9457 (`application/problem+json`). Si el contrato no coincide con el anexo, el inventario deja de funcionar, que es uno de los riesgos que el cliente señala.

## Opciones

1. **Copiar la API del cliente tal cual.** Rutas, métodos, campos, códigos y errores `{"error": "<mensaje>"}` en `application/json`, con los mensajes carácter por carácter. Las convenciones solo se aplican a lo que el cliente no fija.
2. **Seguir las convenciones y poner una capa de traducción.** Rutas `/api/<id>/` y errores RFC 9457, con un adaptador que exponga la forma del cliente.

## Decisión

Opción 1. El cliente pide que la API sea «exactamente esta», y una capa de traducción añade código y otro punto donde el contrato puede desviarse sin que nadie lo vea. Los contextos se eligen como siempre (`equipos` y `prestamos`) y cada operación va al contexto dueño de sus datos; solo las rutas, los campos, los códigos y los errores son del cliente. Los `operationId` siguen la forma `<id>.<verbo><Recurso>`.

## Consecuencias

- Las rutas no llevan el prefijo `/api/<id>/`: `GET /api/equipos` está en el contrato de `prestamos` y `POST /api/equipos` en el de `equipos`.
- Los errores son `{"error": "<mensaje>"}` en `application/json`, igual que el 401 que ya da el servidor de la plantilla.
- Cambiar una ruta, un campo o un mensaje rompe el inventario: es un cambio incompatible, con su tarea propia, en serie y con ADR.
