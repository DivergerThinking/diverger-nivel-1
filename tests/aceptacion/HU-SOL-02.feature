# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-02
Característica: Entregar un equipo reservado
  Como técnico de IT, quiero apuntar la entrega de un equipo reservado, para que conste quién tiene el equipo y cuándo tiene que devolverlo.

  @HU-SOL-02-1 @positivo
  Escenario: HU-SOL-02 criterio 1 (positivo)
    Dado el equipo «Portátil 07» reservado por «ana.perez@empresa.com» con devolución «2026-11-20»
    Cuando la cuenta de IT «it@empresa.com» envía POST /api/equipos/{id}/entrega
    Entonces recibe 200 con el equipo en estado «prestado», persona «ana.perez@empresa.com» y devolución «2026-11-20»

  @HU-SOL-02-2 @negativo
  Escenario: HU-SOL-02 criterio 2 (negativo)
    Dado el equipo «Proyector 01» disponible
    Cuando la cuenta de IT «it@empresa.com» envía POST /api/equipos/{id}/entrega
    Entonces recibe 409 con {"error": "El equipo no está reservado"} y el equipo sigue disponible

  @HU-SOL-02-3 @negativo
  Escenario: HU-SOL-02 criterio 3 (negativo)
    Dado ningún equipo con el id «no-existe»
    Cuando la cuenta de IT «it@empresa.com» envía POST /api/equipos/no-existe/entrega
    Entonces recibe 404 con {"error": "No existe el equipo"}
