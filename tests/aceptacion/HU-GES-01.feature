# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-GES-01
Característica: Dar de alta un equipo
  Como técnico de IT, quiero dar de alta un equipo con su nombre, para que los empleados lo vean y lo puedan pedir sin consultar la hoja de cálculo.

  @HU-GES-01-1 @positivo
  Escenario: HU-GES-01 criterio 1 (positivo)
    Dado un técnico de IT y ningún equipo llamado «Portátil 07»
    Cuando envía POST /api/equipos con {"nombre": "Portátil 07"}
    Entonces recibe 201 con id, nombre «Portátil 07» y estado «disponible»

  @HU-GES-01-2 @negativo
  Escenario: HU-GES-01 criterio 2 (negativo)
    Dado un técnico de IT y el equipo «Portátil 07» ya dado de alta
    Cuando envía POST /api/equipos con {"nombre": " portátil 07 "}
    Entonces la respuesta es 409 con {"error": "Ya hay un equipo con ese nombre"} y no se crea otro equipo

  @HU-GES-01-3 @negativo
  Escenario: HU-GES-01 criterio 3 (negativo)
    Dado un técnico de IT
    Cuando envía POST /api/equipos con {"nombre": ""}
    Entonces la respuesta es 400 con {"error": "Falta el nombre del equipo"}
