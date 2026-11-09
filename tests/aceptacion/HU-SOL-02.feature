# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SOL-02
Característica: Evitar que dos personas se queden el mismo equipo
  Como empleado, quiero pedir un equipo libre aunque otra persona lo pida a la vez, para saber con certeza si el equipo es mío, sin esperar un portátil que ya tiene otra persona.

  @HU-SOL-02-1 @positivo
  Escenario: HU-SOL-02 criterio 1 (positivo)
    Dado el equipo «Portátil 07» disponible y dos peticiones simultáneas, una de «lucia.gomez@empresa.com» y otra de «marcos.ruiz@empresa.com», con la devolución «2030-06-15»
    Cuando llegan las dos solicitudes a la vez
    Entonces una recibe 201 con el equipo reservado a su nombre y la otra recibe 409 con {"error": "El equipo no está disponible"}

  @HU-SOL-02-2 @negativo
  Escenario: HU-SOL-02 criterio 2 (negativo)
    Dado el equipo «Portátil 07» disponible, una solicitud de «lucia.gomez@empresa.com» y un préstamo en el mostrador de «it.soporte@empresa.com» a «marcos.ruiz@empresa.com», ambos con la devolución «2030-06-15»
    Cuando llegan las dos peticiones a la vez
    Entonces exactamente una de las dos recibe 201 y la otra recibe 409 con {"error": "El equipo no está disponible"}, y el equipo queda reservado o prestado a una sola persona
