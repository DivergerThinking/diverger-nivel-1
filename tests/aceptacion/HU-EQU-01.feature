# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-EQU-01
Característica: Dar de alta un equipo
  Como técnico de IT, quiero dar de alta un equipo con su nombre, para que los empleados lo vean disponible y lo puedan pedir.

  @HU-EQU-01-1 @positivo
  Escenario: HU-EQU-01 criterio 1 (positivo)
    Dado un técnico de IT y ningún equipo llamado «Portátil 07»
    Cuando envía POST /api/equipos con {"nombre": "Portátil 07"}
    Entonces recibe 201 con el id, el nombre «Portátil 07» y el estado «disponible»

  @HU-EQU-01-2 @negativo
  Escenario: HU-EQU-01 criterio 2 (negativo)
    Dado un técnico de IT
    Cuando envía POST /api/equipos con {"nombre": ""}
    Entonces recibe 400 con {"error": "Falta el nombre del equipo"}

  @HU-EQU-01-3 @negativo
  Escenario: HU-EQU-01 criterio 3 (negativo)
    Dado un técnico de IT y el equipo «Portátil 07» ya dado de alta
    Cuando envía POST /api/equipos con {"nombre": " portátil 07 "}
    Entonces recibe 409 con {"error": "Ya hay un equipo con ese nombre"}
