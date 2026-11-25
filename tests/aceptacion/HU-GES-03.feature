# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-GES-03
Característica: Prestar un equipo en el mostrador
  Como técnico de IT, quiero prestar un equipo disponible a quien viene al mostrador, con su fecha de devolución, para registrar también los préstamos que no se piden desde la aplicación, incluso los que apunto con retraso.

  @HU-GES-03-1 @positivo
  Escenario: HU-GES-03 criterio 1 (positivo)
    Dado el equipo 42 disponible
    Cuando un técnico de IT envía POST /api/equipos/42/prestamo con {"persona": "luis.gomez@empresa.com", "devolucion": "2026-12-01"}
    Entonces recibe 201 con el equipo en estado «prestado», persona «luis.gomez@empresa.com» y devolucion «2026-12-01»

  @HU-GES-03-2 @positivo
  Escenario: HU-GES-03 criterio 2 (positivo)
    Dado hoy es 2026-11-25 en Madrid y el equipo 42 disponible
    Cuando un técnico de IT presta el equipo con {"persona": "luis.gomez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 201 y el equipo 42 aparece en GET /api/prestamos/vencidos

  @HU-GES-03-3 @negativo
  Escenario: HU-GES-03 criterio 3 (negativo)
    Dado el equipo 42 disponible
    Cuando un técnico de IT presta el equipo con {"devolucion": "2026-12-01"}
    Entonces la respuesta es 400 con {"error": "Faltan la persona o la fecha de devolución"}

  @HU-GES-03-4 @negativo
  Escenario: HU-GES-03 criterio 4 (negativo)
    Dado el equipo 42 reservado a «ana.perez@empresa.com»
    Cuando un técnico de IT lo presta con {"persona": "luis.gomez@empresa.com", "devolucion": "2026-12-01"}
    Entonces la respuesta es 409 con {"error": "El equipo no está disponible"}

  @HU-GES-03-5 @negativo
  Escenario: HU-GES-03 criterio 5 (negativo)
    Dado el equipo 42 disponible
    Cuando un técnico de IT lo presta con {"persona": "luis.gomez@empresa.com", "devolucion": "2026-02-30"}
    Entonces la respuesta es 400 con {"error": "La fecha de devolución no es válida"}

  @HU-GES-03-6 @negativo
  Escenario: HU-GES-03 criterio 6 (negativo)
    Dado no existe el equipo 999
    Cuando un técnico de IT envía POST /api/equipos/999/prestamo con {"persona": "luis.gomez@empresa.com", "devolucion": "2026-12-01"}
    Entonces la respuesta es 404 con {"error": "No existe el equipo"}
