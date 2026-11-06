# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SEG-01
Característica: Ver los préstamos vencidos
  Como técnico de IT, quiero ver los préstamos cuya fecha de devolución ya ha pasado, para reclamar los equipos cada semana sin tener que preguntar a nadie.

  @HU-SEG-01-1 @positivo
  Escenario: HU-SEG-01 criterio 1 (positivo)
    Dado el 6 de noviembre de 2026 en Madrid, «Portátil 07» prestado con devolución «2026-11-01», «Proyector 02» prestado con devolución «2026-10-20», «Monitor 03» prestado con devolución «2026-11-06» y «Portátil 09» reservado con devolución «2026-11-10»
    Cuando un técnico de IT consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con «Proyector 02» y después «Portátil 07», cada uno con id, nombre, persona y devolución, y sin «Monitor 03» ni «Portátil 09»

  @HU-SEG-01-2 @positivo
  Escenario: HU-SEG-01 criterio 2 (positivo)
    Dado el 6 de noviembre de 2026 en Madrid y «Proyector 05» prestado en el mostrador a «marta.ruiz@empresa.com» con devolución «2026-11-01» apuntada con retraso
    Cuando un técnico de IT consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con «Proyector 05», persona «marta.ruiz@empresa.com» y devolución «2026-11-01» en la lista

  @HU-SEG-01-3 @negativo
  Escenario: HU-SEG-01 criterio 3 (negativo)
    Dado el empleado «luis.garcia@empresa.com», que no está en CORREOS_IT
    Cuando consulta GET /api/prestamos/vencidos
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y no ve ningún préstamo
