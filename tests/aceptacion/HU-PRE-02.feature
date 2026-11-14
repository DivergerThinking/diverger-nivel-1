# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-02
Característica: Prestar un equipo en el mostrador
  Como técnico de IT, quiero prestar un equipo disponible a la persona que viene al mostrador, para que los préstamos sin solicitud previa también queden registrados en la aplicación.

  @HU-PRE-02-1 @positivo
  Escenario: HU-PRE-02 criterio 1 (positivo)
    Dado el equipo «Monitor 03» disponible, el 14 de noviembre de 2026 en Madrid
    Cuando un técnico de IT presta «Monitor 03» a luis.gomez@empresa.com con devolución «2026-11-20»
    Entonces recibe 201 con «Monitor 03» prestado a «luis.gomez@empresa.com» con devolución «2026-11-20»

  @HU-PRE-02-2 @positivo
  Escenario: HU-PRE-02 criterio 2 (positivo)
    Dado el equipo «Monitor 03» disponible, el 14 de noviembre de 2026 en Madrid
    Cuando un técnico de IT presta «Monitor 03» a luis.gomez@empresa.com con devolución «2026-11-10»
    Entonces recibe 201 con «Monitor 03» prestado a «luis.gomez@empresa.com» con devolución «2026-11-10», aunque la fecha sea anterior a hoy

  @HU-PRE-02-3 @negativo
  Escenario: HU-PRE-02 criterio 3 (negativo)
    Dado el equipo «Monitor 03» disponible
    Cuando un técnico de IT lo presta con devolución «2026-11-20» y sin persona
    Entonces recibe 400 con el error «Faltan la persona o la fecha de devolución» y «Monitor 03» sigue disponible

  @HU-PRE-02-4 @negativo
  Escenario: HU-PRE-02 criterio 4 (negativo)
    Dado el equipo «Monitor 03» disponible
    Cuando un técnico de IT lo presta a luis.gomez@empresa.com con devolución «2026-02-30»
    Entonces recibe 400 con el error «La fecha de devolución no es válida» y «Monitor 03» sigue disponible

  @HU-PRE-02-5 @negativo
  Escenario: HU-PRE-02 criterio 5 (negativo)
    Dado el equipo «Portátil 07» reservado por ana.perez@empresa.com
    Cuando un técnico de IT lo presta a luis.gomez@empresa.com con devolución «2026-11-20»
    Entonces recibe 409 con el error «El equipo no está disponible» y «Portátil 07» sigue reservado por ana.perez@empresa.com
