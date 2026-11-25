# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SEG-01
Característica: Ver los préstamos vencidos
  Como técnico de IT, quiero ver los equipos prestados cuya fecha de devolución ya ha pasado, para revisar los vencidos cada semana sin preguntar a nadie.

  @HU-SEG-01-1 @positivo
  Escenario: HU-SEG-01 criterio 1 (positivo)
    Dado hoy es 2026-11-25 en Madrid, el «Portátil 07» prestado hasta 2026-11-20 y el «Monitor 03» prestado hasta 2026-11-10
    Cuando un técnico de IT consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con «Monitor 03» primero y «Portátil 07» después, cada uno con id, nombre, persona y devolucion

  @HU-SEG-01-2 @negativo
  Escenario: HU-SEG-01 criterio 2 (negativo)
    Dado hoy es 2026-11-25 en Madrid, el «Proyector 02» prestado hasta 2026-11-25 y el «Portátil 08» reservado hasta 2026-11-20
    Cuando un técnico de IT consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con una lista vacía
