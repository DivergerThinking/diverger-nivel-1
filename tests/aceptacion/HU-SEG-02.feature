# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SEG-02
Característica: Consultar el historial de un equipo
  Como técnico de IT, quiero consultar todos los préstamos de un equipo, para saber quién ha tenido el equipo y hasta cuándo sin revisar la hoja de cálculo.

  @HU-SEG-02-1 @positivo
  Escenario: HU-SEG-02 criterio 1 (positivo)
    Dado «Portátil 07» prestado a «luis.garcia@empresa.com» con devolución «2026-10-15» y devuelto, y después reservado a «marta.ruiz@empresa.com» con devolución «2026-11-20»
    Cuando un técnico de IT consulta GET /api/equipos/{id}/historial
    Entonces recibe 200 con primero el préstamo de «marta.ruiz@empresa.com» en estado «reservado» y después el de «luis.garcia@empresa.com» en estado «devuelto»

  @HU-SEG-02-2 @negativo
  Escenario: HU-SEG-02 criterio 2 (negativo)
    Dado ningún equipo con el id indicado
    Cuando un técnico de IT consulta su historial
    Entonces recibe 404 con {"error": "No existe el equipo"}

  @HU-SEG-02-3 @negativo
  Escenario: HU-SEG-02 criterio 3 (negativo)
    Dado el empleado «luis.garcia@empresa.com», que no está en CORREOS_IT
    Cuando consulta el historial de «Portátil 07»
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."}
