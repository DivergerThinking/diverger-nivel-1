# 0001. Un equipo tiene como mucho una reserva o un préstamo activo

- **Estado:** Propuesto
- **Fecha:** 10/11/2026
- **Contexto delimitado:** prestamos

## Contexto

Un equipo no puede estar reservado o prestado dos veces a la vez. Si llegan dos peticiones a la vez para el mismo equipo disponible (dos solicitudes, dos préstamos en el mostrador o una de cada), una sale bien y la otra recibe 409 «El equipo no está disponible». Comprobar el estado antes de escribir no basta: las dos peticiones pueden leer «disponible» antes de que ninguna escriba.

## Opciones

1. **Documento de préstamo activo por equipo, en una transacción.** La colección `prestamos_activos` tiene como mucho un documento por equipo, cuyo id es el id del equipo. Solicitar o prestar lee ese documento y, si no existe, lo crea junto con el préstamo, todo en la misma transacción del puerto de persistencia (`Almacen.transaccion` de `lib/datos.ts`). Si otra transacción lo crea antes, la transacción se repite, ve el documento y responde 409.
2. **Consulta de los préstamos abiertos del equipo, en una transacción.** Buscar en la colección de préstamos los del equipo en estado reservado o prestado dentro de la transacción y crear el préstamo si no hay ninguno. El puerto de persistencia no ofrece consultas dentro de una transacción, solo lecturas por id, así que esta opción obligaría a ampliar el puerto.

## Decisión

Opción 1. Se apoya en lo que el puerto de persistencia ya ofrece (lectura por id y escritura atómica) y la transacción conflictiva siempre lee el mismo documento, así que Firestore detecta el conflicto y la repite. Entregar y apuntar la devolución usan la misma transacción sobre ese documento.

## Consecuencias

- Cada cambio de estado de un equipo (solicitud, préstamo, entrega, devolución) se hace en una transacción que lee primero `prestamos_activos/<idEquipo>` y después escribe; nunca lee tras escribir.
- La devolución borra el documento activo y marca el préstamo como devuelto.
- Los tests de aceptación con peticiones simultáneas deben ver exactamente un 201 y un 409.
