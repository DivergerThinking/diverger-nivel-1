# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-GES-02
Característica: Entregar un equipo reservado
  Como técnico de IT, quiero entregar un equipo reservado a quien lo pidió, para que conste como prestado con la fecha de devolución que pidió el empleado.

  @HU-GES-02-1 @positivo
  Escenario: HU-GES-02 criterio 1 (positivo)
    Dado un técnico de IT con sesión iniciada y el equipo «Portátil 07» reservado a «luis.gomez@empresa.com» con devolución «2026-11-20»
    Cuando pide POST /api/equipos/{id}/entrega de «Portátil 07»
    Entonces recibe 200 con el equipo en estado «prestado», «persona» «luis.gomez@empresa.com» y «devolucion» «2026-11-20»

  @HU-GES-02-2 @negativo
  Escenario: HU-GES-02 criterio 2 (negativo)
    Dado un técnico de IT con sesión iniciada y el equipo «Monitor 03» disponible
    Cuando pide la entrega de «Monitor 03»
    Entonces recibe 409 con {"error": "El equipo no está reservado"} y el equipo sigue disponible

  @HU-GES-02-3 @negativo
  Escenario: HU-GES-02 criterio 3 (negativo)
    Dado un técnico de IT con sesión iniciada y ningún equipo con el id «no-existe»
    Cuando pide POST /api/equipos/no-existe/entrega
    Entonces recibe 404 con {"error": "No existe el equipo"}
