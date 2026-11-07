# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it-2/backlog.json. No se edita a mano: se regenera.

@HU-EQU-02
Característica: Ver los equipos y su estado
  Como empleado, quiero ver los equipos de la oficina con su estado, para saber qué está libre sin escribir a IT.

  @HU-EQU-02-1 @positivo
  Escenario: HU-EQU-02 criterio 1 (positivo)
    Dado el equipo «Portátil 07» disponible y el equipo «Proyector 01» reservado a «ana.perez@empresa.com» hasta el 2026-11-20
    Cuando el empleado «luis.gomez@empresa.com» consulta GET /api/equipos
    Entonces recibe 200 con «Portátil 07» en estado «disponible», sin persona ni devolución, y «Proyector 01» en estado «reservado» con persona «ana.perez@empresa.com» y devolucion «2026-11-20»

  @HU-EQU-02-2 @negativo
  Escenario: HU-EQU-02 criterio 2 (negativo)
    Dado los mismos equipos y una petición sin token
    Cuando consulta GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."} y no ve ningún equipo
