# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-05
Característica: Ver los préstamos vencidos
  Como técnico de IT, quiero ver los préstamos cuya fecha de devolución ya ha pasado, para reclamar los equipos cada semana sin preguntar a nadie.

  @HU-PRE-05-1 @positivo
  Escenario: HU-PRE-05 criterio 1 (positivo)
    Dado hoy es 2026-12-03 en Madrid, el «Monitor 03» prestado hasta el 2026-12-01 y el «Portátil 07» prestado hasta el 2026-11-28
    Cuando un técnico de IT consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con primero el «Portátil 07» y después el «Monitor 03», cada uno con id, nombre, persona y devolución

  @HU-PRE-05-2 @negativo
  Escenario: HU-PRE-05 criterio 2 (negativo)
    Dado hoy es 2026-12-03 en Madrid y el «Proyector 01» prestado hasta el 2026-12-03
    Cuando un técnico de IT consulta GET /api/prestamos/vencidos
    Entonces recibe 200 sin el «Proyector 01», porque su devolución no es anterior a hoy
