# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-EQU-01
Característica: Dar de alta un equipo
  Como técnico de IT, quiero dar de alta un equipo con su nombre, para que los empleados puedan pedirlo sin escribir a IT.

  @HU-EQU-01-1 @positivo
  Escenario: HU-EQU-01 criterio 1 (positivo)
    Dado el técnico de IT «it.soporte@empresa.com» y ningún equipo llamado «Portátil 07»
    Cuando da de alta el equipo con el nombre «Portátil 07»
    Entonces recibe 201 con el id del equipo, el nombre «Portátil 07» y el estado «disponible»

  @HU-EQU-01-2 @negativo
  Escenario: HU-EQU-01 criterio 2 (negativo)
    Dado el técnico de IT «it.soporte@empresa.com»
    Cuando da de alta un equipo con el nombre vacío
    Entonces recibe 400 con {"error": "Falta el nombre del equipo"} y no se crea ningún equipo

  @HU-EQU-01-3 @negativo
  Escenario: HU-EQU-01 criterio 3 (negativo)
    Dado el técnico de IT «it.soporte@empresa.com» y el equipo «Portátil 07» ya dado de alta
    Cuando da de alta un equipo con el nombre « portátil 07 »
    Entonces recibe 409 con {"error": "Ya hay un equipo con ese nombre"} y no se crea otro equipo
