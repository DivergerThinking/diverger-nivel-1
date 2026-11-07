# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SEG-01
Característica: Ver los préstamos vencidos
  Como técnico de IT, quiero ver los préstamos cuya fecha de devolución ya ha pasado, para revisar los vencidos cada semana sin tener que preguntar a nadie.

  @HU-SEG-01-1 @positivo
  Escenario: HU-SEG-01 criterio 1 (positivo)
    Dado un técnico de IT con sesión iniciada, hoy 20/11/2026 en Madrid, «Monitor 04» prestado con devolución «2026-11-05», «Proyector 02» prestado con devolución «2026-11-18» y «Monitor 03» prestado con devolución «2026-11-20»
    Cuando pide GET /api/prestamos/vencidos
    Entonces recibe 200 con «Monitor 04» y después «Proyector 02», cada uno con «id», «nombre», «persona» y «devolucion», y sin «Monitor 03»

  @HU-SEG-01-2 @negativo
  Escenario: HU-SEG-01 criterio 2 (negativo)
    Dado un empleado «luis.gomez@empresa.com» que no está en CORREOS_IT
    Cuando pide GET /api/prestamos/vencidos
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y ninguna lista
