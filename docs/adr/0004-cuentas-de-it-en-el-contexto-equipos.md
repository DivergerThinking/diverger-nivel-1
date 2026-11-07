# 0004. El contexto equipos decide qué cuentas son de IT

- **Estado:** Propuesto
- **Fecha:** 07/11/2026
- **Contexto delimitado:** equipos

## Contexto

Las operaciones «Solo IT» responden 403 «Solo IT puede hacer esto.» a las cuentas que no están en la variable de entorno `CORREOS_IT` (correos separados por comas, comparados sin distinguir mayúsculas). Las usan los dos contextos. Las tareas solo escriben en `src/`, `web/` y `app/contextos.ts`, así que la comprobación no puede ir en `lib/`.

## Opciones

1. **En el contexto equipos, publicada en su `index.ts`.** `equipos` lee `CORREOS_IT` y ofrece una función que dice si un correo es de IT; `prestamos`, que ya depende de `equipos`, la usa.
2. **Repetida en cada contexto.** Cada contexto lee `CORREOS_IT` y compara por su cuenta.

## Decisión

Opción 1. Una sola regla en un solo sitio, sin crear dependencias nuevas: `prestamos` ya consume `equipos`.

## Consecuencias

- La lista se lee de la configuración del despliegue (`infra/staging.tfvars`), nunca del código.
- Los tests de los dos contextos comprueban el 403 con una cuenta fuera de la lista y el acceso con la misma cuenta en otras mayúsculas.
