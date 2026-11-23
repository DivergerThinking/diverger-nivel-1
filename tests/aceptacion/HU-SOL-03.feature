# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-03
Característica: Pedir un equipo sin que se reserve dos veces
  Como empleado, quiero pedir un equipo libre aunque otra persona lo pida a la vez, para no esperar un portátil que ya tiene otra persona.

  @HU-SOL-03-1 @positivo
  Escenario: HU-SOL-03 criterio 1 (positivo)
    Dado el «Portátil 07» disponible
    Cuando «ana.perez@empresa.com» y «luis.garcia@empresa.com» lo piden en el mismo instante con devolución «2026-12-15»
    Entonces una petición recibe 201 con el equipo reservado a su nombre, la otra recibe 409 con {"error": "El equipo no está disponible"} y el equipo queda reservado a nombre de una sola persona

  @HU-SOL-03-2 @negativo
  Escenario: HU-SOL-03 criterio 2 (negativo)
    Dado el «Monitor 03» disponible
    Cuando «ana.perez@empresa.com» lo pide y, en el mismo instante, un técnico de IT lo presta en el mostrador a «luis.garcia@empresa.com»
    Entonces solo una de las dos operaciones sale bien, la otra recibe 409 con {"error": "El equipo no está disponible"} y el equipo queda a nombre de una sola persona

  @HU-SOL-03-3 @negativo
  Escenario: HU-SOL-03 criterio 3 (negativo)
    Dado el «Proyector 01» disponible
    Cuando llegan 20 peticiones simultáneas de 20 empleados distintos para pedirlo
    Entonces exactamente una recibe 201 y las otras 19 reciben 409 con {"error": "El equipo no está disponible"}
