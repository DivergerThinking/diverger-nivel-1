# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-EQU-02
Característica: Ver los equipos y su estado
  Como empleado, quiero ver los equipos con su estado, para saber qué está libre antes de pedirlo, sin escribir a IT.

  @HU-EQU-02-1 @positivo
  Escenario: HU-EQU-02 criterio 1 (positivo)
    Dado «Portátil 07» disponible y «Proyector 02» prestado a «luis.gomez@empresa.com» con devolución «2026-11-20»
    Cuando un empleado consulta GET /api/equipos
    Entonces recibe 200 con «Portátil 07» en estado «disponible» sin persona ni devolución, y «Proyector 02» en estado «prestado» con persona «luis.gomez@empresa.com» y devolución «2026-11-20»

  @HU-EQU-02-2 @negativo
  Escenario: HU-EQU-02 criterio 2 (negativo)
    Dado una petición sin token de identidad
    Cuando consulta GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."} y ningún equipo
