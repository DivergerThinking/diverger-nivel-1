# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SEG-01
Característica: Ver los préstamos vencidos
  Como técnico de IT, quiero ver los préstamos cuya fecha de devolución ya ha pasado, para reclamar los equipos cada semana sin preguntar a nadie.

  @HU-SEG-01-1 @positivo
  Escenario: HU-SEG-01 criterio 1 (positivo)
    Dado hoy es 2026-11-10 en Madrid, «Monitor 03» prestado con devolución «2026-11-08», «Proyector 02» prestado con devolución «2026-11-03» y «Portátil 07» prestado con devolución «2026-11-10»
    Cuando el técnico de IT «it.soporte@empresa.com» consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con «Proyector 02» y después «Monitor 03», cada uno con id, nombre, persona y devolución, y sin «Portátil 07», que vence hoy

  @HU-SEG-01-2 @negativo
  Escenario: HU-SEG-01 criterio 2 (negativo)
    Dado hoy es 2026-11-10 en Madrid y «Altavoz 01» reservado con devolución «2026-11-09»
    Cuando el técnico de IT «it.soporte@empresa.com» consulta los préstamos vencidos
    Entonces «Altavoz 01» no aparece, porque solo cuentan los equipos prestados

  @HU-SEG-01-3 @negativo
  Escenario: HU-SEG-01 criterio 3 (negativo)
    Dado la empleada «ana.perez@empresa.com», que no es de IT, con sesión iniciada
    Cuando consulta GET /api/prestamos/vencidos
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."}
