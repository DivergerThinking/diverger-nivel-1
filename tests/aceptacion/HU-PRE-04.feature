# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-04
Característica: Apuntar la devolución de un equipo
  Como técnico de IT, quiero apuntar que un equipo prestado se ha devuelto, para que vuelva a estar disponible para otro empleado.

  @HU-PRE-04-1 @positivo
  Escenario: HU-PRE-04 criterio 1 (positivo)
    Dado el «Monitor 03» prestado a luis.gomez@empresa.com
    Cuando un técnico de IT envía POST /api/equipos/{id}/devolucion
    Entonces recibe 200 con el estado «disponible» y sin persona ni devolución

  @HU-PRE-04-2 @negativo
  Escenario: HU-PRE-04 criterio 2 (negativo)
    Dado el «Monitor 03» reservado por ana.perez@empresa.com
    Cuando un técnico de IT envía POST /api/equipos/{id}/devolucion
    Entonces recibe 409 con {"error": "El equipo no está prestado"}
