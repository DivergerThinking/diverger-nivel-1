# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-01
Característica: Pedir un equipo libre
  Como empleado, quiero pedir un equipo disponible indicando la fecha en que lo devolveré, para tenerlo reservado a mi nombre sin escribir a IT.

  @HU-PRE-01-1 @positivo
  Escenario: HU-PRE-01 criterio 1 (positivo)
    Dado el «Portátil 07» disponible y la empleada ana.perez@empresa.com
    Cuando envía POST /api/equipos/{id}/solicitud con {"devolucion": "2026-12-10"}
    Entonces recibe 201 con el estado «reservado», la persona ana.perez@empresa.com y la devolución 2026-12-10

  @HU-PRE-01-2 @negativo
  Escenario: HU-PRE-01 criterio 2 (negativo)
    Dado hoy es 2026-12-03 en Madrid
    Cuando un empleado envía POST /api/equipos/{id}/solicitud con {"devolucion": "2026-12-02"}
    Entonces recibe 400 con {"error": "La fecha de devolución ya ha pasado"}

  @HU-PRE-01-3 @negativo
  Escenario: HU-PRE-01 criterio 3 (negativo)
    Dado el «Portátil 07» disponible
    Cuando un empleado envía POST /api/equipos/{id}/solicitud con {"devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"}

  @HU-PRE-01-4 @negativo
  Escenario: HU-PRE-01 criterio 4 (negativo)
    Dado el «Portátil 07» disponible y dos empleados que envían su solicitud en el mismo instante
    Cuando llegan las dos peticiones POST /api/equipos/{id}/solicitud
    Entonces una recibe 201 y la otra 409 con {"error": "El equipo no está disponible"}
