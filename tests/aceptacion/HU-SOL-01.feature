# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SOL-01
Característica: Pedir un equipo libre
  Como empleado, quiero pedir un equipo libre indicando la fecha en que lo devolveré, para tenerlo reservado a mi nombre hasta que IT me lo entregue, sin escribir correos.

  @HU-SOL-01-1 @positivo
  Escenario: HU-SOL-01 criterio 1 (positivo)
    Dado hoy es 2026-11-09 en Madrid y el equipo «eq-7» está disponible
    Cuando la empleada «ana.perez@empresa.com» envía POST /api/equipos/eq-7/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «reservado», persona «ana.perez@empresa.com» y devolución «2026-11-20»

  @HU-SOL-01-2 @positivo
  Escenario: HU-SOL-01 criterio 2 (positivo)
    Dado hoy es 2026-11-09 en Madrid y el equipo «eq-7» está disponible
    Cuando la empleada «ana.perez@empresa.com» envía POST /api/equipos/eq-7/solicitud con {"devolucion": "2026-11-09"}
    Entonces recibe 201 con el equipo en estado «reservado» y devolución «2026-11-09»

  @HU-SOL-01-3 @negativo
  Escenario: HU-SOL-01 criterio 3 (negativo)
    Dado hoy es 2026-11-09 en Madrid y el equipo «eq-7» está disponible
    Cuando un empleado envía POST /api/equipos/eq-7/solicitud con {"devolucion": "2026-11-08"}
    Entonces recibe 400 con {"error": "La fecha de devolución ya ha pasado"} y el equipo sigue disponible

  @HU-SOL-01-4 @negativo
  Escenario: HU-SOL-01 criterio 4 (negativo)
    Dado el equipo «eq-7» está disponible
    Cuando un empleado envía POST /api/equipos/eq-7/solicitud con {"devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"}

  @HU-SOL-01-5 @negativo
  Escenario: HU-SOL-01 criterio 5 (negativo)
    Dado el equipo «eq-7» está disponible
    Cuando un empleado envía POST /api/equipos/eq-7/solicitud con {}
    Entonces recibe 400 con {"error": "Falta la fecha de devolución"}

  @HU-SOL-01-6 @negativo
  Escenario: HU-SOL-01 criterio 6 (negativo)
    Dado el equipo «eq-7» está prestado
    Cuando un empleado envía POST /api/equipos/eq-7/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"}

  @HU-SOL-01-7 @negativo
  Escenario: HU-SOL-01 criterio 7 (negativo)
    Dado no existe ningún equipo «eq-99»
    Cuando un empleado envía POST /api/equipos/eq-99/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 404 con {"error": "No existe el equipo"}
