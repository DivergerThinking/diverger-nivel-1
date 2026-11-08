# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-PRE-02
Característica: Prestar un equipo en el mostrador
  Como técnico de IT, quiero prestar un equipo libre a quien viene a pedirlo al mostrador, para que también los préstamos del mostrador pasen por la aplicación.

  @HU-PRE-02-1 @positivo
  Escenario: HU-PRE-02 criterio 1 (positivo)
    Dado «Monitor 03» disponible
    Cuando el técnico de IT envía POST /api/equipos/{id}/prestamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «prestado», persona «ana.perez@empresa.com» y devolución «2026-11-20»

  @HU-PRE-02-2 @positivo
  Escenario: HU-PRE-02 criterio 2 (positivo)
    Dado hoy es 10/11/2026 en Madrid y «Monitor 04» está disponible
    Cuando el técnico de IT lo presta con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-05"}
    Entonces recibe 201 con el equipo prestado y devolución «2026-11-05»

  @HU-PRE-02-3 @negativo
  Escenario: HU-PRE-02 criterio 3 (negativo)
    Dado «Monitor 03» disponible
    Cuando el técnico de IT lo presta con {"devolucion": "2026-11-20"} sin persona
    Entonces recibe 400 con {"error": "Faltan la persona o la fecha de devolución"} y el equipo sigue disponible

  @HU-PRE-02-4 @negativo
  Escenario: HU-PRE-02 criterio 4 (negativo)
    Dado «Monitor 03» disponible
    Cuando el técnico de IT lo presta con {"persona": "ana.perez@empresa.com", "devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-PRE-02-5 @negativo
  Escenario: HU-PRE-02 criterio 5 (negativo)
    Dado «Monitor 03» disponible
    Cuando el técnico de IT lo presta con {"persona": "ana.perez@empresa.com", "devolucion": "20/11/2026"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-PRE-02-6 @negativo
  Escenario: HU-PRE-02 criterio 6 (negativo)
    Dado no existe ningún equipo con el id «no-existe»
    Cuando el técnico de IT envía POST /api/equipos/no-existe/prestamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 404 con {"error": "No existe el equipo"}

  @HU-PRE-02-7 @negativo
  Escenario: HU-PRE-02 criterio 7 (negativo)
    Dado «Monitor 03» reservado a «luis.gomez@empresa.com»
    Cuando el técnico de IT lo presta a «ana.perez@empresa.com» con devolución «2026-11-20»
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y la reserva de «luis.gomez@empresa.com» no cambia
