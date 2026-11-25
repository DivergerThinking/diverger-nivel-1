# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-GES-02
Característica: Entregar un equipo reservado
  Como técnico de IT, quiero entregar al empleado el equipo que tiene reservado, para que conste como prestado con la misma persona y fecha de devolución, sin volver a escribirlas.

  @HU-GES-02-1 @positivo
  Escenario: HU-GES-02 criterio 1 (positivo)
    Dado el equipo 42 reservado a «ana.perez@empresa.com» con devolucion «2026-12-01»
    Cuando un técnico de IT envía POST /api/equipos/42/entrega
    Entonces recibe 200 con el equipo en estado «prestado», persona «ana.perez@empresa.com» y devolucion «2026-12-01»

  @HU-GES-02-2 @negativo
  Escenario: HU-GES-02 criterio 2 (negativo)
    Dado el equipo 42 disponible
    Cuando un técnico de IT envía POST /api/equipos/42/entrega
    Entonces la respuesta es 409 con {"error": "El equipo no está reservado"} y el equipo sigue disponible

  @HU-GES-02-3 @negativo
  Escenario: HU-GES-02 criterio 3 (negativo)
    Dado no existe el equipo 999
    Cuando un técnico de IT envía POST /api/equipos/999/entrega
    Entonces la respuesta es 404 con {"error": "No existe el equipo"}
