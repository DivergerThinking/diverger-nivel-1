# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SEG-02
Característica: Consultar el historial de un equipo
  Como técnico de IT, quiero consultar los préstamos que ha tenido un equipo, para saber quién ha tenido el equipo y hasta cuándo sin buscarlo en la hoja de cálculo.

  @HU-SEG-02-1 @positivo
  Escenario: HU-SEG-02 criterio 1 (positivo)
    Dado «Portátil 07» con un préstamo a «ana.perez@empresa.com» con devolución «2026-11-05» ya devuelto y ahora reservado a «luis.gomez@empresa.com» con devolución «2026-11-20»
    Cuando el técnico de IT consulta GET /api/equipos/{id}/historial
    Entonces recibe 200 con primero «luis.gomez@empresa.com», «2026-11-20», «reservado» y después «ana.perez@empresa.com», «2026-11-05», «devuelto»

  @HU-SEG-02-2 @negativo
  Escenario: HU-SEG-02 criterio 2 (negativo)
    Dado no existe ningún equipo con el id «no-existe»
    Cuando el técnico de IT consulta GET /api/equipos/no-existe/historial
    Entonces recibe 404 con {"error": "No existe el equipo"}

  @HU-SEG-02-3 @negativo
  Escenario: HU-SEG-02 criterio 3 (negativo)
    Dado la empleada «ana.perez@empresa.com», que no está en CORREOS_IT
    Cuando consulta GET /api/equipos/{id}/historial de «Portátil 07»
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."}
