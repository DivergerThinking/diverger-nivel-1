# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-04
Característica: Prestar un equipo en el mostrador
  Como técnico de IT, quiero prestar un equipo disponible a quien viene al mostrador, para que también estos préstamos pasen por la aplicación, aunque los apunte con retraso.

  @HU-PRE-04-1 @positivo
  Escenario: HU-PRE-04 criterio 1 (positivo)
    Dado el 6 de noviembre de 2026 en Madrid y «Proyector 02» disponible
    Cuando un técnico de IT lo presta con {"persona": "marta.ruiz@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 201 con «Proyector 02» en estado «prestado», persona «marta.ruiz@empresa.com» y devolución «2026-11-20»

  @HU-PRE-04-2 @positivo
  Escenario: HU-PRE-04 criterio 2 (positivo)
    Dado el 6 de noviembre de 2026 en Madrid y «Proyector 02» disponible
    Cuando un técnico de IT lo presta con {"persona": "marta.ruiz@empresa.com", "devolucion": "2026-11-01"}
    Entonces recibe 201 con «Proyector 02» en estado «prestado», persona «marta.ruiz@empresa.com» y devolución «2026-11-01»

  @HU-PRE-04-3 @negativo
  Escenario: HU-PRE-04 criterio 3 (negativo)
    Dado «Proyector 02» disponible
    Cuando un técnico de IT lo presta con {"devolucion": "2026-11-20"} y sin persona
    Entonces recibe 400 con {"error": "Faltan la persona o la fecha de devolución"} y el equipo sigue disponible

  @HU-PRE-04-4 @negativo
  Escenario: HU-PRE-04 criterio 4 (negativo)
    Dado «Proyector 02» disponible
    Cuando un técnico de IT lo presta con {"persona": "marta.ruiz@empresa.com", "devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"}

  @HU-PRE-04-5 @negativo
  Escenario: HU-PRE-04 criterio 5 (negativo)
    Dado «Portátil 07» reservado a «luis.garcia@empresa.com»
    Cuando un técnico de IT lo presta a «marta.ruiz@empresa.com» con devolución «2026-11-20»
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y la reserva sigue a nombre de «luis.garcia@empresa.com»

  @HU-PRE-04-6 @negativo
  Escenario: HU-PRE-04 criterio 6 (negativo)
    Dado ningún equipo con el id indicado
    Cuando un técnico de IT lo presta a «marta.ruiz@empresa.com» con devolución «2026-11-20»
    Entonces recibe 404 con {"error": "No existe el equipo"}
