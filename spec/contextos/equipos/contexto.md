# Equipos

## Propósito

Lleva el catálogo de los equipos que se prestan: portátiles, monitores y proyectores. IT los da de alta por su nombre, y el catálogo garantiza que no hay dos con el mismo nombre.

## Modelo

- **Equipo** (`Equipment`): agregado con `id` (lo genera la aplicación) y `nombre`.
- **Nombre normalizado** (`normalizedName`): valor que se obtiene del nombre recortando los espacios del principio y del final y pasándolo a minúsculas.

## Invariantes

- Solo una cuenta de IT da de alta equipos; cualquier otra recibe 403 «Solo IT puede hacer esto.».
- El alta sin nombre, o con el nombre vacío, responde 400 «Falta el nombre del equipo» y no crea nada.
- Dos equipos no tienen el mismo nombre normalizado: el repetido responde 409 «Ya hay un equipo con ese nombre», también si las dos altas llegan a la vez. (concurrencia) [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md)
- Un equipo recién dado de alta responde con `estado` `disponible`.

## Persistencia

- `equipos`: un documento por equipo, con id generado, `nombre` y `nombreNormalizado`.
- `equipos_nombres`: un documento por nombre normalizado, cuyo id es ese nombre y que guarda el id del equipo.
- El alta escribe las dos colecciones en una transacción del puerto de persistencia (`lib/datos.ts`).

## Dependencias

- `accesos`: para exigir la sesión y comprobar que la cuenta es de IT.

## Decisiones

- [ADR 0001](../../../docs/adr/0001-api-fijada-por-el-cliente.md): el alta sigue la ruta y el formato de error de la API fijada por el cliente.
- [ADR 0003](../../../docs/adr/0003-nombre-de-equipo-unico.md): nombre único con un documento por nombre normalizado.
- [ADR 0004](../../../docs/adr/0004-estado-del-equipo-en-prestamos.md): el estado del equipo no vive aquí, sino en `prestamos`.
