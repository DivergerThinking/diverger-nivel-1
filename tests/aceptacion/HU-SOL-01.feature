# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-01
Característica: Ver los equipos y su estado
  Como empleado, quiero ver los equipos de la oficina y su estado, para saber qué está libre sin escribir a IT.

  @HU-SOL-01-1 @positivo
  Escenario: HU-SOL-01 criterio 1 (positivo)
    Dado el «Portátil 07» disponible y el «Monitor 03» prestado a «luis.garcia@empresa.com» con devolución «2026-12-15»
    Cuando el empleado «ana.perez@empresa.com» consulta los equipos
    Entonces recibe 200 con el «Portátil 07» en estado «disponible» sin persona ni fecha, y el «Monitor 03» en estado «prestado» con persona «luis.garcia@empresa.com» y devolución «2026-12-15»

  @HU-SOL-01-2 @negativo
  Escenario: HU-SOL-01 criterio 2 (negativo)
    Dado ningún equipo dado de alta
    Cuando el empleado «ana.perez@empresa.com» consulta los equipos
    Entonces recibe 200 con una lista vacía
