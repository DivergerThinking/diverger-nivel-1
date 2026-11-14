# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-INV-01
Característica: Dar de alta un equipo
  Como técnico de IT, quiero dar de alta un equipo con su nombre, para que los empleados puedan verlo y pedirlo sin escribir a IT.

  @HU-INV-01-1 @positivo
  Escenario: HU-INV-01 criterio 1 (positivo)
    Dado la cuenta de IT «it@empresa.com» y ningún equipo llamado «Portátil 07»
    Cuando envía POST /api/equipos con {"nombre": "Portátil 07"}
    Entonces recibe 201 con {"id": "…", "nombre": "Portátil 07", "estado": "disponible"}

  @HU-INV-01-2 @negativo
  Escenario: HU-INV-01 criterio 2 (negativo)
    Dado la cuenta de IT «it@empresa.com»
    Cuando envía POST /api/equipos con {"nombre": ""}
    Entonces recibe 400 con {"error": "Falta el nombre del equipo"}

  @HU-INV-01-3 @negativo
  Escenario: HU-INV-01 criterio 3 (negativo)
    Dado la cuenta de IT «it@empresa.com» y el equipo «Portátil 07» ya dado de alta
    Cuando envía POST /api/equipos con {"nombre": " portátil 07 "}
    Entonces recibe 409 con {"error": "Ya hay un equipo con ese nombre"}
