# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-03
Característica: Evitar que un equipo se reserve o preste dos veces
  Como empleado, quiero que un equipo no quede reservado o prestado dos veces cuando llegan peticiones a la vez, para no acabar esperando un equipo que ya tiene otra persona.

  @HU-SOL-03-1 @positivo
  Escenario: HU-SOL-03 criterio 1 (positivo)
    Dado el equipo 42 disponible y dos solicitudes simultáneas de «ana.perez@empresa.com» y «luis.gomez@empresa.com» con {"devolucion": "2026-12-01"}
    Cuando llegan las dos a la vez
    Entonces una recibe 201 con el equipo reservado a su persona y la otra recibe 409 con {"error": "El equipo no está disponible"}

  @HU-SOL-03-2 @negativo
  Escenario: HU-SOL-03 criterio 2 (negativo)
    Dado el equipo 42 disponible, una solicitud de «ana.perez@empresa.com» y un préstamo en el mostrador para «luis.gomez@empresa.com», simultáneos
    Cuando llegan los dos a la vez
    Entonces solo uno sale bien, el otro recibe 409 con {"error": "El equipo no está disponible"} y el historial del equipo 42 tiene un único préstamo nuevo
