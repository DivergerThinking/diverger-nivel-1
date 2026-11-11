# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-GES-02
Característica: Entregar un equipo reservado
  Como técnico de IT, quiero marcar como entregado un equipo reservado, para que la aplicación refleje quién tiene físicamente el equipo desde el momento de la recogida.

  @HU-GES-02-1 @positivo
  Escenario: HU-GES-02 criterio 1 (positivo)
    Dado el equipo «Portátil 07» reservado a «ana.perez@empresa.com» con devolución «2026-11-20»
    Cuando un técnico de IT envía POST /api/equipos/{id}/entrega
    Entonces recibe 200 con el equipo en estado «prestado», persona «ana.perez@empresa.com» y devolución «2026-11-20»

  @HU-GES-02-2 @negativo
  Escenario: HU-GES-02 criterio 2 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando un técnico de IT envía POST /api/equipos/{id}/entrega
    Entonces recibe 409 con {"error": "El equipo no está reservado"} y el equipo sigue disponible

  @HU-GES-02-3 @negativo
  Escenario: HU-GES-02 criterio 3 (negativo)
    Dado un identificador de equipo que no existe
    Cuando un técnico de IT envía POST /api/equipos/{id}/entrega
    Entonces recibe 404 con {"error": "No existe el equipo"}
