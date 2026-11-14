# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-03
Característica: Validar la fecha de devolución de una solicitud
  Como empleado, quiero pedir un equipo con una fecha de devolución de hoy en adelante, para saber en el momento si la fecha que he puesto no sirve, sin esperar a que IT me lo diga.

  @HU-SOL-03-1 @positivo
  Escenario: HU-SOL-03 criterio 1 (positivo)
    Dado el equipo «Portátil 07» disponible, el 14 de noviembre de 2026 en Madrid
    Cuando la empleada ana.perez@empresa.com lo pide con devolución «2026-11-14»
    Entonces recibe 201 con «Portátil 07» reservado a «ana.perez@empresa.com» con devolución «2026-11-14»

  @HU-SOL-03-2 @negativo
  Escenario: HU-SOL-03 criterio 2 (negativo)
    Dado el equipo «Portátil 07» disponible, el 14 de noviembre de 2026 en Madrid
    Cuando la empleada ana.perez@empresa.com lo pide con devolución «2026-11-13»
    Entonces recibe 400 con el error «La fecha de devolución ya ha pasado» y «Portátil 07» sigue disponible

  @HU-SOL-03-3 @negativo
  Escenario: HU-SOL-03 criterio 3 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando la empleada ana.perez@empresa.com lo pide con devolución «2026-02-30»
    Entonces recibe 400 con el error «La fecha de devolución no es válida» y «Portátil 07» sigue disponible

  @HU-SOL-03-4 @negativo
  Escenario: HU-SOL-03 criterio 4 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando la empleada ana.perez@empresa.com lo pide sin fecha de devolución
    Entonces recibe 400 con el error «Falta la fecha de devolución» y «Portátil 07» sigue disponible
