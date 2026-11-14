# 0002. Un equipo tiene como mucho una reserva o un préstamo activo

- **Estado:** Propuesto
- **Fecha:** 14/11/2026
- **Contexto delimitado:** prestamos

## Contexto

Un equipo no puede estar reservado o prestado dos veces a la vez. Si llegan a la vez dos solicitudes, o una solicitud y un préstamo en el mostrador, para el mismo equipo disponible, una sale bien y la otra recibe 409 «El equipo no está disponible». Comprobar el estado y escribir después no basta: las dos peticiones leerían «disponible» antes de que ninguna escribiera.

## Opciones

1. **Transacción del puerto de persistencia.** El préstamo activo de cada equipo es un documento de `prestamos_activos` cuyo id es el del equipo. La solicitud y el préstamo en el mostrador leen ese documento dentro de `almacen.transaccion`; si existe, responden 409, y si no, lo crean junto con el registro del préstamo en `prestamos_prestamos`. La entrega y la devolución cambian o borran el mismo documento en otra transacción.
2. **Documento que solo se crea si no existe.** Crear `prestamos_activos/<id del equipo>` con una escritura que falla si ya existe, sin transacción.

## Decisión

Opción 1. El puerto `lib/datos.ts` ofrece transacciones que se repiten si otra cambia lo leído, pero no una escritura «solo si no existe». La transacción, además, escribe a la vez el préstamo activo y su registro en el historial, y sirve igual para la entrega y la devolución.

## Consecuencias

- Dentro de cada transacción se hacen primero todas las lecturas y después las escrituras, como exige Firestore.
- Los tests de aceptación lanzan peticiones simultáneas y comprueban que solo una sale bien.
- La opción 2 queda descartada; no hay ninguna otra escritura de `prestamos_activos` fuera de transacción.
