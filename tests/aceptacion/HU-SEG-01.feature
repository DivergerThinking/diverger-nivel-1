# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it-2/backlog.json. No se edita a mano: se regenera.

@HU-SEG-01
Característica: Ver los préstamos vencidos
  Como persona de IT, quiero ver los equipos prestados cuya fecha de devolución ya ha pasado, para reclamarlos cada semana sin esperar a que alguien eche en falta un equipo.

  @HU-SEG-01-1 @positivo
  Escenario: HU-SEG-01 criterio 1 (positivo)
    Dado el día 2026-11-10 en Madrid y los equipos prestados «Portátil 07» hasta el 2026-11-08, «Monitor 03» hasta el 2026-11-05, «Proyector 01» hasta el 2026-11-10 y «Portátil 08» hasta el 2026-11-20
    Cuando la persona de IT consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con «Monitor 03» y después «Portátil 07», cada uno con id, nombre, persona y devolucion, y sin «Proyector 01» ni «Portátil 08»

  @HU-SEG-01-2 @negativo
  Escenario: HU-SEG-01 criterio 2 (negativo)
    Dado los mismos préstamos y la empleada «ana.perez@empresa.com», que no está en CORREOS_IT
    Cuando consulta GET /api/prestamos/vencidos
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."}
