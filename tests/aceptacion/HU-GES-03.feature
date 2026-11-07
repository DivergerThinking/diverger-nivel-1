# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-GES-03
Característica: Prestar un equipo en el mostrador
  Como técnico de IT, quiero prestar un equipo disponible a quien viene a pedirlo al mostrador, para que el préstamo conste aunque no haya pasado por una solicitud.

  @HU-GES-03-1 @positivo
  Escenario: HU-GES-03 criterio 1 (positivo)
    Dado un técnico de IT con sesión iniciada y el equipo «Monitor 03» disponible
    Cuando pide POST /api/equipos/{id}/prestamo de «Monitor 03» con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «prestado», «persona» «ana.perez@empresa.com» y «devolucion» «2026-11-20»

  @HU-GES-03-2 @positivo
  Escenario: HU-GES-03 criterio 2 (positivo)
    Dado un técnico de IT con sesión iniciada, hoy 10/11/2026 en Madrid y el equipo «Monitor 04» disponible
    Cuando pide el préstamo de «Monitor 04» con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-05"}
    Entonces recibe 201 con el equipo prestado y «devolucion» «2026-11-05»

  @HU-GES-03-3 @negativo
  Escenario: HU-GES-03 criterio 3 (negativo)
    Dado un técnico de IT con sesión iniciada y el equipo «Monitor 03» disponible
    Cuando pide el préstamo de «Monitor 03» con {"devolucion": "2026-11-20"}
    Entonces recibe 400 con {"error": "Faltan la persona o la fecha de devolución"} y el equipo sigue disponible

  @HU-GES-03-4 @negativo
  Escenario: HU-GES-03 criterio 4 (negativo)
    Dado un técnico de IT con sesión iniciada y el equipo «Monitor 03» disponible
    Cuando pide el préstamo de «Monitor 03» con {"persona": "ana.perez@empresa.com", "devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-GES-03-5 @negativo
  Escenario: HU-GES-03 criterio 5 (negativo)
    Dado un técnico de IT con sesión iniciada y el equipo «Portátil 07» reservado a «luis.gomez@empresa.com»
    Cuando pide el préstamo de «Portátil 07» con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y la reserva de «luis.gomez@empresa.com» no cambia
