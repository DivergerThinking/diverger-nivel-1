# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-PRE-03
Característica: Apuntar la devolución de un equipo
  Como técnico de IT, quiero apuntar que un equipo prestado se ha devuelto, para que vuelva a aparecer libre para el siguiente empleado.

  @HU-PRE-03-1 @positivo
  Escenario: HU-PRE-03 criterio 1 (positivo)
    Dado «Monitor 03» prestado a «ana.perez@empresa.com» con devolución «2026-11-20»
    Cuando el técnico de IT envía POST /api/equipos/{id}/devolucion
    Entonces recibe 200 con el equipo en estado «disponible», sin persona ni devolución

  @HU-PRE-03-2 @negativo
  Escenario: HU-PRE-03 criterio 2 (negativo)
    Dado «Monitor 03» disponible
    Cuando el técnico de IT envía POST /api/equipos/{id}/devolucion
    Entonces recibe 409 con {"error": "El equipo no está prestado"}

  @HU-PRE-03-3 @negativo
  Escenario: HU-PRE-03 criterio 3 (negativo)
    Dado no existe ningún equipo con el id «no-existe»
    Cuando el técnico de IT envía POST /api/equipos/no-existe/devolucion
    Entonces recibe 404 con {"error": "No existe el equipo"}
