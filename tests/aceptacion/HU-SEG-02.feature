# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SEG-02
Característica: Consultar el historial de un equipo
  Como técnico de IT, quiero consultar los préstamos que ha tenido un equipo, para saber quién lo tuvo y cuándo sin buscar en la hoja de cálculo.

  @HU-SEG-02-1 @positivo
  Escenario: HU-SEG-02 criterio 1 (positivo)
    Dado un técnico de IT con sesión iniciada y el equipo «Portátil 07» prestado a «ana.perez@empresa.com» con devolución «2026-11-05» y devuelto, y después reservado a «luis.gomez@empresa.com» con devolución «2026-11-20»
    Cuando pide GET /api/equipos/{id}/historial de «Portátil 07»
    Entonces recibe 200 con primero «luis.gomez@empresa.com», «2026-11-20», estado «reservado», y después «ana.perez@empresa.com», «2026-11-05», estado «devuelto»

  @HU-SEG-02-2 @negativo
  Escenario: HU-SEG-02 criterio 2 (negativo)
    Dado un técnico de IT con sesión iniciada y ningún equipo con el id «no-existe»
    Cuando pide GET /api/equipos/no-existe/historial
    Entonces recibe 404 con {"error": "No existe el equipo"}

  @HU-SEG-02-3 @negativo
  Escenario: HU-SEG-02 criterio 3 (negativo)
    Dado un empleado «luis.gomez@empresa.com» que no está en CORREOS_IT
    Cuando pide el historial de «Portátil 07»
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."}
