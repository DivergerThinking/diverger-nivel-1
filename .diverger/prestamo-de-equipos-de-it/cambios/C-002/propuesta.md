# C-002: Nota en la solicitud pendiente

## 1. Petición

> En la iniciativa prestamo-de-equipos-de-it, añadir una historia nueva: cualquier empleado puede añadir una nota corta a su propia solicitud de préstamo mientras está pendiente, que IT ve al entregar el equipo. No cambia ninguna historia existente.

## 2. Qué cambia y por qué

Un empleado que pide un equipo a veces necesita decir algo a IT que no cabe en la fecha de devolución (a qué hora lo recoge, que lo necesita para una reunión concreta). Hoy no hay forma de decirlo sin escribir a IT por correo.

Se añade una historia nueva, **HU-SOL-03**, en la épica EP-03 (solicitudes de equipos). No se modifica ni se elimina ninguna historia existente.

Cambios de diseño:

- **Dónde vive la nota: contexto `prestamos`.** La nota es un campo del préstamo reservado, así que se guarda en el mismo agregado que la solicitud. Comprobar que la solicitud sigue pendiente y escribir la nota en la misma transacción sobre `prestamos_activos` (ADR 0001) evita que una nota llegue a un préstamo ya entregado sin que nadie lo sepa. No hay contextos nuevos.
- **Nueva ruta `PUT /api/equipos/{id}/solicitud/nota`** (cualquier empleado, solo para su propia solicitud), con `{"nota": "..."}`. La respuesta es el equipo, como en la solicitud; la nota no vuelve en ella.
- **Nueva ruta `GET /api/equipos/{id}/solicitud`** (solo IT), que devuelve la persona, la devolución y la nota de la solicitud pendiente. Es lo que IT ve al entregar: la pantalla de entrega la muestra antes de confirmar.
- **La nota no sale en `GET /api/equipos`**: el listado lo ve todo el mundo y la petición no pide que se vea allí.
- **Campo `nota` nuevo** en el préstamo (`prestamos_prestamos`). La entrega y la devolución no lo borran, así que queda en el préstamo.

## 3. Impacto

### Historias

| Id | Título | Qué cambia |
|---|---|---|
| HU-SOL-03 | Añadir una nota a mi solicitud pendiente | Nueva (borrador, prioridad `should`, contexto `prestamos`) |

Historias modificadas: ninguna. Historias eliminadas: ninguna. Ninguna historia publicada cambia, así que no hay `.feature` que regenerar.

### Contextos

| Contexto | Cambio |
|---|---|
| `prestamos` | Se modifica `contexto.md` (modelo, invariantes, persistencia). Nuevo contrato. |
| Contextos nuevos | Ninguno |

### Contratos

| Contexto | Versión base | Versión nueva | Compatible |
|---|---|---|---|
| `prestamos` | 2.0.0 | **2.1.0** | **Sí** |

Es compatible porque solo añade dos rutas, un esquema de entrada y de salida, y un campo opcional en la solicitud pendiente. Ningún cliente actual deja de funcionar. La versión base es la que hay hoy en `spec/contextos/prestamos/api.openapi.json` (C-001 ya aplicado).

## 4. Supuestos

- [SUPUESTO] Prioridad `should`: la petición no la indica.
- [SUPUESTO] Una nota nueva sustituye a la anterior; no hay historial de notas.
- [SUPUESTO] La nota no tiene formato: texto libre de hasta 200 caracteres («corta» en la petición). Mensajes: «Falta la nota» (400) si está vacía o falta, y «La nota es demasiado larga» (400) si pasa de 200.
- [SUPUESTO] Solo se puede añadir una nota mientras la solicitud está `reservado`. Una vez IT entrega el equipo, la nota ya no se puede cambiar: 409 con «El equipo no está reservado».
- [SUPUESTO] Quien no ha pedido el equipo recibe 403 con «Solo quien pidió el equipo puede añadir una nota». La petición no fija el mensaje.
- [SUPUESTO] La ruta de la nota y la de consulta para IT amplían la API fijada por el cliente, igual que la baja de C-001. El ADR que lo registra queda pendiente, como en C-001.
- [SUPUESTO] IT ve la nota en la pantalla de entrega, no en el listado de equipos. La petición dice «al entregar el equipo», así que se toma como el momento y el lugar.
- [SUPUESTO] La nota se conserva en el préstamo después de la entrega y la devolución, pero no aparece en el historial. La petición no dice nada del historial.
- [SUPUESTO] Ninguna nota viaja en `GET /api/equipos` ni en la respuesta de la entrega: solo la consulta de IT.

## 5. Qué revisar primero

1. **Dónde ve IT la nota.** Si IT prefiere verla en el listado de equipos, habría que añadir el campo a `GET /api/equipos` (HU-EQU-02), lo que cambia una historia existente y el contrato de la lista. La propuesta no lo hace porque la petición no lo pide.
2. **La API fijada por el cliente.** Igual que en C-001, esto añade rutas a la API que fija el cliente (RQ.014). Hay que confirmar que la acepta antes de aprobar el contrato 2.1.0.
3. **El ADR.** Es un cambio compatible, así que la constitución no pide un ADR por el contrato, pero la regla de ADR 0003 sobre la API fijada sí aplica a las dos rutas nuevas, como a la baja de C-001.
4. **La concurrencia.** La nota y la entrega compiten por el mismo equipo: la nota gana si llega antes, y la entrega sale bien en los dos casos. Conviene probarlo con peticiones simultáneas, como HU-SOL-02.
5. **Límite de 200 caracteres.** Es una cifra que el usuario no ha dado. Si el cliente quiere otra, se cambia en el contrato y en el criterio de HU-SOL-03 antes de aprobar.
