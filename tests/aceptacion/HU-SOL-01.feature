# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-01
Característica: Ver los equipos y su estado
  Como empleado, quiero ver la lista de equipos con su estado, para saber qué está libre sin escribir a IT.

  @HU-SOL-01-1 @positivo
  Escenario: HU-SOL-01 criterio 1 (positivo)
    Dado un empleado con sesión, el equipo «Portátil 07» disponible y el equipo «Monitor 03» prestado a «luis.gomez@empresa.com» con devolución «2026-11-20»
    Cuando pide `GET /api/equipos`
    Entonces recibe 200 con «Portátil 07» en estado `disponible` sin `persona` ni `devolucion`, y «Monitor 03» en estado `prestado` con `persona` «luis.gomez@empresa.com» y `devolucion` «2026-11-20»

  @HU-SOL-01-2 @negativo
  Escenario: HU-SOL-01 criterio 2 (negativo)
    Dado una petición sin token de identidad
    Cuando pide `GET /api/equipos`
    Entonces recibe 401 con `{"error": "Inicia sesión con Google."}` y ningún equipo
