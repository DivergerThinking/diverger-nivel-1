# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-05
Característica: Ver los préstamos vencidos
  Como técnico de IT, quiero ver los préstamos cuya fecha de devolución ya ha pasado, para reclamar los equipos cada semana sin preguntar a nadie.

  @HU-PRE-05-1 @positivo
  Escenario: HU-PRE-05 criterio 1 (positivo)
    Dado hoy 2026-11-25 en Madrid, el «Portátil 07» prestado hasta el 2026-11-20 y el «Monitor 03» prestado hasta el 2026-11-18
    Cuando un técnico de IT abre los préstamos vencidos
    Entonces ve primero el «Monitor 03» y después el «Portátil 07», cada uno con persona y fecha de devolución

  @HU-PRE-05-2 @negativo
  Escenario: HU-PRE-05 criterio 2 (negativo)
    Dado hoy 2026-11-25 en Madrid y el «Proyector 02» prestado hasta el 2026-11-25
    Cuando un técnico de IT abre los préstamos vencidos
    Entonces el «Proyector 02» no aparece
