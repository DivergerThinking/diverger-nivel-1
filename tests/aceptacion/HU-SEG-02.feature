# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it-2/backlog.json. No se edita a mano: se regenera.

@HU-SEG-02
Característica: Consultar el historial de un equipo
  Como persona de IT, quiero consultar el historial de préstamos de un equipo, para saber quién lo tuvo y si lo devolvió, sin buscarlo en la hoja de cálculo.

  @HU-SEG-02-1 @positivo
  Escenario: HU-SEG-02 criterio 1 (positivo)
    Dado el equipo «Portátil 07», prestado a «luis.gomez@empresa.com» con devolucion «2026-11-05» y ya devuelto, y después reservado a «ana.perez@empresa.com» con devolucion «2026-11-20»
    Cuando la persona de IT consulta GET /api/equipos/{id}/historial
    Entonces recibe 200 con primero la entrada de «ana.perez@empresa.com», «2026-11-20» y estado «reservado», y después la de «luis.gomez@empresa.com», «2026-11-05» y estado «devuelto»

  @HU-SEG-02-2 @negativo
  Escenario: HU-SEG-02 criterio 2 (negativo)
    Dado ningún equipo con el id «no-existe»
    Cuando la persona de IT consulta GET /api/equipos/no-existe/historial
    Entonces recibe 404 con {"error": "No existe el equipo"}

  @HU-SEG-02-3 @negativo
  Escenario: HU-SEG-02 criterio 3 (negativo)
    Dado el equipo «Portátil 07» y la empleada «ana.perez@empresa.com», que no está en CORREOS_IT
    Cuando consulta GET /api/equipos/{id}/historial
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."}
