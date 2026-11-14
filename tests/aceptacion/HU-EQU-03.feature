# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-EQU-03
Característica: Consultar el historial de un equipo
  Como técnico de IT, quiero consultar el historial de préstamos de un equipo, para saber quién ha tenido cada equipo sin buscarlo en la hoja de cálculo.

  @HU-EQU-03-1 @positivo
  Escenario: HU-EQU-03 criterio 1 (positivo)
    Dado el equipo «Portátil 07», prestado antes a ana.perez@empresa.com con devolución «2026-11-10» y ya devuelto, y ahora reservado por luis.gomez@empresa.com con devolución «2026-11-25»
    Cuando un técnico de IT consulta el historial de «Portátil 07»
    Entonces recibe 200 con dos préstamos: primero luis.gomez@empresa.com, «2026-11-25», reservado; después ana.perez@empresa.com, «2026-11-10», devuelto

  @HU-EQU-03-2 @negativo
  Escenario: HU-EQU-03 criterio 2 (negativo)
    Dado ningún equipo con el id «equipo-inexistente»
    Cuando un técnico de IT consulta el historial de «equipo-inexistente»
    Entonces recibe 404 con el error «No existe el equipo»
