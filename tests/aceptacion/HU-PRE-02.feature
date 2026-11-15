# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-02
Característica: Prestar un equipo en el mostrador
  Como técnico de IT, quiero prestar directamente un equipo disponible a quien viene al mostrador, para que también los préstamos sin solicitud previa queden registrados en la aplicación.

  @HU-PRE-02-1 @positivo
  Escenario: HU-PRE-02 criterio 1 (positivo)
    Dado un técnico de IT con sesión y el equipo «Proyector 01» disponible
    Cuando pide `POST /api/equipos/{id}/prestamo` de «Proyector 01» con `{"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}`
    Entonces recibe 201 con el equipo en `estado: "prestado"`, `persona` «ana.perez@empresa.com» y `devolucion` «2026-11-20»

  @HU-PRE-02-2 @positivo
  Escenario: HU-PRE-02 criterio 2 (positivo)
    Dado el día 2026-11-15 en Madrid, un técnico de IT con sesión que apunta con retraso un préstamo y el equipo «Proyector 01» disponible
    Cuando pide el préstamo de «Proyector 01» con `{"persona": "luis.gomez@empresa.com", "devolucion": "2026-11-10"}`
    Entonces recibe 201 con el equipo prestado y «Proyector 01» aparece ya en `GET /api/prestamos/vencidos`

  @HU-PRE-02-3 @negativo
  Escenario: HU-PRE-02 criterio 3 (negativo)
    Dado un técnico de IT con sesión y el equipo «Proyector 01» disponible
    Cuando pide el préstamo de «Proyector 01» con `{"devolucion": "2026-11-20"}`
    Entonces recibe 400 con `{"error": "Faltan la persona o la fecha de devolución"}` y el equipo sigue `disponible`

  @HU-PRE-02-4 @negativo
  Escenario: HU-PRE-02 criterio 4 (negativo)
    Dado un técnico de IT con sesión y el equipo «Proyector 01» disponible
    Cuando pide el préstamo de «Proyector 01» con `{"persona": "ana.perez@empresa.com", "devolucion": "2026-02-30"}`
    Entonces recibe 400 con `{"error": "La fecha de devolución no es válida"}`

  @HU-PRE-02-5 @negativo
  Escenario: HU-PRE-02 criterio 5 (negativo)
    Dado un técnico de IT con sesión y el equipo «Monitor 03» reservado por «luis.gomez@empresa.com»
    Cuando pide el préstamo de «Monitor 03» con `{"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}`
    Entonces recibe 409 con `{"error": "El equipo no está disponible"}` y «Monitor 03» sigue reservado por «luis.gomez@empresa.com»

  @HU-PRE-02-6 @negativo
  Escenario: HU-PRE-02 criterio 6 (negativo)
    Dado un técnico de IT con sesión
    Cuando pide el préstamo de un id que no corresponde a ningún equipo con `{"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}`
    Entonces recibe 404 con `{"error": "No existe el equipo"}`
