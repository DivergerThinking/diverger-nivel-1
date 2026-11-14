# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-01
Característica: Prestar un equipo en el mostrador
  Como técnico de IT, quiero prestar un equipo disponible a quien viene a pedirlo al mostrador, para atenderle en el momento sin que tenga que hacer una solicitud.

  @HU-PRE-01-1 @positivo
  Escenario: HU-PRE-01 criterio 1 (positivo)
    Dado el equipo «Proyector 01» disponible
    Cuando la cuenta de IT «it@empresa.com» envía POST /api/equipos/{id}/prestamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «prestado», persona «ana.perez@empresa.com» y devolución «2026-11-20»

  @HU-PRE-01-2 @positivo
  Escenario: HU-PRE-01 criterio 2 (positivo)
    Dado hoy es el 14 de noviembre de 2026 en Madrid y el equipo «Monitor 05» está disponible
    Cuando la cuenta de IT «it@empresa.com» presta «Monitor 05» con {"persona": "luis.gomez@empresa.com", "devolucion": "2026-11-10"}
    Entonces recibe 201 con el equipo prestado con devolución «2026-11-10»

  @HU-PRE-01-3 @negativo
  Escenario: HU-PRE-01 criterio 3 (negativo)
    Dado el equipo «Proyector 01» disponible
    Cuando la cuenta de IT «it@empresa.com» presta «Proyector 01» con {"devolucion": "2026-11-20"}
    Entonces recibe 400 con {"error": "Faltan la persona o la fecha de devolución"}

  @HU-PRE-01-4 @negativo
  Escenario: HU-PRE-01 criterio 4 (negativo)
    Dado el equipo «Proyector 01» disponible
    Cuando la cuenta de IT «it@empresa.com» presta «Proyector 01» con {"persona": "ana.perez@empresa.com", "devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"}

  @HU-PRE-01-5 @negativo
  Escenario: HU-PRE-01 criterio 5 (negativo)
    Dado el equipo «Monitor 03» reservado por «luis.gomez@empresa.com»
    Cuando la cuenta de IT «it@empresa.com» presta «Monitor 03» con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"}

  @HU-PRE-01-6 @negativo
  Escenario: HU-PRE-01 criterio 6 (negativo)
    Dado ningún equipo con el id «no-existe»
    Cuando la cuenta de IT «it@empresa.com» envía POST /api/equipos/no-existe/prestamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 404 con {"error": "No existe el equipo"}
