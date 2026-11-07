# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SOL-01
Característica: Ver los equipos y su estado
  Como empleado, quiero ver la lista de equipos con su estado, para saber qué está libre sin tener que preguntar a IT.

  @HU-SOL-01-1 @positivo
  Escenario: HU-SOL-01 criterio 1 (positivo)
    Dado un empleado con sesión iniciada como «luis.gomez@empresa.com», con el equipo «Portátil 07» disponible y el equipo «Proyector 02» prestado a «ana.perez@empresa.com» con devolución «2026-11-20»
    Cuando pide GET /api/equipos
    Entonces recibe 200 con «Portátil 07» en estado «disponible» sin «persona» ni «devolucion», y «Proyector 02» en estado «prestado» con «persona» «ana.perez@empresa.com» y «devolucion» «2026-11-20»

  @HU-SOL-01-2 @positivo
  Escenario: HU-SOL-01 criterio 2 (positivo)
    Dado un empleado con sesión iniciada y el equipo «Monitor 03» reservado a «ana.perez@empresa.com» con devolución «2026-11-25»
    Cuando pide GET /api/equipos
    Entonces recibe «Monitor 03» en estado «reservado» con «persona» «ana.perez@empresa.com» y «devolucion» «2026-11-25»

  @HU-SOL-01-3 @negativo
  Escenario: HU-SOL-01 criterio 3 (negativo)
    Dado una petición sin token de identidad de Google
    Cuando pide GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."} y ninguna lista de equipos
