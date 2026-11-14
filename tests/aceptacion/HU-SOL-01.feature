# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-01
Característica: Pedir un equipo libre
  Como empleado, quiero pedir un equipo libre indicando la fecha en que lo devolveré, para tenerlo apartado a mi nombre sin escribir a IT ni esperar a que me contesten.

  @HU-SOL-01-1 @positivo
  Escenario: HU-SOL-01 criterio 1 (positivo)
    Dado hoy es el 14 de noviembre de 2026 en Madrid y el equipo «Portátil 07» está disponible
    Cuando la empleada «ana.perez@empresa.com» envía POST /api/equipos/{id}/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «reservado», persona «ana.perez@empresa.com» y devolución «2026-11-20»

  @HU-SOL-01-2 @negativo
  Escenario: HU-SOL-01 criterio 2 (negativo)
    Dado hoy es el 14 de noviembre de 2026 en Madrid y el equipo «Portátil 07» está disponible
    Cuando la empleada «ana.perez@empresa.com» envía la solicitud con {"devolucion": "2026-11-13"}
    Entonces recibe 400 con {"error": "La fecha de devolución ya ha pasado"} y el equipo sigue disponible

  @HU-SOL-01-3 @negativo
  Escenario: HU-SOL-01 criterio 3 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando la empleada «ana.perez@empresa.com» envía la solicitud con {"devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"}

  @HU-SOL-01-4 @negativo
  Escenario: HU-SOL-01 criterio 4 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando la empleada «ana.perez@empresa.com» envía la solicitud con {}
    Entonces recibe 400 con {"error": "Falta la fecha de devolución"}

  @HU-SOL-01-5 @negativo
  Escenario: HU-SOL-01 criterio 5 (negativo)
    Dado el equipo «Monitor 03» reservado por «luis.gomez@empresa.com»
    Cuando la empleada «ana.perez@empresa.com» envía la solicitud de «Monitor 03» con {"devolucion": "2026-11-20"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y la reserva sigue a nombre de «luis.gomez@empresa.com»

  @HU-SOL-01-6 @negativo
  Escenario: HU-SOL-01 criterio 6 (negativo)
    Dado ningún equipo con el id «no-existe»
    Cuando la empleada «ana.perez@empresa.com» envía POST /api/equipos/no-existe/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 404 con {"error": "No existe el equipo"}
