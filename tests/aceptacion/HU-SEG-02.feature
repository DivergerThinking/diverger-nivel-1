# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SEG-02
Característica: Consultar el historial de un equipo
  Como técnico de IT, quiero consultar todos los préstamos que ha tenido un equipo, para saber quién lo tuvo antes si aparece dañado o falta algo.

  @HU-SEG-02-1 @positivo
  Escenario: HU-SEG-02 criterio 1 (positivo)
    Dado «Portátil 07» prestado a «ana.perez@empresa.com» con devolución «2026-11-05» y ya devuelto, y ahora reservado a «luis.gomez@empresa.com» con devolución «2026-11-20»
    Cuando el técnico de IT «it.soporte@empresa.com» consulta GET /api/equipos/{id}/historial
    Entonces recibe 200 con primero «luis.gomez@empresa.com», «2026-11-20», «reservado» y después «ana.perez@empresa.com», «2026-11-05», «devuelto»

  @HU-SEG-02-2 @positivo
  Escenario: HU-SEG-02 criterio 2 (positivo)
    Dado «Monitor 03» prestado en este momento a «ana.perez@empresa.com» con devolución «2026-11-20» y sin préstamos anteriores
    Cuando el técnico de IT «it.soporte@empresa.com» consulta el historial de «Monitor 03»
    Entonces recibe 200 con un único préstamo: «ana.perez@empresa.com», «2026-11-20», «prestado»

  @HU-SEG-02-3 @negativo
  Escenario: HU-SEG-02 criterio 3 (negativo)
    Dado no existe ningún equipo con el id «no-existe»
    Cuando el técnico de IT «it.soporte@empresa.com» consulta su historial
    Entonces recibe 404 con {"error": "No existe el equipo"}

  @HU-SEG-02-4 @negativo
  Escenario: HU-SEG-02 criterio 4 (negativo)
    Dado la empleada «ana.perez@empresa.com», que no es de IT, con sesión iniciada
    Cuando consulta el historial de «Portátil 07»
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."}
