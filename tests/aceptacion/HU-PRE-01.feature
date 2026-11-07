# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it-2/backlog.json. No se edita a mano: se regenera.

@HU-PRE-01
Característica: Entregar un equipo reservado
  Como persona de IT, quiero apuntar la entrega de un equipo reservado, para que conste como prestado a quien lo pidió, con la fecha que indicó.

  @HU-PRE-01-1 @positivo
  Escenario: HU-PRE-01 criterio 1 (positivo)
    Dado el equipo «Portátil 07» reservado a «ana.perez@empresa.com» con devolucion «2026-11-20»
    Cuando la persona de IT «it@empresa.com» envía POST /api/equipos/{id}/entrega
    Entonces recibe 200 con el equipo en estado «prestado», persona «ana.perez@empresa.com» y devolucion «2026-11-20»

  @HU-PRE-01-2 @negativo
  Escenario: HU-PRE-01 criterio 2 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando la persona de IT envía POST /api/equipos/{id}/entrega
    Entonces recibe 409 con {"error": "El equipo no está reservado"} y el equipo sigue disponible

  @HU-PRE-01-3 @negativo
  Escenario: HU-PRE-01 criterio 3 (negativo)
    Dado ningún equipo con el id «no-existe»
    Cuando la persona de IT envía POST /api/equipos/no-existe/entrega
    Entonces recibe 404 con {"error": "No existe el equipo"}
