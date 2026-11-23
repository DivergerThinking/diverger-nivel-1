# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-INV-02
Característica: Consultar el historial de un equipo
  Como técnico de IT, quiero consultar los préstamos que ha tenido un equipo, para saber quién lo tuvo y cuándo si aparece dañado o falta.

  @HU-INV-02-1 @positivo
  Escenario: HU-INV-02 criterio 1 (positivo)
    Dado el equipo «Portátil 07», prestado a «ana.perez@empresa.com» con devolución «2026-10-15» y ya devuelto, y ahora reservado por «luis.garcia@empresa.com» con devolución «2026-12-15»
    Cuando un técnico de IT consulta su historial
    Entonces recibe 200 con dos préstamos: primero el de «luis.garcia@empresa.com», «2026-12-15», estado «reservado»; después el de «ana.perez@empresa.com», «2026-10-15», estado «devuelto»

  @HU-INV-02-2 @negativo
  Escenario: HU-INV-02 criterio 2 (negativo)
    Dado un técnico de IT
    Cuando consulta el historial de un equipo con un id que no existe
    Entonces recibe 404 con {"error": "No existe el equipo"}

  @HU-INV-02-3 @negativo
  Escenario: HU-INV-02 criterio 3 (negativo)
    Dado el empleado «ana.perez@empresa.com»
    Cuando consulta el historial del «Portátil 07»
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."}
