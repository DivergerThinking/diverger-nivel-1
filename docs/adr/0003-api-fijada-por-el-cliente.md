# 0003. La API sigue la fijada por el cliente para el inventario de IT

- **Estado:** Propuesto
- **Fecha:** 08/11/2026
- **Contexto delimitado:** equipos, prestamos y cuentas

## Contexto

El inventario de IT se va a conectar a la aplicación, y la petición del cliente dice que la API tiene que ser exactamente la de su anexo (`.diverger/prestamo-de-equipos-de-it/intent.md`, «API fijada por el cliente»). Las convenciones del formato de la especificación ponen las rutas bajo `/api/<contexto>/` y los errores en RFC 9457 (`application/problem+json`).

## Opciones

1. **Copiar la API del cliente tal cual.** Rutas `/api/equipos`, `/api/equipos/{id}/…` y `/api/prestamos/vencidos`; errores como `{"error": "<mensaje>"}` en `application/json`, con los mensajes del anexo carácter a carácter.
2. **Seguir las convenciones y añadir una capa de traducción para el inventario.** Dos API que mantener, y el inventario dejaría de funcionar en cuanto se separen.

## Decisión

La opción 1. Las operaciones del anexo se reparten entre los contextos `equipos` y `prestamos` según los datos que escriben, pero sus rutas, campos, códigos y mensajes son los del cliente. Las rutas que el cliente no fija (las de `cuentas`) siguen la convención `/api/<contexto>/`, y todos los errores de la aplicación usan el mismo cuerpo `{"error": "<mensaje>"}` que el cliente y que la plantilla del golden path para el 401.

## Consecuencias

- Las rutas de los contratos de `equipos` y `prestamos` no llevan el prefijo de su contexto: `prestamos` sirve rutas bajo `/api/equipos/`.
- Un cambio en esas rutas o en sus mensajes rompe el inventario: es un cambio incompatible del contrato, con su ADR y su tarea propia.
- Las pruebas de aceptación comparan los mensajes de error carácter a carácter.
