# 0002. Los contratos siguen la API fijada por el cliente

- **Estado:** Propuesto
- **Fecha:** 06/11/2026
- **Contexto delimitado:** equipos, prestamos

## Contexto

El inventario de IT se va a conectar a la aplicación, y la petición del cliente fija la API exactamente: rutas, métodos, campos, códigos de estado y mensajes de error (sección «API fijada por el cliente» de `intent.md`). Las convenciones de la especificación ponen las rutas bajo `/api/<contexto>/` y los errores en formato RFC 9457 (`application/problem+json`).

## Opciones

1. **Copiar la API del cliente tal cual.** Las rutas son las del anexo (`/api/equipos`, `/api/equipos/{id}/solicitud`, `/api/prestamos/vencidos`…) y los errores son `{"error": "<mensaje>"}` en `application/json`, con los mensajes exactos.
2. **Seguir las convenciones** y añadir una capa de traducción para el inventario. Duplica rutas y contratos, y el riesgo que preocupa al cliente es justo que el inventario deje de funcionar si la API cambia.

## Decisión

Opción 1. La API del cliente manda sobre las convenciones de prefijo de ruta y formato de error. Cada operación va al contexto que es dueño de sus datos; solo las rutas, campos, códigos y mensajes son los del cliente. Lo que el cliente no fija sigue las convenciones.

## Consecuencias

- Los contratos de `equipos` y `prestamos` comparten el prefijo `/api/equipos`, cada uno con sus propios métodos y rutas.
- Cualquier cambio en esas rutas, campos o mensajes es un cambio incompatible para el inventario: es una tarea propia, en serie y con su ADR.
- Los tests de aceptación comprueban los mensajes carácter a carácter.
