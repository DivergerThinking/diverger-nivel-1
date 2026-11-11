# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SEG-02
Característica: Consultar el historial de un equipo
  Como técnico de IT, quiero consultar el historial de préstamos de un equipo, para saber quién lo tuvo y cuándo si falta o vuelve dañado.

  @HU-SEG-02-1 @positivo
  Escenario: HU-SEG-02 criterio 1 (positivo)
    Dado «Portátil 07» prestado y devuelto por «luis.gomez@empresa.com» con devolución «2026-10-15» y ahora reservado a «ana.perez@empresa.com» con devolución «2026-11-20»
    Cuando un técnico de IT pide GET /api/equipos/{id}/historial
    Entonces recibe 200 con primero «ana.perez@empresa.com», «2026-11-20», «reservado» y después «luis.gomez@empresa.com», «2026-10-15», «devuelto»

  @HU-SEG-02-2 @negativo
  Escenario: HU-SEG-02 criterio 2 (negativo)
    Dado un identificador de equipo que no existe
    Cuando un técnico de IT pide GET /api/equipos/{id}/historial
    Entonces recibe 404 con {"error": "No existe el equipo"}
