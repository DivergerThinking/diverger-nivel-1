# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-PRE-01
Característica: Entregar un equipo reservado
  Como técnico de IT, quiero entregar al empleado el equipo que tiene reservado, para que el préstamo conste con la misma persona y fecha que pidió.

  @HU-PRE-01-1 @positivo
  Escenario: HU-PRE-01 criterio 1 (positivo)
    Dado el equipo «Portátil 07» reservado a «lucia.gomez@empresa.com» con la devolución «2030-06-15»
    Cuando el técnico de IT «it.soporte@empresa.com» lo entrega
    Entonces recibe 200 con el equipo en estado «prestado», la persona «lucia.gomez@empresa.com» y la devolución «2030-06-15»

  @HU-PRE-01-2 @negativo
  Escenario: HU-PRE-01 criterio 2 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando el técnico de IT «it.soporte@empresa.com» lo entrega
    Entonces recibe 409 con {"error": "El equipo no está reservado"} y el equipo sigue disponible

  @HU-PRE-01-3 @negativo
  Escenario: HU-PRE-01 criterio 3 (negativo)
    Dado ningún equipo con el id «no-existe»
    Cuando el técnico de IT «it.soporte@empresa.com» entrega el equipo «no-existe»
    Entonces recibe 404 con {"error": "No existe el equipo"}
