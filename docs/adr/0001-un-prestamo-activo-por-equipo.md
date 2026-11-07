# 0001. Un equipo tiene como mucho un préstamo activo

- **Estado:** Propuesto
- **Fecha:** 07/11/2026
- **Contexto delimitado:** prestamos

## Contexto

Un equipo no puede estar reservado o prestado dos veces a la vez. Si llegan a la vez dos peticiones para el mismo equipo disponible, sean solicitudes o préstamos en el mostrador, una tiene que salir bien y la otra recibir 409 «El equipo no está disponible». Comprobar el estado y escribir después no basta: las dos peticiones leerían «disponible» antes de que ninguna escriba.

## Opciones

1. **Transacción sobre un documento de préstamo activo por equipo.** La colección `prestamos_activos` tiene como mucho un documento por equipo, con el id del equipo. Pedir, prestar, entregar y devolver leen ese documento y lo escriben dentro de una transacción del puerto de persistencia (`Almacen.transaccion`); si otra transacción lo cambia antes de terminar, la transacción se repite y entonces ve el equipo ocupado.
2. **Crear el documento solo si no existe.** El mismo documento por equipo, pero creado con una operación de «crear si no existe» de la base, sin transacción.

## Decisión

Opción 1. El puerto de persistencia del golden path (`lib/datos.ts`) ofrece transacciones y no una operación de «crear si no existe»; la constitución prohíbe usar el cliente de la base directamente. La transacción cubre además la entrega y la devolución, que cambian el estado de un documento que ya existe.

## Consecuencias

- Toda operación que cambia el estado de un equipo pasa por una transacción que lee primero `prestamos_activos/<id del equipo>` y escribe después ese documento y el registro del historial.
- Los tests de concurrencia lanzan peticiones simultáneas contra el almacén en memoria y contra Firestore, y comprueban que solo una sale bien.
- La opción 2 queda descartada mientras el puerto no ofrezca esa operación.
