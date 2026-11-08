# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SOL-02
Característica: Evitar que dos personas se queden el mismo equipo
  Como empleado, quiero pedir un equipo a la vez que otra persona sin que los dos nos quedemos con él, para no esperar un portátil que ya tiene otra persona.

  @HU-SOL-02-1 @positivo
  Escenario: HU-SOL-02 criterio 1 (positivo)
    Dado «Portátil 07» está disponible
    Cuando «ana.perez@empresa.com» y «luis.gomez@empresa.com» envían a la vez una solicitud con devolución «2026-11-20»
    Entonces una recibe 201 con el equipo reservado a su nombre, la otra recibe 409 con {"error": "El equipo no está disponible"} y el equipo queda reservado a una sola persona

  @HU-SOL-02-2 @negativo
  Escenario: HU-SOL-02 criterio 2 (negativo)
    Dado «Portátil 07» está disponible, la empleada «ana.perez@empresa.com» envía una solicitud y un técnico de IT envía un préstamo en el mostrador a «luis.gomez@empresa.com»
    Cuando las dos peticiones llegan a la vez
    Entonces solo una de las dos sale bien, la otra recibe 409 con {"error": "El equipo no está disponible"} y el equipo tiene una sola persona
