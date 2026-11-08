# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-PRE-01
Característica: Entregar un equipo reservado
  Como técnico de IT, quiero apuntar la entrega de un equipo reservado, para que conste como prestado a la persona que lo pidió, con su fecha de devolución.

  @HU-PRE-01-1 @positivo
  Escenario: HU-PRE-01 criterio 1 (positivo)
    Dado el equipo «eq-7» reservado por «ana.perez@empresa.com» hasta el 2026-11-20
    Cuando un técnico de IT envía POST /api/equipos/eq-7/entrega
    Entonces recibe 200 con el equipo en estado «prestado», persona «ana.perez@empresa.com» y devolución «2026-11-20»

  @HU-PRE-01-2 @negativo
  Escenario: HU-PRE-01 criterio 2 (negativo)
    Dado el equipo «eq-7» disponible
    Cuando un técnico de IT envía POST /api/equipos/eq-7/entrega
    Entonces recibe 409 con {"error": "El equipo no está reservado"} y el equipo sigue disponible

  @HU-PRE-01-3 @negativo
  Escenario: HU-PRE-01 criterio 3 (negativo)
    Dado no existe ningún equipo «eq-99»
    Cuando un técnico de IT envía POST /api/equipos/eq-99/entrega
    Entonces recibe 404 con {"error": "No existe el equipo"}
