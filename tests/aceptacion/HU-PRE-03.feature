# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-03
Característica: Prestar un equipo en el mostrador
  Como técnico de IT, quiero prestar un equipo disponible a quien viene al mostrador, para que todos los préstamos pasen por la aplicación, también los que no se pidieron antes.

  @HU-PRE-03-1 @positivo
  Escenario: HU-PRE-03 criterio 1 (positivo)
    Dado el «Monitor 03» disponible
    Cuando un técnico de IT lo presta a ana.perez@empresa.com con devolución el 2026-12-04
    Entonces queda prestado a ana.perez@empresa.com con devolución el 2026-12-04 y responde 201

  @HU-PRE-03-2 @positivo
  Escenario: HU-PRE-03 criterio 2 (positivo)
    Dado el «Monitor 03» disponible y hoy 2026-11-25 en Madrid
    Cuando un técnico de IT lo presta a ana.perez@empresa.com con devolución el 2026-11-20
    Entonces queda prestado y aparece entre los préstamos vencidos

  @HU-PRE-03-3 @negativo
  Escenario: HU-PRE-03 criterio 3 (negativo)
    Dado el «Monitor 03» reservado a luis.gomez@empresa.com
    Cuando un técnico de IT lo presta a ana.perez@empresa.com con devolución el 2026-12-04
    Entonces responde 409 con {"error": "El equipo no está disponible"}

  @HU-PRE-03-4 @negativo
  Escenario: HU-PRE-03 criterio 4 (negativo)
    Dado el «Monitor 03» disponible
    Cuando un técnico de IT lo presta con devolución el 2026-12-04 sin indicar la persona
    Entonces responde 400 con {"error": "Faltan la persona o la fecha de devolución"}

  @HU-PRE-03-5 @negativo
  Escenario: HU-PRE-03 criterio 5 (negativo)
    Dado el «Monitor 03» disponible
    Cuando un técnico de IT lo presta a ana.perez@empresa.com con devolución el 2026-02-30
    Entonces responde 400 con {"error": "La fecha de devolución no es válida"}

  @HU-PRE-03-6 @negativo
  Escenario: HU-PRE-03 criterio 6 (negativo)
    Dado ningún equipo con el id eq-999
    Cuando un técnico de IT presta el equipo eq-999 a ana.perez@empresa.com con devolución el 2026-12-04
    Entonces responde 404 con {"error": "No existe el equipo"}

  @HU-PRE-03-7 @negativo
  Escenario: HU-PRE-03 criterio 7 (negativo)
    Dado el «Monitor 03» disponible, una solicitud de luis.gomez@empresa.com y un préstamo de IT a ana.perez@empresa.com
    Cuando llegan los dos a la vez
    Entonces uno sale bien y el otro recibe 409 con {"error": "El equipo no está disponible"}
