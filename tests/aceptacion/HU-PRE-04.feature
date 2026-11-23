# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-04
Característica: Ver los préstamos vencidos
  Como técnico de IT, quiero ver los préstamos cuya fecha de devolución ya ha pasado, para reclamar los equipos cada semana sin preguntar a nadie.

  @HU-PRE-04-1 @positivo
  Escenario: HU-PRE-04 criterio 1 (positivo)
    Dado el 23 de noviembre de 2026 en Madrid, el «Portátil 07» prestado con devolución «2026-11-18», el «Monitor 03» prestado con devolución «2026-11-10» y el «Proyector 01» prestado con devolución «2026-11-23»
    Cuando un técnico de IT consulta los préstamos vencidos
    Entonces recibe 200 con dos equipos, primero el «Monitor 03» y después el «Portátil 07», cada uno con id, nombre, persona y devolución; el «Proyector 01» no aparece porque vence hoy

  @HU-PRE-04-2 @negativo
  Escenario: HU-PRE-04 criterio 2 (negativo)
    Dado el 23 de noviembre de 2026 en Madrid y el «Portátil 07» reservado, sin entregar, con devolución «2026-11-20»
    Cuando un técnico de IT consulta los préstamos vencidos
    Entonces recibe 200 sin el «Portátil 07», porque solo cuentan los equipos prestados

  @HU-PRE-04-3 @negativo
  Escenario: HU-PRE-04 criterio 3 (negativo)
    Dado el empleado «ana.perez@empresa.com»
    Cuando consulta los préstamos vencidos
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."}
