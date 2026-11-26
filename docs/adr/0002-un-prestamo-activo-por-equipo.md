# 0002. Un equipo tiene como mucho una reserva o un préstamo activo

- **Estado:** Propuesto
- **Fecha:** 26/11/2026
- **Contexto delimitado:** prestamos

## Contexto

Un equipo no puede estar reservado o prestado dos veces a la vez. Si llegan dos solicitudes o dos préstamos en el mostrador a la vez para el mismo equipo disponible, una sale bien y la otra recibe 409 «El equipo no está disponible». Comprobar el estado antes de escribir no basta: las dos peticiones leerían «disponible».

## Opciones

1. **Documento del préstamo activo con el id del equipo, en una transacción de Firestore.** La colección `prestamosActivos` tiene como mucho un documento por equipo, cuyo id es el del equipo. Solicitar o prestar lee ese documento y lo crea en la misma transacción solo si no existe; la entrega y la devolución lo cambian o lo borran en una transacción y añaden el movimiento al historial.
2. **Campo de estado en el documento del equipo**, cambiado con una transacción. Obligaría a `prestamos` a escribir en la colección de `equipos`, y la constitución prohíbe que un contexto escriba en las colecciones de otro.

## Decisión

Opción 1. Firestore reintenta la transacción que pierde la carrera y en el reintento ve el documento creado, así que devuelve 409. Cada contexto escribe solo en sus colecciones.

## Consecuencias

- El estado de un equipo (`disponible`, `reservado`, `prestado`) se calcula a partir de `prestamosActivos`: sin documento, disponible.
- Los tests de aceptación incluyen dos peticiones simultáneas contra el emulador de Firestore.
