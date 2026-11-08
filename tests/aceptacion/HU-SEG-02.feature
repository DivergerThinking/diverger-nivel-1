# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SEG-02
Característica: Consultar el historial de un equipo
  Como técnico de IT, quiero consultar el historial de préstamos de un equipo, para saber quién lo ha tenido y cuándo, sin buscar en la hoja de cálculo.

  @HU-SEG-02-1 @positivo
  Escenario: HU-SEG-02 criterio 1 (positivo)
    Dado el equipo «eq-7» prestado a «ana.perez@empresa.com» hasta el 2026-10-15 y devuelto, y después reservado por «luis.gomez@empresa.com» hasta el 2026-11-20
    Cuando un técnico de IT consulta GET /api/equipos/eq-7/historial
    Entonces recibe 200 con primero el de «luis.gomez@empresa.com» en estado «reservado» y después el de «ana.perez@empresa.com» en estado «devuelto»

  @HU-SEG-02-2 @negativo
  Escenario: HU-SEG-02 criterio 2 (negativo)
    Dado no existe ningún equipo «eq-99»
    Cuando un técnico de IT consulta GET /api/equipos/eq-99/historial
    Entonces recibe 404 con {"error": "No existe el equipo"}
