# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-01
Característica: Pedir un equipo libre
  Como empleado, quiero pedir un equipo disponible con la fecha en que lo devolveré, para tenerlo reservado a mi nombre y que nadie más se lo lleve.

  @HU-PRE-01-1 @positivo
  Escenario: HU-PRE-01 criterio 1 (positivo)
    Dado el «Portátil 07» disponible y hoy 2026-11-25 en Madrid
    Cuando ana.perez@empresa.com lo pide con devolución el 2026-12-04
    Entonces queda reservado a ana.perez@empresa.com con devolución el 2026-12-04 y responde 201

  @HU-PRE-01-2 @negativo
  Escenario: HU-PRE-01 criterio 2 (negativo)
    Dado el «Portátil 07» reservado a luis.gomez@empresa.com
    Cuando ana.perez@empresa.com lo pide con devolución el 2026-12-04
    Entonces responde 409 con {"error": "El equipo no está disponible"}

  @HU-PRE-01-3 @negativo
  Escenario: HU-PRE-01 criterio 3 (negativo)
    Dado el «Portátil 07» disponible y dos empleados que lo piden en el mismo instante
    Cuando llegan las dos solicitudes a la vez
    Entonces una responde 201 y deja el equipo reservado, y la otra recibe 409 con {"error": "El equipo no está disponible"}

  @HU-PRE-01-4 @negativo
  Escenario: HU-PRE-01 criterio 4 (negativo)
    Dado el «Portátil 07» disponible y hoy 2026-11-25 en Madrid
    Cuando ana.perez@empresa.com lo pide con devolución el 2026-11-24
    Entonces responde 400 con {"error": "La fecha de devolución ya ha pasado"}

  @HU-PRE-01-5 @negativo
  Escenario: HU-PRE-01 criterio 5 (negativo)
    Dado el «Portátil 07» disponible
    Cuando ana.perez@empresa.com lo pide con devolución el 2026-02-30
    Entonces responde 400 con {"error": "La fecha de devolución no es válida"}

  @HU-PRE-01-6 @negativo
  Escenario: HU-PRE-01 criterio 6 (negativo)
    Dado el «Portátil 07» disponible
    Cuando ana.perez@empresa.com lo pide sin fecha de devolución
    Entonces responde 400 con {"error": "Falta la fecha de devolución"}

  @HU-PRE-01-7 @negativo
  Escenario: HU-PRE-01 criterio 7 (negativo)
    Dado ningún equipo con el id eq-999
    Cuando ana.perez@empresa.com pide el equipo eq-999 con devolución el 2026-12-04
    Entonces responde 404 con {"error": "No existe el equipo"}
