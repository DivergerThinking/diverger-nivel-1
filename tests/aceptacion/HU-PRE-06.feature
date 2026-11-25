# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-06
Característica: Consultar el historial de un equipo
  Como técnico de IT, quiero consultar el historial de préstamos de un equipo, para saber quién ha tenido cada equipo y hasta cuándo sin buscar en hojas de cálculo.

  @HU-PRE-06-1 @positivo
  Escenario: HU-PRE-06 criterio 1 (positivo)
    Dado el «Portátil 07» devuelto por luis.gomez@empresa.com y ahora prestado a ana.perez@empresa.com
    Cuando un técnico de IT consulta su historial
    Entonces ve primero el préstamo de ana.perez@empresa.com como prestado y después el de luis.gomez@empresa.com como devuelto

  @HU-PRE-06-2 @negativo
  Escenario: HU-PRE-06 criterio 2 (negativo)
    Dado un técnico de IT
    Cuando consulta el historial de un equipo que no existe
    Entonces responde 404 con {"error": "No existe el equipo"}
