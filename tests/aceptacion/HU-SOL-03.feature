# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SOL-03
Característica: Evitar que un equipo se asigne dos veces
  Como empleado, quiero pedir un equipo disponible aunque otra persona lo pida a la vez, para saber en el momento si me lo he quedado, sin esperar un portátil que ya tiene otro compañero.

  @HU-SOL-03-1 @positivo
  Escenario: HU-SOL-03 criterio 1 (positivo)
    Dado el equipo «Portátil 07» disponible y dos empleados, «luis.gomez@empresa.com» y «ana.perez@empresa.com», con sesión iniciada
    Cuando los dos piden a la vez la solicitud de «Portátil 07» con {"devolucion": "2026-11-20"}
    Entonces una petición recibe 201 con el equipo reservado a su correo y la otra recibe 409 con {"error": "El equipo no está disponible"}

  @HU-SOL-03-2 @negativo
  Escenario: HU-SOL-03 criterio 2 (negativo)
    Dado el equipo «Portátil 07» disponible, el empleado «luis.gomez@empresa.com» y el técnico de IT «it.soporte@empresa.com» con sesión iniciada
    Cuando en el mismo instante el empleado pide POST /api/equipos/{id}/solicitud con {"devolucion": "2026-11-20"} y el técnico pide POST /api/equipos/{id}/prestamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces una petición recibe 201, la otra recibe 409 con {"error": "El equipo no está disponible"} y GET /api/equipos muestra «Portátil 07» con una sola «persona»
