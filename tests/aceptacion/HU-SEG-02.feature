# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SEG-02
Característica: Consultar el historial de un equipo
  Como técnico de IT, quiero consultar los préstamos que ha tenido un equipo, para saber quién tuvo un equipo y cuándo lo devolvió, sin preguntar a nadie.

  @HU-SEG-02-1 @positivo
  Escenario: HU-SEG-02 criterio 1 (positivo)
    Dado el equipo 42 prestado a «ana.perez@empresa.com» hasta 2026-10-15 y devuelto, y ahora reservado a «luis.gomez@empresa.com» hasta 2026-12-01
    Cuando un técnico de IT consulta GET /api/equipos/42/historial
    Entonces recibe 200 con primero el préstamo de «luis.gomez@empresa.com» en estado «reservado» y después el de «ana.perez@empresa.com» en estado «devuelto»

  @HU-SEG-02-2 @negativo
  Escenario: HU-SEG-02 criterio 2 (negativo)
    Dado no existe el equipo 999
    Cuando un técnico de IT consulta GET /api/equipos/999/historial
    Entonces la respuesta es 404 con {"error": "No existe el equipo"}
