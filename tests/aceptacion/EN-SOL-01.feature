# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it-2/backlog.json. No se edita a mano: se regenera.

@EN-SOL-01
Característica: Evitar que un equipo se reserve o se preste dos veces a la vez
  Como equipo, quiero garantizar que un equipo no se reserve ni se preste dos veces con peticiones simultáneas, para que dos empleados nunca se queden con el mismo equipo por pedirlo a la vez.

  @EN-SOL-01-1 @positivo
  Escenario: EN-SOL-01 criterio 1 (positivo)
    Dado el equipo «Portátil 07» disponible y 10 empleados distintos con un token válido
    Cuando se lanzan en paralelo 10 POST /api/equipos/{id}/solicitud sobre ese equipo con {"devolucion": "2026-11-20"}
    Entonces exactamente una devuelve 201, las otras 9 devuelven 409 con {"error": "El equipo no está disponible"} y el equipo queda reservado a una sola persona

  @EN-SOL-01-2 @negativo
  Escenario: EN-SOL-01 criterio 2 (negativo)
    Dado el equipo «Monitor 03» disponible, la empleada «ana.perez@empresa.com» y la persona de IT «it@empresa.com»
    Cuando se lanzan en paralelo la solicitud de «ana.perez@empresa.com» y el préstamo en el mostrador para «luis.gomez@empresa.com» sobre ese equipo
    Entonces exactamente una devuelve 201, la otra devuelve 409 con {"error": "El equipo no está disponible"} y el equipo queda a nombre de una sola persona
