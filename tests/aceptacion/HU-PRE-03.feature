# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-03
Característica: Apuntar la devolución de un equipo
  Como técnico de IT, quiero apuntar que un equipo prestado se ha devuelto, para que vuelva a estar libre para el siguiente empleado.

  @HU-PRE-03-1 @positivo
  Escenario: HU-PRE-03 criterio 1 (positivo)
    Dado el «Proyector 01» prestado a «ana.perez@empresa.com» con devolución «2026-11-30»
    Cuando un técnico de IT apunta su devolución
    Entonces recibe 200 con el «Proyector 01» en estado «disponible», sin persona ni fecha de devolución

  @HU-PRE-03-2 @negativo
  Escenario: HU-PRE-03 criterio 2 (negativo)
    Dado el «Portátil 07» reservado por «luis.garcia@empresa.com» y aún no entregado
    Cuando un técnico de IT apunta su devolución
    Entonces recibe 409 con {"error": "El equipo no está prestado"} y el equipo sigue reservado

  @HU-PRE-03-3 @negativo
  Escenario: HU-PRE-03 criterio 3 (negativo)
    Dado un técnico de IT
    Cuando apunta la devolución de un equipo con un id que no existe
    Entonces recibe 404 con {"error": "No existe el equipo"}
