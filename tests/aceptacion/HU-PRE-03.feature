# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-03
Característica: Prestar un equipo en el mostrador
  Como técnico de IT, quiero prestar directamente un equipo disponible a quien viene al mostrador, para que todos los préstamos pasen por la aplicación aunque no se hayan pedido antes.

  @HU-PRE-03-1 @positivo
  Escenario: HU-PRE-03 criterio 1 (positivo)
    Dado el «Monitor 03» disponible
    Cuando un técnico de IT envía POST /api/equipos/{id}/prestamo con {"persona": "luis.gomez@empresa.com", "devolucion": "2026-12-15"}
    Entonces recibe 201 con el estado «prestado», la persona luis.gomez@empresa.com y la devolución 2026-12-15

  @HU-PRE-03-2 @positivo
  Escenario: HU-PRE-03 criterio 2 (positivo)
    Dado hoy es 2026-12-03 en Madrid y el «Monitor 03» disponible
    Cuando un técnico de IT envía POST /api/equipos/{id}/prestamo con {"persona": "luis.gomez@empresa.com", "devolucion": "2026-12-01"}
    Entonces recibe 201 y el préstamo aparece en GET /api/prestamos/vencidos

  @HU-PRE-03-3 @negativo
  Escenario: HU-PRE-03 criterio 3 (negativo)
    Dado el «Monitor 03» disponible
    Cuando un técnico de IT envía POST /api/equipos/{id}/prestamo con {"devolucion": "2026-12-15"}
    Entonces recibe 400 con {"error": "Faltan la persona o la fecha de devolución"}

  @HU-PRE-03-4 @negativo
  Escenario: HU-PRE-03 criterio 4 (negativo)
    Dado el «Monitor 03» reservado por ana.perez@empresa.com
    Cuando un técnico de IT envía POST /api/equipos/{id}/prestamo con {"persona": "luis.gomez@empresa.com", "devolucion": "2026-12-15"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"}

  @HU-PRE-03-5 @negativo
  Escenario: HU-PRE-03 criterio 5 (negativo)
    Dado el «Monitor 03» disponible
    Cuando un técnico de IT envía POST /api/equipos/{id}/prestamo con {"persona": "luis.gomez@empresa.com", "devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"}

  @HU-PRE-03-6 @negativo
  Escenario: HU-PRE-03 criterio 6 (negativo)
    Dado el «Monitor 03» disponible y dos préstamos en el mostrador para luis.gomez@empresa.com y marta.ruiz@empresa.com enviados en el mismo instante
    Cuando llegan las dos peticiones POST /api/equipos/{id}/prestamo
    Entonces una recibe 201 y la otra 409 con {"error": "El equipo no está disponible"}
