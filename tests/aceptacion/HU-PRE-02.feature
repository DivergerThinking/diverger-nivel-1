# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-02
Característica: Prestar un equipo en el mostrador
  Como técnico de IT, quiero prestar directamente un equipo libre a quien viene al mostrador, para que también pasen por la aplicación los préstamos que no se piden antes.

  @HU-PRE-02-1 @positivo
  Escenario: HU-PRE-02 criterio 1 (positivo)
    Dado el 23 de noviembre de 2026 en Madrid y el «Proyector 01» disponible
    Cuando un técnico de IT lo presta a «ana.perez@empresa.com» con devolución «2026-11-30»
    Entonces recibe 201 con el «Proyector 01» en estado «prestado», persona «ana.perez@empresa.com» y devolución «2026-11-30»

  @HU-PRE-02-2 @positivo
  Escenario: HU-PRE-02 criterio 2 (positivo)
    Dado el 23 de noviembre de 2026 en Madrid y el «Monitor 03» disponible
    Cuando un técnico de IT, que lo apunta con retraso, lo presta a «luis.garcia@empresa.com» con devolución «2026-11-10»
    Entonces recibe 201 con el «Monitor 03» en estado «prestado» y devolución «2026-11-10»

  @HU-PRE-02-3 @negativo
  Escenario: HU-PRE-02 criterio 3 (negativo)
    Dado el «Proyector 01» disponible
    Cuando un técnico de IT lo presta con devolución «2026-11-30» y sin persona
    Entonces recibe 400 con {"error": "Faltan la persona o la fecha de devolución"} y el equipo sigue disponible

  @HU-PRE-02-4 @negativo
  Escenario: HU-PRE-02 criterio 4 (negativo)
    Dado el «Proyector 01» disponible
    Cuando un técnico de IT lo presta a «ana.perez@empresa.com» sin fecha de devolución
    Entonces recibe 400 con {"error": "Faltan la persona o la fecha de devolución"} y el equipo sigue disponible

  @HU-PRE-02-5 @negativo
  Escenario: HU-PRE-02 criterio 5 (negativo)
    Dado el «Proyector 01» disponible
    Cuando un técnico de IT lo presta a «ana.perez@empresa.com» con devolución «2026-02-30»
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-PRE-02-6 @negativo
  Escenario: HU-PRE-02 criterio 6 (negativo)
    Dado el «Portátil 07» reservado por «luis.garcia@empresa.com»
    Cuando un técnico de IT lo presta a «ana.perez@empresa.com» con devolución «2026-11-30»
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y la reserva de «luis.garcia@empresa.com» sigue igual
