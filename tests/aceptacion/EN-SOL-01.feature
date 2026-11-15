# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@EN-SOL-01
Característica: Impedir que un equipo se reserve o preste dos veces
  Como equipo, quiero garantizar que un equipo no se reserva ni se presta dos veces con peticiones simultáneas, para que ningún empleado vaya a recoger un equipo que también está a nombre de otra persona.

  @EN-SOL-01-1 @positivo
  Escenario: EN-SOL-01 criterio 1 (positivo)
    Dado el equipo «Portátil 07» disponible y dos solicitudes simultáneas, de «ana.perez@empresa.com» y de «luis.gomez@empresa.com», con devolución «2026-11-20»
    Cuando llegan las dos a `POST /api/equipos/{id}/solicitud` a la vez
    Entonces una recibe 201 con `estado: "reservado"` y la otra 409 con `{"error": "El equipo no está disponible"}`, y el equipo queda a nombre de una sola persona

  @EN-SOL-01-2 @positivo
  Escenario: EN-SOL-01 criterio 2 (positivo)
    Dado el equipo «Monitor 03» disponible, una solicitud de «ana.perez@empresa.com» y un préstamo en el mostrador de IT a «luis.gomez@empresa.com», ambos con devolución «2026-11-20»
    Cuando llegan las dos peticiones a la vez
    Entonces una recibe 201 con el equipo reservado o prestado a su persona y la otra recibe 409 con `{"error": "El equipo no está disponible"}`

  @EN-SOL-01-3 @negativo
  Escenario: EN-SOL-01 criterio 3 (negativo)
    Dado el equipo «Portátil 07» ya reservado por «ana.perez@empresa.com» y un técnico de IT con sesión
    Cuando pide `POST /api/equipos/{id}/prestamo` de «Portátil 07» con `{"persona": "luis.gomez@empresa.com", "devolucion": "2026-11-20"}`
    Entonces recibe 409 con `{"error": "El equipo no está disponible"}` y «Portátil 07» sigue reservado por «ana.perez@empresa.com»
