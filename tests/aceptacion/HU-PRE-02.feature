# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-PRE-02
Característica: Prestar un equipo en el mostrador
  Como técnico de IT, quiero prestar un equipo disponible a quien viene al mostrador, con su fecha de devolución, para que también los préstamos sin solicitud pasen por la aplicación.

  @HU-PRE-02-1 @positivo
  Escenario: HU-PRE-02 criterio 1 (positivo)
    Dado el equipo «Proyector 01» disponible
    Cuando el técnico de IT «it.soporte@empresa.com» lo presta a «ana.perez@empresa.com» con la devolución «2030-06-15»
    Entonces recibe 201 con el equipo en estado «prestado», la persona «ana.perez@empresa.com» y la devolución «2030-06-15»

  @HU-PRE-02-2 @positivo
  Escenario: HU-PRE-02 criterio 2 (positivo)
    Dado el equipo «Proyector 01» disponible
    Cuando el técnico de IT «it.soporte@empresa.com» lo presta a «ana.perez@empresa.com» con la devolución «2025-01-10», anterior a hoy en Madrid
    Entonces recibe 201 con el equipo en estado «prestado» y el préstamo aparece entre los vencidos

  @HU-PRE-02-3 @negativo
  Escenario: HU-PRE-02 criterio 3 (negativo)
    Dado el equipo «Proyector 01» disponible
    Cuando el técnico de IT «it.soporte@empresa.com» lo presta con la devolución «2030-06-15» y sin persona
    Entonces recibe 400 con {"error": "Faltan la persona o la fecha de devolución"} y el equipo sigue disponible

  @HU-PRE-02-4 @negativo
  Escenario: HU-PRE-02 criterio 4 (negativo)
    Dado el equipo «Proyector 01» disponible
    Cuando el técnico de IT «it.soporte@empresa.com» lo presta a «ana.perez@empresa.com» con la devolución «2026-02-30»
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-PRE-02-5 @negativo
  Escenario: HU-PRE-02 criterio 5 (negativo)
    Dado el equipo «Proyector 01» prestado a «marcos.ruiz@empresa.com»
    Cuando el técnico de IT «it.soporte@empresa.com» lo presta a «ana.perez@empresa.com» con la devolución «2030-06-15»
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y el equipo sigue prestado a «marcos.ruiz@empresa.com»
