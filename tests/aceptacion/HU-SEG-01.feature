# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SEG-01
Característica: Ver los préstamos vencidos
  Como técnico de IT, quiero ver los equipos prestados cuya fecha de devolución es anterior a hoy, para reclamar los vencidos cada semana sin tener que preguntar a nadie.

  @HU-SEG-01-1 @positivo
  Escenario: HU-SEG-01 criterio 1 (positivo)
    Dado el 11 de noviembre de 2026 en Madrid, «Portátil 07» prestado con devolución «2026-11-05», «Monitor 03» prestado con devolución «2026-11-01» y «Proyector 02» prestado con devolución «2026-11-11»
    Cuando un técnico de IT pide GET /api/prestamos/vencidos
    Entonces recibe 200 con «Monitor 03» y después «Portátil 07», cada uno con id, nombre, persona y devolución, y sin «Proyector 02»

  @HU-SEG-01-2 @negativo
  Escenario: HU-SEG-01 criterio 2 (negativo)
    Dado el 11 de noviembre de 2026 en Madrid y «Portátil 07» reservado, sin entregar, con devolución «2026-11-05»
    Cuando un técnico de IT pide GET /api/prestamos/vencidos
    Entonces recibe 200 con una lista sin «Portátil 07», porque solo cuentan los equipos prestados
