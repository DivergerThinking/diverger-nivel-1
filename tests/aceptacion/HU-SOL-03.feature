# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-03
Característica: Validar la fecha de devolución de una solicitud
  Como empleado, quiero indicar una fecha de devolución válida al pedir un equipo, para corregirla en el momento en lugar de dejar una reserva con una fecha imposible.

  @HU-SOL-03-1 @positivo
  Escenario: HU-SOL-03 criterio 1 (positivo)
    Dado el 11 de noviembre de 2026 en Madrid y el equipo «Portátil 07» disponible
    Cuando un empleado envía la solicitud con {"devolucion": "2026-11-11"}
    Entonces recibe 201 con el equipo reservado y devolución «2026-11-11», igual que la envió

  @HU-SOL-03-2 @negativo
  Escenario: HU-SOL-03 criterio 2 (negativo)
    Dado el 11 de noviembre de 2026 en Madrid
    Cuando un empleado envía la solicitud con {"devolucion": "2026-11-10"}
    Entonces recibe 400 con {"error": "La fecha de devolución ya ha pasado"} y el equipo sigue disponible

  @HU-SOL-03-3 @negativo
  Escenario: HU-SOL-03 criterio 3 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando un empleado envía la solicitud con {"devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-SOL-03-4 @negativo
  Escenario: HU-SOL-03 criterio 4 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando un empleado envía la solicitud con el cuerpo {}
    Entonces recibe 400 con {"error": "Falta la fecha de devolución"} y el equipo sigue disponible
