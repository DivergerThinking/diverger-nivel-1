# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-01
Característica: Ver los equipos y su estado
  Como empleado, quiero ver la lista de equipos con su estado, para saber qué está libre sin escribir a IT.

  @HU-SOL-01-1 @positivo
  Escenario: HU-SOL-01 criterio 1 (positivo)
    Dado el «Portátil 07» disponible y el «Proyector 02» prestado a «luis.gomez@empresa.com» hasta el 2026-12-01
    Cuando un empleado consulta GET /api/equipos
    Entonces recibe 200 con «Portátil 07» en estado «disponible» sin persona ni devolucion, y «Proyector 02» en estado «prestado» con persona «luis.gomez@empresa.com» y devolucion «2026-12-01»

  @HU-SOL-01-2 @positivo
  Escenario: HU-SOL-01 criterio 2 (positivo)
    Dado ningún equipo dado de alta
    Cuando un empleado consulta GET /api/equipos
    Entonces recibe 200 con una lista vacía

  @HU-SOL-01-3 @negativo
  Escenario: HU-SOL-01 criterio 3 (negativo)
    Dado una petición sin token
    Cuando consulta GET /api/equipos
    Entonces la respuesta es 401 con {"error": "Inicia sesión con Google."}
