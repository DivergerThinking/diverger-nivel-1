# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-GES-04
Característica: Apuntar la devolución de un equipo
  Como técnico de IT, quiero apuntar que un empleado ha devuelto el equipo, para que vuelva a estar libre para el siguiente que lo necesite.

  @HU-GES-04-1 @positivo
  Escenario: HU-GES-04 criterio 1 (positivo)
    Dado el equipo 42 prestado a «luis.gomez@empresa.com» con devolucion «2026-12-01»
    Cuando un técnico de IT envía POST /api/equipos/42/devolucion
    Entonces recibe 200 con el equipo en estado «disponible», sin persona ni devolucion

  @HU-GES-04-2 @negativo
  Escenario: HU-GES-04 criterio 2 (negativo)
    Dado el equipo 42 reservado a «ana.perez@empresa.com»
    Cuando un técnico de IT envía POST /api/equipos/42/devolucion
    Entonces la respuesta es 409 con {"error": "El equipo no está prestado"} y el equipo sigue reservado

  @HU-GES-04-3 @negativo
  Escenario: HU-GES-04 criterio 3 (negativo)
    Dado no existe el equipo 999
    Cuando un técnico de IT envía POST /api/equipos/999/devolucion
    Entonces la respuesta es 404 con {"error": "No existe el equipo"}
