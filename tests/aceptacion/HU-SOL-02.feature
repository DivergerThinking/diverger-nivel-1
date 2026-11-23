# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-02
Característica: Pedir un equipo libre
  Como empleado, quiero pedir un equipo libre indicando la fecha en que lo devolveré, para tenerlo apartado a mi nombre hasta que IT me lo entregue, sin escribir a IT.

  @HU-SOL-02-1 @positivo
  Escenario: HU-SOL-02 criterio 1 (positivo)
    Dado el 23 de noviembre de 2026 en Madrid y el «Portátil 07» disponible
    Cuando el empleado «ana.perez@empresa.com» lo pide con devolución «2026-12-15»
    Entonces recibe 201 con el «Portátil 07» en estado «reservado», persona «ana.perez@empresa.com» y devolución «2026-12-15»

  @HU-SOL-02-2 @negativo
  Escenario: HU-SOL-02 criterio 2 (negativo)
    Dado el «Monitor 03» reservado por «luis.garcia@empresa.com»
    Cuando el empleado «ana.perez@empresa.com» lo pide con devolución «2026-12-15»
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y el equipo sigue reservado a nombre de «luis.garcia@empresa.com»

  @HU-SOL-02-3 @negativo
  Escenario: HU-SOL-02 criterio 3 (negativo)
    Dado un empleado
    Cuando pide un equipo con un id que no existe
    Entonces recibe 404 con {"error": "No existe el equipo"}
