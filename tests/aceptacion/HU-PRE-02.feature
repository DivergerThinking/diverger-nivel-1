# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-PRE-02
Característica: Entregar un equipo reservado
  Como técnico de IT, quiero entregar a un empleado el equipo que tenía reservado, para que conste como prestado con la misma fecha de devolución que pidió.

  @HU-PRE-02-1 @positivo
  Escenario: HU-PRE-02 criterio 1 (positivo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada y «Portátil 07» reservado a «ana.perez@empresa.com» con devolución «2026-11-20»
    Cuando entrega «Portátil 07» con POST /api/equipos/{id}/entrega
    Entonces recibe 200 con el equipo en estado «prestado», persona «ana.perez@empresa.com» y devolución «2026-11-20»

  @HU-PRE-02-2 @negativo
  Escenario: HU-PRE-02 criterio 2 (negativo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada y «Monitor 03» disponible
    Cuando entrega «Monitor 03»
    Entonces recibe 409 con {"error": "El equipo no está reservado"} y el equipo sigue disponible

  @HU-PRE-02-3 @negativo
  Escenario: HU-PRE-02 criterio 3 (negativo)
    Dado el técnico de IT «it.soporte@empresa.com» con sesión iniciada y ningún equipo con el id «no-existe»
    Cuando entrega el equipo «no-existe»
    Entonces recibe 404 con {"error": "No existe el equipo"}

  @HU-PRE-02-4 @negativo
  Escenario: HU-PRE-02 criterio 4 (negativo)
    Dado la empleada «ana.perez@empresa.com», que no es de IT, y «Portátil 07» reservado a su nombre
    Cuando entrega «Portátil 07»
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y el equipo sigue reservado
