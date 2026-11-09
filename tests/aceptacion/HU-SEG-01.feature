# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SEG-01
Característica: Ver los préstamos vencidos
  Como técnico de IT, quiero ver los préstamos cuya fecha de devolución es anterior a hoy, para revisarlos cada semana sin tener que preguntar a nadie.

  @HU-SEG-01-1 @positivo
  Escenario: HU-SEG-01 criterio 1 (positivo)
    Dado el equipo «Proyector 01» prestado a «ana.perez@empresa.com» hasta «2025-03-01», el equipo «Monitor 03» prestado a «marcos.ruiz@empresa.com» hasta «2025-01-10» y el equipo «Portátil 07» prestado a «lucia.gomez@empresa.com» hasta «2030-06-15»
    Cuando el técnico de IT «it.soporte@empresa.com» pide los préstamos vencidos
    Entonces recibe 200 con «Monitor 03» primero y «Proyector 01» después, cada uno con id, nombre, persona y devolución, y sin «Portátil 07»

  @HU-SEG-01-2 @negativo
  Escenario: HU-SEG-01 criterio 2 (negativo)
    Dado el equipo «Portátil 07» reservado a «lucia.gomez@empresa.com» hasta «2025-01-10» y ningún equipo prestado
    Cuando el técnico de IT «it.soporte@empresa.com» pide los préstamos vencidos
    Entonces recibe 200 con una lista vacía
