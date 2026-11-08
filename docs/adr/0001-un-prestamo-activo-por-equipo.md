# 0001. Un equipo tiene como mucho un préstamo activo

- **Estado:** Propuesto
- **Fecha:** 08/11/2026
- **Contexto delimitado:** prestamos

## Contexto

Un equipo no puede estar reservado o prestado dos veces a la vez. Si llegan a la vez dos peticiones para el mismo equipo disponible, sean solicitudes o préstamos en el mostrador, una tiene que salir bien y la otra recibir 409 «El equipo no está disponible». Comprobar el estado y escribir después no basta: las dos peticiones leerían «disponible» antes de que ninguna escriba.

## Opciones

1. **Transacción sobre el préstamo activo del equipo.** Un documento por equipo en `prestamos_activos`, cuyo id es el id del equipo. La solicitud y el préstamo en el mostrador leen ese documento y, si no existe, lo crean junto con su registro en `prestamos_prestamos`, todo dentro de `Almacen.transaccion` del puerto `lib/datos.ts`. La entrega lo actualiza y la devolución lo borra en otra transacción.
2. **Crear el documento solo si no existe.** Una escritura condicional («create») del documento del préstamo activo, sin transacción, que falla si ya existe.

## Decisión

La opción 1. El puerto de persistencia del golden path solo ofrece `transaccion` para escrituras atómicas: no tiene una escritura condicional, y la constitución prohíbe usar el cliente de la base directamente. La transacción se repite si otra cambia el documento leído, así que de dos peticiones simultáneas solo una encuentra el equipo libre.

## Consecuencias

- El estado de un equipo (disponible, reservado o prestado) se deduce del documento de `prestamos_activos`: sin documento, disponible.
- La entrega y la devolución también leen y escriben ese documento en una transacción, para no pisar una solicitud simultánea.
- Los tests de concurrencia lanzan dos peticiones a la vez contra el almacén en memoria y contra Firestore, y comprueban que solo una recibe 201.
