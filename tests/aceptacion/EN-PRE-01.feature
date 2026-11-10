# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@EN-PRE-01
Característica: Evitar reservas y préstamos dobles simultáneos
  Como equipo, quiero impedir que un equipo quede reservado o prestado dos veces con peticiones simultáneas, para que nunca haya dos personas esperando el mismo portátil.

  @EN-PRE-01-1 @positivo
  Escenario: EN-PRE-01 criterio 1 (positivo)
    Dado «Portátil 07» disponible y dos solicitudes simultáneas con devolución «2026-11-20», una de «ana.perez@empresa.com» y otra de «luis.gomez@empresa.com»
    Cuando llegan las dos a la vez
    Entonces una recibe 201 y la otra 409 con {"error": "El equipo no está disponible"}, y el equipo queda reservado a una sola persona

  @EN-PRE-01-2 @negativo
  Escenario: EN-PRE-01 criterio 2 (negativo)
    Dado «Monitor 03» disponible, una solicitud de «ana.perez@empresa.com» y un préstamo en el mostrador de «it.soporte@empresa.com» a «luis.gomez@empresa.com», simultáneos
    Cuando llegan los dos a la vez
    Entonces uno recibe 201 y el otro 409 con {"error": "El equipo no está disponible"}; nunca salen bien los dos

  @EN-PRE-01-3 @negativo
  Escenario: EN-PRE-01 criterio 3 (negativo)
    Dado «Proyector 02» disponible y dos préstamos simultáneos en el mostrador, a «ana.perez@empresa.com» y a «luis.gomez@empresa.com»
    Cuando llegan los dos a la vez
    Entonces uno recibe 201 y el otro 409 con {"error": "El equipo no está disponible"}, y GET /api/equipos muestra «Proyector 02» prestado a una sola persona
