# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-01
Característica: Ver los equipos y su estado
  Como empleado, quiero ver la lista de equipos de la oficina con su estado, para saber qué está libre sin tener que preguntar a IT.

  @HU-SOL-01-1 @positivo
  Escenario: HU-SOL-01 criterio 1 (positivo)
    Dado un empleado con sesión iniciada como «ana.perez@empresa.com», el equipo «Portátil 07» disponible y el equipo «Proyector 02» prestado a «luis.gomez@empresa.com» con devolución «2026-11-20»
    Cuando pide la lista con GET /api/equipos
    Entonces recibe 200 con «Portátil 07» con estado «disponible» y sin persona ni devolución, y «Proyector 02» con estado «prestado», persona «luis.gomez@empresa.com» y devolución «2026-11-20»

  @HU-SOL-01-2 @negativo
  Escenario: HU-SOL-01 criterio 2 (negativo)
    Dado una petición sin token de identidad de Google
    Cuando pide la lista con GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."} y ningún equipo
