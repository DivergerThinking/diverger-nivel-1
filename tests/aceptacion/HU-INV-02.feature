# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-INV-02
Característica: Ver los equipos y su estado
  Como empleado, quiero ver los equipos con su estado, para saber qué está libre sin preguntar a IT.

  @HU-INV-02-1 @positivo
  Escenario: HU-INV-02 criterio 1 (positivo)
    Dado el equipo «Portátil 07» disponible y el equipo «Monitor 03» reservado por «luis.gomez@empresa.com» con devolución «2026-11-20»
    Cuando la empleada «ana.perez@empresa.com» consulta GET /api/equipos
    Entonces recibe 200 con «Portátil 07» con estado «disponible» y «Monitor 03» con estado «reservado», persona «luis.gomez@empresa.com» y devolución «2026-11-20»

  @HU-INV-02-2 @positivo
  Escenario: HU-INV-02 criterio 2 (positivo)
    Dado el equipo «Proyector 01» disponible
    Cuando la empleada «ana.perez@empresa.com» consulta GET /api/equipos
    Entonces «Proyector 01» aparece con id, nombre y estado «disponible», sin persona ni devolución

  @HU-INV-02-3 @negativo
  Escenario: HU-INV-02 criterio 3 (negativo)
    Dado un token de Google de «ana.perez@empresa.com» con el correo sin verificar
    Cuando consulta GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."} y ninguna lista de equipos
