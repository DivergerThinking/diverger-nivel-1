# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-02
Característica: Evitar reservas y préstamos dobles simultáneos
  Como empleado, quiero pedir un equipo disponible aunque otra persona lo pida a la vez, para no quedarme esperando un equipo que ya tiene otra persona.

  @HU-SOL-02-1 @positivo
  Escenario: HU-SOL-02 criterio 1 (positivo)
    Dado el equipo «Monitor 03» disponible
    Cuando llegan a la vez una solicitud de ana.perez@empresa.com y otra de luis.gomez@empresa.com, ambas con devolución «2026-11-20»
    Entonces una recibe 201 con «Monitor 03» reservado a su nombre y la otra 409 con el error «El equipo no está disponible»

  @HU-SOL-02-2 @positivo
  Escenario: HU-SOL-02 criterio 2 (positivo)
    Dado el equipo «Monitor 03» disponible
    Cuando llegan a la vez una solicitud de ana.perez@empresa.com con devolución «2026-11-20» y un préstamo en el mostrador a luis.gomez@empresa.com con devolución «2026-11-21»
    Entonces una petición recibe 201 y la otra 409 con el error «El equipo no está disponible»; «Monitor 03» queda a nombre de una sola persona

  @HU-SOL-02-3 @negativo
  Escenario: HU-SOL-02 criterio 3 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando llegan a la vez 20 solicitudes de 20 empleados distintos con devolución «2026-11-20»
    Entonces exactamente una recibe 201, las otras 19 reciben 409 con el error «El equipo no está disponible» y el historial de «Portátil 07» tiene una sola reserva
