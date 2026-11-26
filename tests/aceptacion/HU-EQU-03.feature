# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-EQU-03
Característica: Consultar el historial de un equipo
  Como técnico de IT, quiero consultar el historial de préstamos de un equipo, para saber quién lo tuvo cuando aparece dañado o se echa en falta.

  @HU-EQU-03-1 @positivo
  Escenario: HU-EQU-03 criterio 1 (positivo)
    Dado el «Portátil 07» devuelto por ana.perez@empresa.com con devolución 2026-12-01 y prestado después a luis.gomez@empresa.com hasta el 2026-12-15
    Cuando un técnico de IT consulta GET /api/equipos/{id}/historial
    Entonces recibe 200 con primero el préstamo de luis.gomez@empresa.com en estado «prestado» y después el de ana.perez@empresa.com en estado «devuelto»

  @HU-EQU-03-2 @negativo
  Escenario: HU-EQU-03 criterio 2 (negativo)
    Dado un id que no corresponde a ningún equipo
    Cuando un técnico de IT consulta GET /api/equipos/{id}/historial
    Entonces recibe 404 con {"error": "No existe el equipo"}
