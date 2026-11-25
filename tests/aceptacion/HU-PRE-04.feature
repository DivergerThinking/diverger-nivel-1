# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-04
Característica: Apuntar la devolución de un equipo
  Como técnico de IT, quiero apuntar que un equipo prestado se ha devuelto, para que los empleados vean el equipo libre y puedan pedirlo sin escribir a IT.

  @HU-PRE-04-1 @positivo
  Escenario: HU-PRE-04 criterio 1 (positivo)
    Dado el «Portátil 07» prestado a ana.perez@empresa.com
    Cuando un técnico de IT apunta su devolución
    Entonces queda disponible sin persona ni fecha de devolución y responde 200

  @HU-PRE-04-2 @negativo
  Escenario: HU-PRE-04 criterio 2 (negativo)
    Dado el «Portátil 07» reservado a ana.perez@empresa.com
    Cuando un técnico de IT apunta su devolución
    Entonces responde 409 con {"error": "El equipo no está prestado"}

  @HU-PRE-04-3 @negativo
  Escenario: HU-PRE-04 criterio 3 (negativo)
    Dado ningún equipo con el id eq-999
    Cuando un técnico de IT apunta la devolución del equipo eq-999
    Entonces responde 404 con {"error": "No existe el equipo"}
