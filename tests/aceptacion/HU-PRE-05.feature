# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-05
Característica: Apuntar la devolución de un equipo
  Como técnico de IT, quiero apuntar que un equipo prestado se ha devuelto, para que vuelva a aparecer libre para el siguiente empleado.

  @HU-PRE-05-1 @positivo
  Escenario: HU-PRE-05 criterio 1 (positivo)
    Dado «Proyector 02» prestado a «marta.ruiz@empresa.com» con devolución «2026-11-20»
    Cuando un técnico de IT apunta su devolución con POST /api/equipos/{id}/devolucion
    Entonces recibe 200 con «Proyector 02» en estado «disponible», sin persona ni devolución

  @HU-PRE-05-2 @negativo
  Escenario: HU-PRE-05 criterio 2 (negativo)
    Dado «Portátil 07» reservado a «luis.garcia@empresa.com» y aún no entregado
    Cuando un técnico de IT apunta su devolución
    Entonces recibe 409 con {"error": "El equipo no está prestado"} y la reserva sigue igual

  @HU-PRE-05-3 @negativo
  Escenario: HU-PRE-05 criterio 3 (negativo)
    Dado ningún equipo con el id indicado
    Cuando un técnico de IT apunta su devolución
    Entonces recibe 404 con {"error": "No existe el equipo"}
