# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-GES-04
Característica: Apuntar la devolución de un equipo
  Como técnico de IT, quiero apuntar la devolución de un equipo prestado, para que vuelva a estar disponible para el siguiente empleado.

  @HU-GES-04-1 @positivo
  Escenario: HU-GES-04 criterio 1 (positivo)
    Dado un técnico de IT con sesión iniciada y el equipo «Monitor 03» prestado a «ana.perez@empresa.com» con devolución «2026-11-20»
    Cuando pide POST /api/equipos/{id}/devolucion de «Monitor 03»
    Entonces recibe 200 con el equipo en estado «disponible», sin «persona» ni «devolucion»

  @HU-GES-04-2 @negativo
  Escenario: HU-GES-04 criterio 2 (negativo)
    Dado un técnico de IT con sesión iniciada y el equipo «Portátil 07» reservado a «luis.gomez@empresa.com»
    Cuando pide la devolución de «Portátil 07»
    Entonces recibe 409 con {"error": "El equipo no está prestado"} y la reserva no cambia

  @HU-GES-04-3 @negativo
  Escenario: HU-GES-04 criterio 3 (negativo)
    Dado un técnico de IT con sesión iniciada y ningún equipo con el id «no-existe»
    Cuando pide POST /api/equipos/no-existe/devolucion
    Entonces recibe 404 con {"error": "No existe el equipo"}
