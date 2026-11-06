# 0001. Un equipo tiene como mucho una reserva o un préstamo activo

- **Estado:** Propuesto
- **Fecha:** 06/11/2026
- **Contexto delimitado:** prestamos

## Contexto

Un equipo no puede estar reservado o prestado dos veces a la vez. Si llegan a la vez dos peticiones sobre el mismo equipo disponible, sean solicitudes o préstamos en el mostrador, una tiene que salir bien y la otra recibir 409 «El equipo no está disponible». Comprobar el estado antes de escribir no basta: las dos peticiones pueden leer «disponible» antes de que ninguna escriba.

## Opciones

1. **Transacción del almacén.** El estado de cada equipo es un documento de `prestamos_estados` cuyo id es el del equipo. La solicitud, el préstamo en el mostrador, la entrega y la devolución leen ese documento y escriben el nuevo estado y la entrada del historial dentro de `almacen.transaccion` (`lib/datos.ts`). Si otra transacción cambia el documento leído antes de terminar, Firestore repite el trabajo, que entonces ve el equipo ocupado y responde 409.
2. **Documento del préstamo activo creado solo si no existe.** Un documento por equipo, con el id del equipo, que se crea con «crear si no existe» al reservar o prestar y se borra al devolver. El puerto de persistencia no ofrece hoy esa operación, y la entrega y la devolución seguirían necesitando leer y cambiar el estado.

## Decisión

Opción 1. El puerto de persistencia del golden path ya ofrece transacciones con lectura y escritura atómicas y su propio comentario cita este caso. Cubre las cuatro operaciones que cambian el estado con el mismo mecanismo y no obliga a ampliar `lib/datos.ts`.

## Consecuencias

- Toda operación que cambia el estado de un equipo lee y escribe su documento de `prestamos_estados` dentro de una transacción; nunca fuera de ella.
- La entrada del historial se escribe en la misma transacción que el estado, así que nunca quedan dos préstamos activos en el historial.
- Los tests de aceptación lanzan peticiones en paralelo contra el almacén en memoria, que serializa las transacciones, y la prueba real se hace contra Firestore.
