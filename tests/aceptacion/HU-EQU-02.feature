# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-EQU-02
Característica: Ver los equipos y su estado
  Como empleado, quiero ver la lista de equipos con su estado, para saber qué está libre sin preguntar a IT.

  @HU-EQU-02-1 @positivo
  Escenario: HU-EQU-02 criterio 1 (positivo)
    Dado el equipo «Portátil 07» disponible y el «Proyector 01» prestado a luis.gomez@empresa.com hasta el 2026-12-10
    Cuando un empleado consulta GET /api/equipos
    Entonces recibe 200 con «Portátil 07» en estado «disponible» sin persona ni devolución, y «Proyector 01» en estado «prestado» con persona luis.gomez@empresa.com y devolución 2026-12-10

  @HU-EQU-02-2 @negativo
  Escenario: HU-EQU-02 criterio 2 (negativo)
    Dado ningún equipo dado de alta
    Cuando un empleado consulta GET /api/equipos
    Entonces recibe 200 con una lista vacía
