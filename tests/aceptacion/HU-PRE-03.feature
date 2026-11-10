# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-PRE-03
Característica: Prestar un equipo en el mostrador
  Como técnico de IT, quiero prestar un equipo disponible a quien viene a pedirlo al mostrador, para que también esos préstamos queden registrados, aunque los apunte con retraso.

  @HU-PRE-03-1 @positivo
  Escenario: HU-PRE-03 criterio 1 (positivo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada y «Monitor 03» disponible
    Cuando presta «Monitor 03» con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «prestado», persona «ana.perez@empresa.com» y devolución «2026-11-20»

  @HU-PRE-03-2 @positivo
  Escenario: HU-PRE-03 criterio 2 (positivo)
    Dado hoy es 2026-11-10 en Madrid, el técnico de IT «it.soporte@empresa.com» con sesión iniciada y «Proyector 02» disponible
    Cuando presta «Proyector 02» con {"persona": "luis.gomez@empresa.com", "devolucion": "2026-11-05"}
    Entonces recibe 201 con el equipo prestado y devolución «2026-11-05», y el préstamo aparece ya entre los vencidos

  @HU-PRE-03-3 @negativo
  Escenario: HU-PRE-03 criterio 3 (negativo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada y «Monitor 03» disponible
    Cuando presta «Monitor 03» con {"devolucion": "2026-11-20"} sin persona
    Entonces recibe 400 con {"error": "Faltan la persona o la fecha de devolución"} y el equipo sigue disponible

  @HU-PRE-03-4 @negativo
  Escenario: HU-PRE-03 criterio 4 (negativo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada y «Monitor 03» disponible
    Cuando presta «Monitor 03» con {"persona": "ana.perez@empresa.com"} sin fecha de devolución
    Entonces recibe 400 con {"error": "Faltan la persona o la fecha de devolución"} y el equipo sigue disponible

  @HU-PRE-03-5 @negativo
  Escenario: HU-PRE-03 criterio 5 (negativo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada y ningún equipo con el id «no-existe»
    Cuando presta el equipo «no-existe» con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 404 con {"error": "No existe el equipo"}

  @HU-PRE-03-6 @negativo
  Escenario: HU-PRE-03 criterio 6 (negativo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada y «Monitor 03» disponible
    Cuando presta «Monitor 03» con {"persona": "ana.perez@empresa.com", "devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-PRE-03-7 @negativo
  Escenario: HU-PRE-03 criterio 7 (negativo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada y «Portátil 07» reservado a «luis.gomez@empresa.com»
    Cuando presta «Portátil 07» con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y la reserva no cambia

  @HU-PRE-03-8 @negativo
  Escenario: HU-PRE-03 criterio 8 (negativo)
    Dado la empleada «ana.perez@empresa.com», que no es de IT, y «Monitor 03» disponible
    Cuando presta «Monitor 03» con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y el equipo sigue disponible
