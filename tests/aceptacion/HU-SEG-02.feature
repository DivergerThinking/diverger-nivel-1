# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SEG-02
Característica: Consultar el historial de un equipo
  Como técnico de IT, quiero consultar el historial de préstamos de un equipo, para saber quién lo tuvo y cuándo sin buscar en la hoja de cálculo.

  @HU-SEG-02-1 @positivo
  Escenario: HU-SEG-02 criterio 1 (positivo)
    Dado el equipo «Proyector 01» prestado y devuelto por «ana.perez@empresa.com» con la devolución «2030-05-01» y después reservado a «lucia.gomez@empresa.com» con la devolución «2030-06-15»
    Cuando el técnico de IT «it.soporte@empresa.com» consulta su historial
    Entonces recibe 200 con la reserva de «lucia.gomez@empresa.com» en estado «reservado» primero y el préstamo de «ana.perez@empresa.com» en estado «devuelto» después

  @HU-SEG-02-2 @negativo
  Escenario: HU-SEG-02 criterio 2 (negativo)
    Dado ningún equipo con el id «no-existe»
    Cuando el técnico de IT «it.soporte@empresa.com» consulta el historial del equipo «no-existe»
    Entonces recibe 404 con {"error": "No existe el equipo"}
