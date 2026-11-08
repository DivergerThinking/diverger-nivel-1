# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SEG-01
Característica: Ver los préstamos vencidos
  Como técnico de IT, quiero ver los préstamos cuya fecha de devolución ya ha pasado, para reclamar los equipos cada semana sin preguntar a nadie.

  @HU-SEG-01-1 @positivo
  Escenario: HU-SEG-01 criterio 1 (positivo)
    Dado hoy es 2026-11-09 en Madrid, «Portátil 07» prestado hasta el 2026-11-05, «Monitor 02» prestado hasta el 2026-11-01 y «Proyector 01» prestado hasta el 2026-11-09
    Cuando un técnico de IT consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con «Monitor 02» y después «Portátil 07», cada uno con id, nombre, persona y devolución, y sin «Proyector 01»

  @HU-SEG-01-2 @negativo
  Escenario: HU-SEG-01 criterio 2 (negativo)
    Dado hoy es 2026-11-09 en Madrid y el equipo «Portátil 07» reservado hasta el 2026-11-05
    Cuando un técnico de IT consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con una lista vacía
