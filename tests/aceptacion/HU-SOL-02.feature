# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SOL-02
Característica: Pedir un equipo libre
  Como empleado, quiero pedir un equipo disponible indicando la fecha de devolución, para tenerlo reservado a mi nombre hasta que IT me lo entregue, sin escribir un correo.

  @HU-SOL-02-1 @positivo
  Escenario: HU-SOL-02 criterio 1 (positivo)
    Dado un empleado con sesión iniciada como «luis.gomez@empresa.com», hoy 10/11/2026 en Madrid y el equipo «Portátil 07» disponible
    Cuando pide POST /api/equipos/{id}/solicitud de «Portátil 07» con {"devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «reservado», «persona» «luis.gomez@empresa.com» y «devolucion» «2026-11-20»

  @HU-SOL-02-2 @negativo
  Escenario: HU-SOL-02 criterio 2 (negativo)
    Dado un empleado con sesión iniciada, hoy 10/11/2026 en Madrid y el equipo «Portátil 07» disponible
    Cuando pide la solicitud de «Portátil 07» con {"devolucion": "2026-11-09"}
    Entonces recibe 400 con {"error": "La fecha de devolución ya ha pasado"} y el equipo sigue disponible

  @HU-SOL-02-3 @negativo
  Escenario: HU-SOL-02 criterio 3 (negativo)
    Dado un empleado con sesión iniciada y el equipo «Portátil 07» disponible
    Cuando pide la solicitud de «Portátil 07» con {"devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-SOL-02-4 @negativo
  Escenario: HU-SOL-02 criterio 4 (negativo)
    Dado un empleado con sesión iniciada y el equipo «Portátil 07» disponible
    Cuando pide la solicitud de «Portátil 07» con el cuerpo {}
    Entonces recibe 400 con {"error": "Falta la fecha de devolución"} y el equipo sigue disponible

  @HU-SOL-02-5 @negativo
  Escenario: HU-SOL-02 criterio 5 (negativo)
    Dado un empleado con sesión iniciada y el equipo «Proyector 02» prestado a «ana.perez@empresa.com»
    Cuando pide la solicitud de «Proyector 02» con {"devolucion": "2026-11-20"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y el préstamo de «ana.perez@empresa.com» no cambia

  @HU-SOL-02-6 @negativo
  Escenario: HU-SOL-02 criterio 6 (negativo)
    Dado un empleado con sesión iniciada y ningún equipo con el id «no-existe»
    Cuando pide POST /api/equipos/no-existe/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 404 con {"error": "No existe el equipo"}
