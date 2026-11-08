# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SEG-01
Característica: Ver los préstamos vencidos
  Como técnico de IT, quiero ver los préstamos cuya fecha de devolución ya ha pasado, para revisar los vencidos cada semana sin tener que preguntar a nadie.

  @HU-SEG-01-1 @positivo
  Escenario: HU-SEG-01 criterio 1 (positivo)
    Dado hoy es 10/11/2026 en Madrid; «Portátil 07» prestado con devolución «2026-11-03», «Monitor 03» prestado con devolución «2026-11-08», «Monitor 04» prestado con devolución «2026-11-10» y «Portátil 08» reservado con devolución «2026-11-01»
    Cuando el técnico de IT consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con «Portátil 07» y después «Monitor 03», cada uno con id, nombre, persona y devolución, y sin «Monitor 04» ni «Portátil 08»

  @HU-SEG-01-2 @negativo
  Escenario: HU-SEG-01 criterio 2 (negativo)
    Dado la empleada «ana.perez@empresa.com», que no está en CORREOS_IT
    Cuando consulta GET /api/prestamos/vencidos
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y ningún préstamo
