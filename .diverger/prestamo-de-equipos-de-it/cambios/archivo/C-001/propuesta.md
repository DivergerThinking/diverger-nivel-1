# C-001: Dar de baja equipos averiados o retirados

## 1. Petición

> En la iniciativa prestamo-de-equipos-de-it, añadir una historia nueva: el personal de IT puede dar de baja un equipo averiado o retirado, indicando el motivo; un equipo dado de baja deja de aparecer como disponible y no se puede pedir ni prestar, y si tiene un préstamo activo no se puede dar de baja hasta que se devuelva. No cambia ninguna historia existente.

## 2. Qué cambia y por qué

IT necesita sacar del inventario un equipo que ya no sirve (averiado) o que se retira, sin que siga apareciendo como libre para pedirlo. Hoy la API no tiene forma de hacerlo: el alta es la única operación de inventario (la pregunta abierta 7 de la iniciativa).

Se añade una historia nueva, **HU-EQU-03**, en la épica EP-02. No se modifica ni se elimina ninguna historia existente.

Cambios de diseño:

- **Dónde vive la baja: contexto `prestamos`.** La baja tiene que comprobar el préstamo activo y compartir la garantía de concurrencia con las solicitudes y los préstamos (ADR 0001), y el estado de cada equipo ya lo calcula `prestamos`. Ponerla en `equipos` obligaría a que `equipos` consultara `prestamos`, un ciclo que el ADR 0004 evita. No hay contextos nuevos.
- **Nueva ruta `POST /api/equipos/{id}/baja`** (solo IT), con `{"motivo": "..."}`.
- **Nuevo estado `dado de baja`** en el listado de equipos, con el campo `motivo`.
- **Nueva colección `prestamos_bajas`**, un documento por equipo dado de baja.
- **Solicitud y préstamo en el mostrador** rechazan un equipo dado de baja con el mensaje que ya existe, «El equipo no está disponible».
- **Entrega y devolución** no cambian: un equipo dado de baja no tiene préstamo activo, así que ya reciben sus 409 actuales.

## 3. Impacto

### Historias

| Id | Título | Qué cambia |
|---|---|---|
| HU-EQU-03 | Dar de baja un equipo averiado o retirado | Nueva (borrador, prioridad `should`, contexto `prestamos`) |

Historias modificadas: ninguna. Historias eliminadas: ninguna. Ninguna historia publicada cambia, así que no hay `.feature` que regenerar.

Las historias existentes siguen siendo válidas tal como están. Sus criterios no se tocan, aunque su contrato gana el estado nuevo y el mensaje de error de HU-SOL-01, HU-PRE-02 y HU-EQU-02 aplica también a los equipos dados de baja.

### Contextos

| Contexto | Cambio |
|---|---|
| `prestamos` | Se modifica `contexto.md` (modelo, invariantes, persistencia). Nuevo contrato. |
| Contextos nuevos | Ninguno |

### Contratos

| Contexto | Versión base | Versión nueva | Compatible |
|---|---|---|---|
| `prestamos` | 1.0.0 | **2.0.0** | **No** |

Es incompatible porque el estado `estado` de un equipo gana un valor (`dado de baja`) que los clientes actuales no esperan. Según el formato, un cambio incompatible es una tarea propia, en serie y con ADR: ver «Qué revisar primero».

## 4. Supuestos

- [SUPUESTO] Prioridad `should`: la petición no la indica.
- [SUPUESTO] Dar de baja también se rechaza si el equipo está **reservado** (no solo prestado), porque una reserva es un préstamo activo en el modelo (ADR 0001). El texto de la petición dice «hasta que se devuelva», y una reserva no se puede devolver: IT tendría que entregarla antes.
- [SUPUESTO] El mensaje de la baja con préstamo activo es «El equipo tiene un préstamo activo» (409). La petición no fija mensajes.
- [SUPUESTO] El mensaje de la baja repetida es «El equipo ya está dado de baja» (409).
- [SUPUESTO] El mensaje de motivo vacío es «Falta el motivo de la baja» (400). El motivo es texto libre, no una lista cerrada («averiado» o «retirado»).
- [SUPUESTO] Un equipo dado de baja **sigue en el listado** de `GET /api/equipos`, con estado `dado de baja` y su motivo, para que IT lo vea. La petición solo dice que deja de aparecer como disponible.
- [SUPUESTO] Un equipo dado de baja no entra en los vencidos ni cambia el historial; su historial sigue consultable.
- [SUPUESTO] No hay reactivación: un equipo dado de baja no vuelve a estar disponible. La petición no lo menciona.
- [SUPUESTO] La baja solo la hace IT (403 para los demás), como el resto de operaciones de IT. La petición dice «personal de IT».
- [SUPUESTO] Contratos de los contextos: el id del equipo en la ruta sigue siendo el de `equipos`, sin cambios.

## 5. Qué revisar primero

1. **La API fijada por el cliente.** El anexo dice que la API es «exactamente» la suya (RQ.014), y esta propuesta añade una ruta y un estado. Hay que confirmar con el cliente que acepta la ampliación antes de aprobar el contrato 2.0.0. Si no la acepta, la alternativa es no exponer la baja por la API del inventario y dejarla en la interfaz de IT.
2. **La reserva bloquea la baja.** Si IT prefiere que una reserva no recogida no bloquee la baja, habría que cambiar la regla y el criterio de HU-EQU-03.
3. **El listado muestra el equipo dado de baja** (supuesto). Si el inventario del cliente solo espera tres estados, puede romperse; por eso el cambio es incompatible.
4. **Un ADR nuevo.** La constitución pide un ADR para un cambio incompatible de contrato, y el formato pide uno para la garantía de concurrencia de la baja y para la ampliación de la API fijada. No se escribe en esta propuesta; se escribe al aplicar el cambio o antes, en su propia tarea.
5. **Textos de la épica.** La descripción de EP-02 dice que deja fuera «dar de baja o editar equipos». Con este cambio deja de ser cierto para «dar de baja». Como el cambio no toca épicas, la descripción quedará desactualizada hasta que se corrija.
6. **Glosario.** Propongo el término «Baja» (equipo dado de baja), con la identificadora `Decommission`, en la tabla de `spec/glosario.md` al aplicar el cambio. El nombre del estado en la API es `dado de baja`.
7. **Pregunta abierta 7.** La pregunta «¿Se pueden dar de baja o editar equipos?» queda respondida en lo de dar de baja. Editar equipos sigue fuera.
