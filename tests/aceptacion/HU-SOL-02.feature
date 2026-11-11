# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-02
Característica: Pedir un equipo disponible
  Como empleado, quiero pedir un equipo disponible indicando la fecha de devolución, para tenerlo reservado a mi nombre sin escribir a IT ni competir con otra persona por el mismo equipo.

  @HU-SOL-02-1 @positivo
  Escenario: HU-SOL-02 criterio 1 (positivo)
    Dado un empleado con sesión iniciada como «ana.perez@empresa.com» y el equipo «Portátil 07» disponible
    Cuando envía POST /api/equipos/{id}/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «reservado», persona «ana.perez@empresa.com» y devolución «2026-11-20», y la lista de equipos lo muestra así

  @HU-SOL-02-2 @negativo
  Escenario: HU-SOL-02 criterio 2 (negativo)
    Dado el equipo «Portátil 07» reservado a «luis.gomez@empresa.com»
    Cuando «ana.perez@empresa.com» envía POST /api/equipos/{id}/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y el equipo sigue reservado a «luis.gomez@empresa.com»

  @HU-SOL-02-3 @negativo
  Escenario: HU-SOL-02 criterio 3 (negativo)
    Dado el equipo «Portátil 07» disponible y dos solicitudes simultáneas de «ana.perez@empresa.com» y «luis.gomez@empresa.com»
    Cuando llegan las dos a POST /api/equipos/{id}/solicitud a la vez
    Entonces una recibe 201 y la otra recibe 409 con {"error": "El equipo no está disponible"}, y el equipo queda reservado a una sola persona

  @HU-SOL-02-4 @negativo
  Escenario: HU-SOL-02 criterio 4 (negativo)
    Dado un identificador de equipo que no existe
    Cuando un empleado envía POST /api/equipos/{id}/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 404 con {"error": "No existe el equipo"}
