# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SOL-01
Característica: Pedir un equipo disponible
  Como empleado, quiero pedir un equipo libre indicando la fecha de devolución, para tenerlo apartado a mi nombre hasta que IT me lo entregue, sin pedirlo por correo.

  @HU-SOL-01-1 @positivo
  Escenario: HU-SOL-01 criterio 1 (positivo)
    Dado hoy es 10/11/2026 en Madrid, «Portátil 07» está disponible y la empleada «ana.perez@empresa.com» tiene la sesión iniciada
    Cuando envía POST /api/equipos/{id}/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «reservado», persona «ana.perez@empresa.com» y devolución «2026-11-20»

  @HU-SOL-01-2 @negativo
  Escenario: HU-SOL-01 criterio 2 (negativo)
    Dado hoy es 10/11/2026 en Madrid y «Portátil 07» está disponible
    Cuando la empleada pide el equipo con {"devolucion": "2026-11-09"}
    Entonces recibe 400 con {"error": "La fecha de devolución ya ha pasado"} y el equipo sigue disponible

  @HU-SOL-01-3 @negativo
  Escenario: HU-SOL-01 criterio 3 (negativo)
    Dado «Portátil 07» está disponible
    Cuando la empleada pide el equipo con {"devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-SOL-01-4 @negativo
  Escenario: HU-SOL-01 criterio 4 (negativo)
    Dado «Portátil 07» está disponible
    Cuando la empleada pide el equipo con {"devolucion": "20/11/2026"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-SOL-01-5 @negativo
  Escenario: HU-SOL-01 criterio 5 (negativo)
    Dado «Portátil 07» está disponible
    Cuando la empleada pide el equipo sin fecha de devolución
    Entonces recibe 400 con {"error": "Falta la fecha de devolución"}

  @HU-SOL-01-6 @negativo
  Escenario: HU-SOL-01 criterio 6 (negativo)
    Dado «Portátil 07» está reservado a «luis.gomez@empresa.com»
    Cuando la empleada pide el equipo con {"devolucion": "2026-11-20"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y la reserva de «luis.gomez@empresa.com» no cambia

  @HU-SOL-01-7 @negativo
  Escenario: HU-SOL-01 criterio 7 (negativo)
    Dado no existe ningún equipo con el id «no-existe»
    Cuando la empleada envía POST /api/equipos/no-existe/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 404 con {"error": "No existe el equipo"}
