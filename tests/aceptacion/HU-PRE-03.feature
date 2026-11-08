# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-PRE-03
Característica: Apuntar la devolución de un equipo
  Como técnico de IT, quiero apuntar que un equipo prestado se ha devuelto, para que vuelva a estar libre para el siguiente empleado.

  @HU-PRE-03-1 @positivo
  Escenario: HU-PRE-03 criterio 1 (positivo)
    Dado el equipo «eq-7» prestado a «ana.perez@empresa.com» hasta el 2026-11-20
    Cuando un técnico de IT envía POST /api/equipos/eq-7/devolucion
    Entonces recibe 200 con el equipo en estado «disponible», sin persona ni devolución

  @HU-PRE-03-2 @negativo
  Escenario: HU-PRE-03 criterio 2 (negativo)
    Dado el equipo «eq-7» reservado por «ana.perez@empresa.com»
    Cuando un técnico de IT envía POST /api/equipos/eq-7/devolucion
    Entonces recibe 409 con {"error": "El equipo no está prestado"} y el equipo sigue reservado

  @HU-PRE-03-3 @negativo
  Escenario: HU-PRE-03 criterio 3 (negativo)
    Dado no existe ningún equipo «eq-99»
    Cuando un técnico de IT envía POST /api/equipos/eq-99/devolucion
    Entonces recibe 404 con {"error": "No existe el equipo"}
