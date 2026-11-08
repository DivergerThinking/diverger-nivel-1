# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SOL-02
Característica: Evitar que dos personas se queden el mismo equipo
  Como empleado, quiero pedir un equipo libre aunque otra persona lo pida en el mismo instante, para no ir a recoger un equipo que en realidad tiene otra persona.

  @HU-SOL-02-1 @positivo
  Escenario: HU-SOL-02 criterio 1 (positivo)
    Dado el equipo «eq-7» disponible
    Cuando llegan a la vez una solicitud de «ana.perez@empresa.com» y otra de «luis.gomez@empresa.com» para «eq-7»
    Entonces una recibe 201 con el equipo reservado a su nombre, la otra recibe 409 con {"error": "El equipo no está disponible"} y GET /api/equipos muestra «eq-7» reservado a una sola persona

  @HU-SOL-02-2 @negativo
  Escenario: HU-SOL-02 criterio 2 (negativo)
    Dado el equipo «eq-7» disponible
    Cuando llegan a la vez dos préstamos en el mostrador de «eq-7», uno a «ana.perez@empresa.com» y otro a «luis.gomez@empresa.com»
    Entonces uno recibe 201, el otro recibe 409 con {"error": "El equipo no está disponible"} y GET /api/equipos muestra «eq-7» prestado a una sola persona
