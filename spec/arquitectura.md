# Arquitectura: préstamo de equipos de IT

## Resumen

La aplicación sustituye la hoja de cálculo de préstamos de IT: los empleados ven los equipos y piden uno libre, e IT los da de alta, entrega los reservados, presta en el mostrador, apunta las devoluciones y revisa los vencidos y el historial. El inventario de IT se conecta a la misma API.

Se divide en dos contextos:

- **equipos**: el catálogo de equipos (alta con nombre único) y la regla de qué cuentas son de IT.
- **prestamos**: lo que les pasa a los equipos con el tiempo (reservas, préstamos, devoluciones), el estado de cada equipo, los vencidos y el historial.

## Mapa de contextos

```mermaid
flowchart LR
  prestamos[Préstamos] -->|existencia y nombre del equipo, cuentas de IT| equipos[Equipos]
```

## Despliegue

El golden path de la constitución: un servicio de Cloud Run con Node.js y TypeScript, un módulo por contexto (`src/equipos` y `src/prestamos`), frontend en React, inicio de sesión con Google y Firestore a través del puerto de persistencia `lib/datos.ts`. La lista `CORREOS_IT` llega como variable de entorno desde `infra/staging.tfvars`.

## Piezas transversales

- **Inicio de sesión:** el servidor del golden path (`app/server.ts`) verifica en cada ruta de `/api` el token de identidad de Google (correo verificado y emitido para el cliente OAuth de la aplicación) y responde 401 «Inicia sesión con Google.» sin él. La persona de cada operación es el correo del token.
- **Cuentas de IT:** las decide el contexto equipos con `CORREOS_IT` y las usan los dos contextos.
- **Persistencia:** cada contexto escribe solo en sus colecciones (`equipos_*`, `prestamos_*`) a través de `lib/datos.ts`; no hay transacciones entre contextos.
- **Contratos primero:** el contrato de cada contexto se escribe y se aprueba antes que el código, y los tipos se generan de él.
- Un cambio de contrato es una tarea propia y en serie. La constitución lo dice también así: un cambio incompatible es una tarea propia, en serie y con ADR.

## Decisiones

- [ADR 0001](../docs/adr/0001-un-prestamo-activo-por-equipo.md): un equipo tiene como mucho un préstamo activo, garantizado con una transacción sobre un documento por equipo. Alternativa: crear el documento solo si no existe.
- [ADR 0002](../docs/adr/0002-nombres-de-equipo-unicos.md): nombres de equipo únicos con un documento por nombre normalizado en una transacción. Alternativa: recorrer todos los equipos.
- [ADR 0003](../docs/adr/0003-api-fijada-por-el-cliente.md): los contratos siguen la API fijada por el cliente en `intent.md` en lugar de las convenciones del formato: sin el prefijo `/api/<contexto>/` en las rutas y con errores `{"error": "<mensaje>"}` en `application/json` en lugar de RFC 9457. Alternativa: convenciones y una capa de traducción.
- [ADR 0004](../docs/adr/0004-cuentas-de-it-en-el-contexto-equipos.md): el contexto equipos decide qué cuentas son de IT y lo publica en su `index.ts`. Alternativa: repetir la comprobación en cada contexto.

No hay decisiones pendientes.

## Supuestos

- [SUPUESTO] `GET /api/equipos` es del contexto prestamos, porque necesita el estado de cada equipo; `POST /api/equipos` es del contexto equipos. Las dos rutas comparten camino por decisión del cliente.
- [SUPUESTO] Orden de las comprobaciones: primero la sesión (401), después el permiso de IT (403), después el cuerpo de la petición (400), después la existencia del equipo (404) y por último su estado (409).
- [SUPUESTO] Un nombre de equipo formado solo por espacios cuenta como vacío y responde 400 «Falta el nombre del equipo».
- [SUPUESTO] En el préstamo en el mostrador, «persona» se guarda tal como llega; solo se responde 400 si falta.
- [SUPUESTO] El id de un equipo lo genera la aplicación y es un texto opaco.
- [SUPUESTO] El historial se ordena por el momento en que se creó cada préstamo; los vencidos con la misma fecha de devolución se ordenan por nombre del equipo.
- [SUPUESTO] Una reserva que IT nunca entrega sigue reservada; no caduca sola.
- [SUPUESTO] Hay una interfaz web para empleados e IT además de la API, que usa los mismos contratos.
- Para revisar: la carpeta `spec/contextos/ejemplo/` es de la plantilla y no forma parte de esta especificación.
