# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-EQU-01
Característica: Dar de alta un equipo
  Como técnico de IT, quiero dar de alta un equipo con su nombre, para que los empleados lo vean y puedan pedirlo en lugar de consultar la hoja de cálculo.

  @HU-EQU-01-1 @positivo
  Escenario: HU-EQU-01 criterio 1 (positivo)
    Dado un técnico de IT con sesión iniciada y ningún equipo llamado «Portátil 07»
    Cuando da de alta el equipo con {"nombre": "Portátil 07"}
    Entonces recibe 201 con el id generado, el nombre «Portátil 07» y el estado «disponible»

  @HU-EQU-01-2 @negativo
  Escenario: HU-EQU-01 criterio 2 (negativo)
    Dado un técnico de IT con sesión iniciada
    Cuando da de alta un equipo con {"nombre": ""}
    Entonces recibe 400 con {"error": "Falta el nombre del equipo"} y no se crea ningún equipo

  @HU-EQU-01-3 @negativo
  Escenario: HU-EQU-01 criterio 3 (negativo)
    Dado el equipo «Portátil 07» ya dado de alta
    Cuando un técnico de IT da de alta un equipo con {"nombre": " portátil 07 "}
    Entonces recibe 409 con {"error": "Ya hay un equipo con ese nombre"} y sigue habiendo un solo «Portátil 07»
