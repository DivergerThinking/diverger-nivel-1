# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-EQU-02
Característica: Ver los equipos y su estado
  Como empleado, quiero ver los equipos con su estado y, si están ocupados, quién los tiene y hasta cuándo, para saber qué está libre sin preguntar a IT.

  @HU-EQU-02-1 @positivo
  Escenario: HU-EQU-02 criterio 1 (positivo)
    Dado «Portátil 07» reservado a «luis.garcia@empresa.com» con devolución «2026-11-20» y «Monitor 03» disponible
    Cuando un empleado consulta los equipos con GET /api/equipos
    Entonces recibe 200 con «Portátil 07» en estado «reservado», persona «luis.garcia@empresa.com» y devolución «2026-11-20», y «Monitor 03» en estado «disponible» sin persona ni devolución

  @HU-EQU-02-2 @negativo
  Escenario: HU-EQU-02 criterio 2 (negativo)
    Dado «Portátil 07» devuelto tras un préstamo a «luis.garcia@empresa.com» con devolución «2026-11-01»
    Cuando un empleado consulta los equipos con GET /api/equipos
    Entonces recibe 200 con «Portátil 07» en estado «disponible», sin persona ni devolución, y no aparece «luis.garcia@empresa.com»
