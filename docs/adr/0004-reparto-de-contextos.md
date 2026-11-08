# 0004. Reparto en los contextos cuentas, equipos y prestamos

- **Estado:** Propuesto
- **Fecha:** 08/11/2026
- **Contexto delimitado:** cuentas, equipos y prestamos

## Contexto

La aplicación da de alta equipos, registra lo que les pasa (reservas, préstamos y devoluciones) y distingue las cuentas de IT del resto. La lista de equipos de la API fijada (`GET /api/equipos`) devuelve, para cada equipo, su nombre (dato del alta) y su estado, persona y fecha de devolución (datos de los préstamos). Las dependencias entre contextos no pueden tener ciclos.

## Opciones

1. **Tres contextos.**
   - `cuentas` decide quién es de IT a partir de la variable `CORREOS_IT`.
   - `equipos` da de alta los equipos.
   - `prestamos` registra las reservas, los préstamos y las devoluciones, y sirve la lista de equipos con su estado. Para esa lista pide los equipos a `equipos` por su `index.ts`.
2. **Dos contextos, y la lista de equipos en `equipos`.** `equipos` tendría que pedir el estado a `prestamos`, y `prestamos` ya depende de `equipos` para saber si un equipo existe: habría un ciclo.
3. **Un solo contexto.** Mezcla los datos del inventario con su historia, que la constitución y el formato de la especificación separan.

## Decisión

La opción 1.
- La lista va con el contexto que tiene el estado, sin ciclos: `prestamos` depende de `equipos` y de `cuentas`, y `equipos` depende de `cuentas`.
- `cuentas` no guarda datos: lee `CORREOS_IT` de la configuración del despliegue.
- `cuentas` ofrece una ruta propia, `/api/cuentas/yo`, para que la interfaz sepa si muestra las acciones de IT.

## Consecuencias

- Ninguna transacción cruza contextos.
- Comprobar si una cuenta es de IT se hace siempre con `cuentas`, también desde `equipos` y `prestamos`, y la comparación de correos ignora las mayúsculas.
