# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-02
Característica: Impedir que un equipo se reserve o se preste dos veces
  Como empleado, quiero recibir una respuesta clara cuando pido un equipo que otra persona pide al mismo tiempo, para que nunca se prometa el mismo equipo a dos personas.

  @HU-PRE-02-1 @positivo
  Escenario: HU-PRE-02 criterio 1 (positivo)
    Dado «Portátil 07» disponible y dos solicitudes con devolución «2026-11-20», una de «luis.garcia@empresa.com» y otra de «marta.ruiz@empresa.com», preparadas para enviarse en paralelo
    Cuando se lanzan las dos solicitudes a la vez
    Entonces exactamente una recibe 201 con el equipo reservado a su nombre, la otra recibe 409 con {"error": "El equipo no está disponible"} y el historial de «Portátil 07» tiene un solo préstamo

  @HU-PRE-02-2 @positivo
  Escenario: HU-PRE-02 criterio 2 (positivo)
    Dado «Monitor 03» disponible, una solicitud de «luis.garcia@empresa.com» y un préstamo en el mostrador a «marta.ruiz@empresa.com», ambos con devolución «2026-11-20» y preparados para enviarse en paralelo
    Cuando se lanzan las dos peticiones a la vez
    Entonces exactamente una sale bien, la otra recibe 409 con {"error": "El equipo no está disponible"} y el historial de «Monitor 03» tiene un solo préstamo

  @HU-PRE-02-3 @negativo
  Escenario: HU-PRE-02 criterio 3 (negativo)
    Dado «Portátil 07» reservado a «marta.ruiz@empresa.com» con devolución «2026-11-20»
    Cuando «luis.garcia@empresa.com» lo pide con {"devolucion": "2026-11-25"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y la reserva de «marta.ruiz@empresa.com» sigue con devolución «2026-11-20»
