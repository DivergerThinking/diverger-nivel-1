# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-03
Característica: Evitar que dos peticiones a la vez se queden el mismo equipo
  Como empleado, quiero pedir un equipo libre sabiendo que, si otra persona lo pide a la vez, solo una petición lo reserva, para no ir a recoger un equipo que ya tiene otra persona.

  @HU-SOL-03-1 @negativo
  Escenario: HU-SOL-03 criterio 1 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando «ana.perez@empresa.com» y «luis.gomez@empresa.com» envían a la vez POST /api/equipos/{id}/solicitud con {"devolucion": "2026-11-20"}
    Entonces una petición recibe 201 con el equipo reservado a nombre de quien la envía, la otra recibe 409 con {"error": "El equipo no está disponible"} y la persona del equipo sigue siendo la de la petición que sale bien

  @HU-SOL-03-2 @positivo
  Escenario: HU-SOL-03 criterio 2 (positivo)
    Dado el equipo «Proyector 01» disponible
    Cuando «ana.perez@empresa.com» envía la solicitud y la cuenta de IT «it@empresa.com» envía a la vez POST /api/equipos/{id}/prestamo para «luis.gomez@empresa.com»
    Entonces solo una de las dos peticiones sale bien, la otra recibe 409 con {"error": "El equipo no está disponible"} y el equipo queda a nombre de una sola persona
