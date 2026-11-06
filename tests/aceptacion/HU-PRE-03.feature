# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-03
Característica: Entregar un equipo reservado
  Como técnico de IT, quiero apuntar la entrega de un equipo reservado, para que conste como prestado a quien lo pidió, con su fecha de devolución, sin volver a escribirla.

  @HU-PRE-03-1 @positivo
  Escenario: HU-PRE-03 criterio 1 (positivo)
    Dado «Portátil 07» reservado a «luis.garcia@empresa.com» con devolución «2026-11-20»
    Cuando un técnico de IT apunta la entrega con POST /api/equipos/{id}/entrega
    Entonces recibe 200 con «Portátil 07» en estado «prestado», persona «luis.garcia@empresa.com» y devolución «2026-11-20»

  @HU-PRE-03-2 @negativo
  Escenario: HU-PRE-03 criterio 2 (negativo)
    Dado «Monitor 03» disponible
    Cuando un técnico de IT apunta su entrega
    Entonces recibe 409 con {"error": "El equipo no está reservado"} y el equipo sigue disponible

  @HU-PRE-03-3 @negativo
  Escenario: HU-PRE-03 criterio 3 (negativo)
    Dado ningún equipo con el id indicado
    Cuando un técnico de IT apunta su entrega
    Entonces recibe 404 con {"error": "No existe el equipo"}
