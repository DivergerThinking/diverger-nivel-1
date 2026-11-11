# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-GES-03
Característica: Prestar un equipo en el mostrador
  Como técnico de IT, quiero prestar directamente un equipo disponible a quien viene al mostrador, para que el equipo conste a nombre de quien lo lleva y, si el préstamo vence, aparezca entre los vencidos aunque no pasara por una solicitud.

  @HU-GES-03-1 @positivo
  Escenario: HU-GES-03 criterio 1 (positivo)
    Dado el equipo «Monitor 03» disponible
    Cuando un técnico de IT envía POST /api/equipos/{id}/prestamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «prestado», persona «ana.perez@empresa.com» y devolución «2026-11-20»

  @HU-GES-03-2 @positivo
  Escenario: HU-GES-03 criterio 2 (positivo)
    Dado el 11 de noviembre de 2026 en Madrid y el equipo «Monitor 03» disponible
    Cuando un técnico de IT envía el préstamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-05"}
    Entonces recibe 201 con el equipo prestado y el equipo aparece en GET /api/prestamos/vencidos

  @HU-GES-03-3 @negativo
  Escenario: HU-GES-03 criterio 3 (negativo)
    Dado el equipo «Monitor 03» disponible
    Cuando un técnico de IT envía el préstamo con {"devolucion": "2026-11-20"}
    Entonces recibe 400 con {"error": "Faltan la persona o la fecha de devolución"} y el equipo sigue disponible

  @HU-GES-03-4 @negativo
  Escenario: HU-GES-03 criterio 4 (negativo)
    Dado el equipo «Monitor 03» reservado a «luis.gomez@empresa.com»
    Cuando un técnico de IT envía el préstamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y la reserva de «luis.gomez@empresa.com» no cambia

  @HU-GES-03-5 @negativo
  Escenario: HU-GES-03 criterio 5 (negativo)
    Dado el equipo «Monitor 03» disponible
    Cuando un técnico de IT envía el préstamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-GES-03-6 @negativo
  Escenario: HU-GES-03 criterio 6 (negativo)
    Dado el equipo «Monitor 03» disponible, una solicitud de «luis.gomez@empresa.com» y un préstamo en el mostrador a «ana.perez@empresa.com» simultáneos
    Cuando llegan los dos a la vez
    Entonces una de las dos peticiones recibe 201, la otra recibe 409 con {"error": "El equipo no está disponible"} y el equipo queda en un solo estado, a nombre de una sola persona
