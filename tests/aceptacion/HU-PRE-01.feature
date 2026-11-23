# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-01
Característica: Entregar un equipo reservado
  Como técnico de IT, quiero apuntar que entrego un equipo reservado a quien lo pidió, para que conste quién tiene el equipo desde que sale de IT.

  @HU-PRE-01-1 @positivo
  Escenario: HU-PRE-01 criterio 1 (positivo)
    Dado el «Portátil 07» reservado por «ana.perez@empresa.com» con devolución «2026-12-15»
    Cuando un técnico de IT lo entrega
    Entonces recibe 200 con el «Portátil 07» en estado «prestado», persona «ana.perez@empresa.com» y devolución «2026-12-15»

  @HU-PRE-01-2 @negativo
  Escenario: HU-PRE-01 criterio 2 (negativo)
    Dado el «Monitor 03» disponible
    Cuando un técnico de IT lo entrega
    Entonces recibe 409 con {"error": "El equipo no está reservado"} y el equipo sigue disponible

  @HU-PRE-01-3 @negativo
  Escenario: HU-PRE-01 criterio 3 (negativo)
    Dado un técnico de IT
    Cuando entrega un equipo con un id que no existe
    Entonces recibe 404 con {"error": "No existe el equipo"}
