# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it-2/backlog.json. No se edita a mano: se regenera.

@HU-SOL-01
Característica: Pedir un equipo libre
  Como empleado, quiero pedir un equipo libre indicando la fecha en que lo devolveré, para tenerlo reservado a mi nombre hasta que IT me lo entregue, sin esperar respuesta a un correo.

  @HU-SOL-01-1 @positivo
  Escenario: HU-SOL-01 criterio 1 (positivo)
    Dado el día 2026-11-10 en Madrid y el equipo «Portátil 07» disponible
    Cuando la empleada «ana.perez@empresa.com» envía POST /api/equipos/{id}/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «reservado», persona «ana.perez@empresa.com» y devolucion «2026-11-20»

  @HU-SOL-01-2 @negativo
  Escenario: HU-SOL-01 criterio 2 (negativo)
    Dado el equipo «Portátil 07» reservado a «luis.gomez@empresa.com»
    Cuando la empleada «ana.perez@empresa.com» envía la solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y la reserva sigue a nombre de «luis.gomez@empresa.com»

  @HU-SOL-01-3 @negativo
  Escenario: HU-SOL-01 criterio 3 (negativo)
    Dado ningún equipo con el id «no-existe»
    Cuando la empleada envía POST /api/equipos/no-existe/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 404 con {"error": "No existe el equipo"}
