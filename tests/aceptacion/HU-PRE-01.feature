# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-PRE-01
Característica: Entregar un equipo reservado
  Como técnico de IT, quiero entregar a un empleado el equipo que tiene reservado, para que el préstamo conste con la persona y la fecha que pidió sin volver a apuntarlas.

  @HU-PRE-01-1 @positivo
  Escenario: HU-PRE-01 criterio 1 (positivo)
    Dado «Portátil 07» reservado a «ana.perez@empresa.com» con devolución «2026-11-20»
    Cuando el técnico de IT envía POST /api/equipos/{id}/entrega
    Entonces recibe 200 con el equipo en estado «prestado», persona «ana.perez@empresa.com» y devolución «2026-11-20»

  @HU-PRE-01-2 @negativo
  Escenario: HU-PRE-01 criterio 2 (negativo)
    Dado «Portátil 07» disponible
    Cuando el técnico de IT envía POST /api/equipos/{id}/entrega
    Entonces recibe 409 con {"error": "El equipo no está reservado"} y el equipo sigue disponible

  @HU-PRE-01-3 @negativo
  Escenario: HU-PRE-01 criterio 3 (negativo)
    Dado no existe ningún equipo con el id «no-existe»
    Cuando el técnico de IT envía POST /api/equipos/no-existe/entrega
    Entonces recibe 404 con {"error": "No existe el equipo"}
