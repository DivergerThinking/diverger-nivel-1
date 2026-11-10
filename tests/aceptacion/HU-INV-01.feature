# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-INV-01
Característica: Dar de alta un equipo
  Como técnico de IT, quiero dar de alta un equipo con su nombre, para que los empleados lo vean disponible sin preguntar a IT.

  @HU-INV-01-1 @positivo
  Escenario: HU-INV-01 criterio 1 (positivo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada y ningún equipo llamado «Portátil 07»
    Cuando da de alta el equipo con {"nombre": "Portátil 07"}
    Entonces recibe 201 con {"id": "…", "nombre": "Portátil 07", "estado": "disponible"}

  @HU-INV-01-2 @negativo
  Escenario: HU-INV-01 criterio 2 (negativo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada
    Cuando da de alta un equipo con {"nombre": ""}
    Entonces recibe 400 con {"error": "Falta el nombre del equipo"} y no se crea ningún equipo

  @HU-INV-01-3 @negativo
  Escenario: HU-INV-01 criterio 3 (negativo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada y el equipo «Portátil 07» ya dado de alta
    Cuando da de alta un equipo con {"nombre": " portátil 07 "}
    Entonces recibe 409 con {"error": "Ya hay un equipo con ese nombre"} y sigue habiendo un solo «Portátil 07»

  @HU-INV-01-4 @negativo
  Escenario: HU-INV-01 criterio 4 (negativo)
    Dado la empleada «ana.perez@empresa.com», que no es de IT, con sesión iniciada
    Cuando da de alta un equipo con {"nombre": "Monitor 03"}
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y no se crea ningún equipo
