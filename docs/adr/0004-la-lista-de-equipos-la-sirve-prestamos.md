# 0004. La lista de equipos con su estado la sirve el contexto prestamos

- **Estado:** Propuesto
- **Fecha:** 10/11/2026
- **Contexto delimitado:** equipos, prestamos

## Contexto

`GET /api/equipos` devuelve cada equipo con su nombre (dato del contexto equipos) y su estado, persona y fecha de devolución (datos del contexto prestamos). El contexto prestamos ya depende de equipos para saber si un equipo existe; si equipos también consultara a prestamos, habría un ciclo de dependencias, y un contexto no escribe en las colecciones de otro.

## Opciones

1. **La operación es del contexto prestamos.** prestamos lee los equipos a través del `index.ts` de equipos y les añade el estado de `prestamos_activos`.
2. **El estado se guarda en el equipo.** prestamos actualizaría el documento del equipo al reservar, prestar y devolver: una escritura que cruza contextos, prohibida por la constitución.
3. **La operación es del contexto equipos y consulta a prestamos.** Crea el ciclo equipos ↔ prestamos.

## Decisión

Opción 1: no hay ciclo y cada contexto escribe solo en sus colecciones. La ruta sigue siendo la que fijó el cliente.

## Consecuencias

- equipos expone en su `index.ts` la lectura de un equipo por id y la lista de equipos.
- El contrato de equipos solo tiene el alta; el de prestamos tiene la lista y las operaciones de préstamo.
