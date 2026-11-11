# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-GES-04
Característica: Apuntar la devolución de un equipo
  Como técnico de IT, quiero apuntar que un equipo prestado se ha devuelto, para que vuelva a aparecer disponible para el siguiente empleado y deje de contar como vencido.

  @HU-GES-04-1 @positivo
  Escenario: HU-GES-04 criterio 1 (positivo)
    Dado el equipo «Portátil 07» prestado a «ana.perez@empresa.com» con devolución «2026-11-20»
    Cuando un técnico de IT envía POST /api/equipos/{id}/devolucion
    Entonces recibe 200 con el equipo en estado «disponible», sin persona ni devolución

  @HU-GES-04-2 @negativo
  Escenario: HU-GES-04 criterio 2 (negativo)
    Dado el equipo «Portátil 07» reservado a «ana.perez@empresa.com» y aún no entregado
    Cuando un técnico de IT envía POST /api/equipos/{id}/devolucion
    Entonces recibe 409 con {"error": "El equipo no está prestado"} y la reserva no cambia

  @HU-GES-04-3 @negativo
  Escenario: HU-GES-04 criterio 3 (negativo)
    Dado un identificador de equipo que no existe
    Cuando un técnico de IT envía POST /api/equipos/{id}/devolucion
    Entonces recibe 404 con {"error": "No existe el equipo"}
