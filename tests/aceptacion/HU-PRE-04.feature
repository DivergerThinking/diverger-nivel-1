# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-04
Característica: Ver los préstamos vencidos
  Como técnico de IT, quiero ver los préstamos cuya fecha de devolución ya ha pasado, para reclamar los equipos cada semana sin esperar a que alguien los eche en falta.

  @HU-PRE-04-1 @positivo
  Escenario: HU-PRE-04 criterio 1 (positivo)
    Dado el día 2026-11-15 en Madrid, un técnico de IT con sesión, «Portátil 07» prestado hasta «2026-11-12», «Monitor 03» prestado hasta «2026-11-10» y «Proyector 01» prestado hasta «2026-11-15»
    Cuando pide `GET /api/prestamos/vencidos`
    Entonces recibe 200 con «Monitor 03» y después «Portátil 07», cada uno con `id`, `nombre`, `persona` y `devolucion`, y sin «Proyector 01»

  @HU-PRE-04-2 @negativo
  Escenario: HU-PRE-04 criterio 2 (negativo)
    Dado el día 2026-11-15 en Madrid, un técnico de IT con sesión y el equipo «Portátil 08» reservado, sin entregar, con devolución «2026-11-16»
    Cuando pide `GET /api/prestamos/vencidos`
    Entonces recibe 200 con una lista que no incluye «Portátil 08»

  @HU-PRE-04-3 @negativo
  Escenario: HU-PRE-04 criterio 3 (negativo)
    Dado un empleado con sesión de «ana.perez@empresa.com», que no está en `CORREOS_IT`
    Cuando pide `GET /api/prestamos/vencidos`
    Entonces recibe 403 con `{"error": "Solo IT puede hacer esto."}`
