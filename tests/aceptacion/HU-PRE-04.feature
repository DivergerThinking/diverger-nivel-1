# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-04
Característica: Ver los préstamos vencidos
  Como técnico de IT, quiero ver los préstamos vencidos, para reclamar cada semana los equipos que no se han devuelto sin tener que preguntar a nadie.

  @HU-PRE-04-1 @positivo
  Escenario: HU-PRE-04 criterio 1 (positivo)
    Dado el 14 de noviembre de 2026 en Madrid, «Proyector 02» prestado a ana.perez@empresa.com con devolución «2026-11-12» y «Monitor 03» prestado en el mostrador a luis.gomez@empresa.com con devolución «2026-11-10»
    Cuando un técnico de IT consulta los préstamos vencidos
    Entonces recibe 200 con «Monitor 03» (luis.gomez@empresa.com, «2026-11-10») y después «Proyector 02» (ana.perez@empresa.com, «2026-11-12»)

  @HU-PRE-04-2 @negativo
  Escenario: HU-PRE-04 criterio 2 (negativo)
    Dado el 14 de noviembre de 2026 en Madrid y «Portátil 07» prestado a ana.perez@empresa.com con devolución «2026-11-14»
    Cuando un técnico de IT consulta los préstamos vencidos
    Entonces «Portátil 07» no aparece en la lista, porque su fecha de devolución no es anterior a hoy

  @HU-PRE-04-3 @negativo
  Escenario: HU-PRE-04 criterio 3 (negativo)
    Dado CORREOS_IT con «it@empresa.com,soporte@empresa.com» y la empleada ana.perez@empresa.com con sesión iniciada
    Cuando consulta los préstamos vencidos
    Entonces recibe 403 con el error «Solo IT puede hacer esto.» y ninguna lista
