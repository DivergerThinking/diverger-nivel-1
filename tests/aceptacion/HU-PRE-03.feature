# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-03
Característica: Ver los préstamos vencidos
  Como técnico de IT, quiero ver los préstamos cuya fecha de devolución ya ha pasado, para reclamar los equipos cada semana sin esperar a que alguien los eche en falta.

  @HU-PRE-03-1 @positivo
  Escenario: HU-PRE-03 criterio 1 (positivo)
    Dado hoy es el 14 de noviembre de 2026 en Madrid, «Monitor 03» prestado con devolución «2026-11-12», «Portátil 07» prestado con devolución «2026-11-10» y «Proyector 01» prestado con devolución «2026-11-20»
    Cuando la cuenta de IT «it@empresa.com» consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con primero «Portátil 07» y después «Monitor 03», cada uno con id, nombre, persona y devolución, y sin «Proyector 01»

  @HU-PRE-03-2 @negativo
  Escenario: HU-PRE-03 criterio 2 (negativo)
    Dado hoy es el 14 de noviembre de 2026 en Madrid, «Monitor 05» reservado con devolución «2026-11-10» y «Portátil 08» prestado con devolución «2026-11-14»
    Cuando la cuenta de IT «it@empresa.com» consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con una lista que no incluye «Monitor 05» ni «Portátil 08»
