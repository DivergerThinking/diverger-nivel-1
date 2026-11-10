# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-PRE-04
Característica: Apuntar la devolución de un equipo
  Como técnico de IT, quiero apuntar que un empleado ha devuelto el equipo prestado, para que otro empleado pueda pedirlo en cuanto vuelve.

  @HU-PRE-04-1 @positivo
  Escenario: HU-PRE-04 criterio 1 (positivo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada y «Monitor 03» prestado a «ana.perez@empresa.com» con devolución «2026-11-20»
    Cuando apunta la devolución de «Monitor 03» con POST /api/equipos/{id}/devolucion
    Entonces recibe 200 con el equipo en estado «disponible», sin persona ni devolución

  @HU-PRE-04-2 @negativo
  Escenario: HU-PRE-04 criterio 2 (negativo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada y «Portátil 07» reservado a «luis.gomez@empresa.com»
    Cuando apunta la devolución de «Portátil 07»
    Entonces recibe 409 con {"error": "El equipo no está prestado"} y la reserva no cambia

  @HU-PRE-04-3 @negativo
  Escenario: HU-PRE-04 criterio 3 (negativo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada y ningún equipo con el id «no-existe»
    Cuando apunta la devolución del equipo «no-existe»
    Entonces recibe 404 con {"error": "No existe el equipo"}

  @HU-PRE-04-4 @negativo
  Escenario: HU-PRE-04 criterio 4 (negativo)
    Dado la empleada «ana.perez@empresa.com», que no es de IT, con «Monitor 03» prestado a su nombre
    Cuando apunta la devolución de «Monitor 03»
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y el equipo sigue prestado
