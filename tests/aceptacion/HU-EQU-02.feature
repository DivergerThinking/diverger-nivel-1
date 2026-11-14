# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-EQU-02
Característica: Ver los equipos y su estado
  Como empleado, quiero ver los equipos de la oficina y su estado, para saber qué está libre sin preguntar a IT.

  @HU-EQU-02-1 @positivo
  Escenario: HU-EQU-02 criterio 1 (positivo)
    Dado el equipo «Portátil 07» disponible y el equipo «Proyector 02» prestado a ana.perez@empresa.com con devolución «2026-11-20»
    Cuando un empleado consulta la lista de equipos
    Entonces ve «Portátil 07» disponible, sin persona ni fecha de devolución, y «Proyector 02» prestado a «ana.perez@empresa.com» con devolución «2026-11-20»

  @HU-EQU-02-2 @positivo
  Escenario: HU-EQU-02 criterio 2 (positivo)
    Dado el equipo «Monitor 03» reservado por luis.gomez@empresa.com con devolución «2026-11-25»
    Cuando un empleado consulta la lista de equipos
    Entonces ve «Monitor 03» reservado por «luis.gomez@empresa.com» con devolución «2026-11-25»

  @HU-EQU-02-3 @negativo
  Escenario: HU-EQU-02 criterio 3 (negativo)
    Dado ningún equipo dado de alta
    Cuando un empleado consulta la lista de equipos
    Entonces recibe 200 con una lista vacía
