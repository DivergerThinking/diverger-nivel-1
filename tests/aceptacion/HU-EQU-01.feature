# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it-2/backlog.json. No se edita a mano: se regenera.

@HU-EQU-01
Característica: Dar de alta un equipo
  Como persona de IT, quiero dar de alta un equipo con su nombre, para que los empleados lo encuentren disponible en la aplicación en lugar de en la hoja de cálculo.

  @HU-EQU-01-1 @positivo
  Escenario: HU-EQU-01 criterio 1 (positivo)
    Dado la persona de IT «it@empresa.com» y ningún equipo llamado «Portátil 07»
    Cuando envía POST /api/equipos con {"nombre": "Portátil 07"}
    Entonces recibe 201 con {"id": "…", "nombre": "Portátil 07", "estado": "disponible"}

  @HU-EQU-01-2 @negativo
  Escenario: HU-EQU-01 criterio 2 (negativo)
    Dado la persona de IT «it@empresa.com»
    Cuando envía POST /api/equipos con {"nombre": ""}
    Entonces recibe 400 con {"error": "Falta el nombre del equipo"} y no se crea ningún equipo

  @HU-EQU-01-3 @negativo
  Escenario: HU-EQU-01 criterio 3 (negativo)
    Dado la persona de IT «it@empresa.com»
    Cuando envía POST /api/equipos con el cuerpo {}
    Entonces recibe 400 con {"error": "Falta el nombre del equipo"} y no se crea ningún equipo

  @HU-EQU-01-4 @negativo
  Escenario: HU-EQU-01 criterio 4 (negativo)
    Dado la persona de IT «it@empresa.com» y el equipo «Portátil 07» ya dado de alta
    Cuando envía POST /api/equipos con {"nombre": "PORTÁTIL 07"}
    Entonces recibe 409 con {"error": "Ya hay un equipo con ese nombre"} y sigue habiendo un solo «Portátil 07»

  @HU-EQU-01-5 @negativo
  Escenario: HU-EQU-01 criterio 5 (negativo)
    Dado la persona de IT «it@empresa.com» y el equipo «Portátil 07» ya dado de alta
    Cuando envía POST /api/equipos con {"nombre": " portátil 07 "}
    Entonces recibe 409 con {"error": "Ya hay un equipo con ese nombre"} y sigue habiendo un solo «Portátil 07»
