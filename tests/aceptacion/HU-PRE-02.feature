# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it-2/backlog.json. No se edita a mano: se regenera.

@HU-PRE-02
Característica: Prestar un equipo en el mostrador
  Como persona de IT, quiero prestar un equipo disponible a quien viene al mostrador, con su fecha de devolución, para que el préstamo conste aunque la persona no lo haya pedido antes en la aplicación.

  @HU-PRE-02-1 @positivo
  Escenario: HU-PRE-02 criterio 1 (positivo)
    Dado el día 2026-11-10 en Madrid y el equipo «Monitor 03» disponible
    Cuando la persona de IT envía POST /api/equipos/{id}/prestamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «prestado», persona «ana.perez@empresa.com» y devolucion «2026-11-20»

  @HU-PRE-02-2 @positivo
  Escenario: HU-PRE-02 criterio 2 (positivo)
    Dado el día 2026-11-10 en Madrid y el equipo «Monitor 03» disponible
    Cuando la persona de IT envía el préstamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-03"}
    Entonces recibe 201 con el equipo prestado y devolucion «2026-11-03», una fecha anterior a hoy

  @HU-PRE-02-3 @negativo
  Escenario: HU-PRE-02 criterio 3 (negativo)
    Dado el equipo «Monitor 03» disponible
    Cuando la persona de IT envía el préstamo con {"devolucion": "2026-11-20"}
    Entonces recibe 400 con {"error": "Faltan la persona o la fecha de devolución"} y el equipo sigue disponible

  @HU-PRE-02-4 @negativo
  Escenario: HU-PRE-02 criterio 4 (negativo)
    Dado el equipo «Monitor 03» disponible
    Cuando la persona de IT envía el préstamo con {"persona": "ana.perez@empresa.com"}
    Entonces recibe 400 con {"error": "Faltan la persona o la fecha de devolución"} y el equipo sigue disponible

  @HU-PRE-02-5 @negativo
  Escenario: HU-PRE-02 criterio 5 (negativo)
    Dado ningún equipo con el id «no-existe»
    Cuando la persona de IT envía POST /api/equipos/no-existe/prestamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 404 con {"error": "No existe el equipo"}

  @HU-PRE-02-6 @negativo
  Escenario: HU-PRE-02 criterio 6 (negativo)
    Dado el equipo «Monitor 03» disponible
    Cuando la persona de IT envía el préstamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"}

  @HU-PRE-02-7 @negativo
  Escenario: HU-PRE-02 criterio 7 (negativo)
    Dado el equipo «Monitor 03» reservado a «luis.gomez@empresa.com»
    Cuando la persona de IT envía el préstamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y la reserva sigue a nombre de «luis.gomez@empresa.com»
