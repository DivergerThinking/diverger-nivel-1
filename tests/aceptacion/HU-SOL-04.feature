# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-04
Característica: Pedir un equipo con una fecha de devolución válida
  Como empleado, quiero saber al pedir un equipo si la fecha de devolución que pongo no vale, para corregirla en el momento en lugar de reservar un equipo con una fecha imposible.

  @HU-SOL-04-1 @positivo
  Escenario: HU-SOL-04 criterio 1 (positivo)
    Dado el 23 de noviembre de 2026 en Madrid y el «Portátil 07» disponible
    Cuando el empleado «ana.perez@empresa.com» lo pide con devolución «2026-11-23»
    Entonces recibe 201 con el «Portátil 07» en estado «reservado» y devolución «2026-11-23», porque hoy no es una fecha pasada

  @HU-SOL-04-2 @negativo
  Escenario: HU-SOL-04 criterio 2 (negativo)
    Dado el «Portátil 07» disponible
    Cuando un empleado lo pide sin fecha de devolución
    Entonces recibe 400 con {"error": "Falta la fecha de devolución"} y el equipo sigue disponible

  @HU-SOL-04-3 @negativo
  Escenario: HU-SOL-04 criterio 3 (negativo)
    Dado el «Portátil 07» disponible
    Cuando un empleado lo pide con devolución «2026-02-30»
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-SOL-04-4 @negativo
  Escenario: HU-SOL-04 criterio 4 (negativo)
    Dado las 00:30 del 24 de noviembre de 2026 en Madrid, que aún son las 23:30 del 23 de noviembre en UTC, y el «Portátil 07» disponible
    Cuando un empleado lo pide con devolución «2026-11-23»
    Entonces recibe 400 con {"error": "La fecha de devolución ya ha pasado"} porque «hoy» es el día en Madrid
