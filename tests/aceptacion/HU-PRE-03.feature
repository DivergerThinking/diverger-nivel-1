# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-03
Característica: Apuntar la devolución de un equipo
  Como técnico de IT, quiero apuntar la devolución de un equipo prestado, para que vuelva a aparecer como disponible para el siguiente empleado que lo necesite.

  @HU-PRE-03-1 @positivo
  Escenario: HU-PRE-03 criterio 1 (positivo)
    Dado el equipo «Monitor 03» prestado a luis.gomez@empresa.com con devolución «2026-11-20»
    Cuando un técnico de IT apunta la devolución de «Monitor 03»
    Entonces recibe 200 con «Monitor 03» disponible, sin persona ni fecha de devolución

  @HU-PRE-03-2 @negativo
  Escenario: HU-PRE-03 criterio 2 (negativo)
    Dado el equipo «Portátil 07» reservado por ana.perez@empresa.com
    Cuando un técnico de IT apunta la devolución de «Portátil 07»
    Entonces recibe 409 con el error «El equipo no está prestado» y «Portátil 07» sigue reservado

  @HU-PRE-03-3 @negativo
  Escenario: HU-PRE-03 criterio 3 (negativo)
    Dado ningún equipo con el id «equipo-inexistente»
    Cuando un técnico de IT apunta la devolución de «equipo-inexistente»
    Entonces recibe 404 con el error «No existe el equipo»
