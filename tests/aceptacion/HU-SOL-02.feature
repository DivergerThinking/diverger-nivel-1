# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it-2/backlog.json. No se edita a mano: se regenera.

@HU-SOL-02
Característica: Validar la fecha de devolución de una solicitud
  Como empleado, quiero indicar en mi solicitud una fecha de devolución de hoy en adelante, para que ninguna reserva nazca ya vencida por un error al escribir la fecha.

  @HU-SOL-02-1 @positivo
  Escenario: HU-SOL-02 criterio 1 (positivo)
    Dado el día 2026-11-10 en Madrid y el equipo «Portátil 07» disponible
    Cuando la empleada «ana.perez@empresa.com» envía POST /api/equipos/{id}/solicitud con {"devolucion": "2026-11-10"}
    Entonces recibe 201 con el equipo en estado «reservado» y devolucion «2026-11-10»

  @HU-SOL-02-2 @negativo
  Escenario: HU-SOL-02 criterio 2 (negativo)
    Dado el día 2026-11-10 en Madrid y el equipo «Portátil 07» disponible
    Cuando la empleada envía la solicitud con {"devolucion": "2026-11-09"}
    Entonces recibe 400 con {"error": "La fecha de devolución ya ha pasado"} y el equipo sigue disponible

  @HU-SOL-02-3 @negativo
  Escenario: HU-SOL-02 criterio 3 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando la empleada envía la solicitud con {"devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-SOL-02-4 @negativo
  Escenario: HU-SOL-02 criterio 4 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando la empleada envía la solicitud con el cuerpo {}
    Entonces recibe 400 con {"error": "Falta la fecha de devolución"} y el equipo sigue disponible
