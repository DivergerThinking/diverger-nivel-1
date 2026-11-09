# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-PRE-03
Característica: Apuntar la devolución de un equipo
  Como técnico de IT, quiero apuntar que un equipo prestado se ha devuelto, para que vuelva a aparecer libre para el siguiente empleado.

  @HU-PRE-03-1 @positivo
  Escenario: HU-PRE-03 criterio 1 (positivo)
    Dado el equipo «Proyector 01» prestado a «ana.perez@empresa.com» con la devolución «2030-06-15»
    Cuando el técnico de IT «it.soporte@empresa.com» apunta su devolución
    Entonces recibe 200 con el equipo en estado «disponible», sin persona ni devolución

  @HU-PRE-03-2 @negativo
  Escenario: HU-PRE-03 criterio 2 (negativo)
    Dado el equipo «Portátil 07» reservado a «lucia.gomez@empresa.com»
    Cuando el técnico de IT «it.soporte@empresa.com» apunta su devolución
    Entonces recibe 409 con {"error": "El equipo no está prestado"} y el equipo sigue reservado

  @HU-PRE-03-3 @negativo
  Escenario: HU-PRE-03 criterio 3 (negativo)
    Dado ningún equipo con el id «no-existe»
    Cuando el técnico de IT «it.soporte@empresa.com» apunta la devolución del equipo «no-existe»
    Entonces recibe 404 con {"error": "No existe el equipo"}
