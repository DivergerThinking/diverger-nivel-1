# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-INV-02
Característica: Ver los equipos y su estado
  Como empleado, quiero ver los equipos de la oficina con su estado, para saber qué está libre sin escribir a IT.

  @HU-INV-02-1 @positivo
  Escenario: HU-INV-02 criterio 1 (positivo)
    Dado la empleada «ana.perez@empresa.com» con sesión iniciada, «Portátil 07» disponible y «Monitor 03» prestado a «luis.gomez@empresa.com» con devolución «2026-11-20»
    Cuando consulta la lista de equipos con GET /api/equipos
    Entonces recibe 200 con «Portátil 07» en estado «disponible» sin persona ni devolución, y «Monitor 03» en estado «prestado» con persona «luis.gomez@empresa.com» y devolución «2026-11-20»

  @HU-INV-02-2 @positivo
  Escenario: HU-INV-02 criterio 2 (positivo)
    Dado la empleada «ana.perez@empresa.com» con sesión iniciada y «Proyector 02» reservado a «luis.gomez@empresa.com» con devolución «2026-11-18»
    Cuando consulta la lista de equipos con GET /api/equipos
    Entonces ve «Proyector 02» en estado «reservado» con persona «luis.gomez@empresa.com» y devolución «2026-11-18»

  @HU-INV-02-3 @negativo
  Escenario: HU-INV-02 criterio 3 (negativo)
    Dado una petición sin token de identidad
    Cuando consulta la lista de equipos con GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."} y no ve ningún equipo
