# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-INV-03
Característica: Ver el historial de un equipo
  Como técnico de IT, quiero consultar los préstamos de un equipo, para saber quién lo ha tenido y cuándo debía devolverlo.

  @HU-INV-03-1 @positivo
  Escenario: HU-INV-03 criterio 1 (positivo)
    Dado el equipo «Portátil 07» prestado a «ana.perez@empresa.com» con devolución «2026-11-05» y ya devuelto, y ahora reservado por «luis.gomez@empresa.com» con devolución «2026-11-20»
    Cuando la cuenta de IT «it@empresa.com» consulta GET /api/equipos/{id}/historial de «Portátil 07»
    Entonces recibe 200 con primero «luis.gomez@empresa.com», «2026-11-20», «reservado» y después «ana.perez@empresa.com», «2026-11-05», «devuelto»

  @HU-INV-03-2 @negativo
  Escenario: HU-INV-03 criterio 2 (negativo)
    Dado la cuenta de IT «it@empresa.com» y ningún equipo con el id «no-existe»
    Cuando consulta GET /api/equipos/no-existe/historial
    Entonces recibe 404 con {"error": "No existe el equipo"}
