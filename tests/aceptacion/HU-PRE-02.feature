# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-02
Característica: Entregar un equipo reservado
  Como técnico de IT, quiero entregar un equipo reservado a quien lo pidió, para que conste como prestado y aparezca entre los vencidos si no vuelve a tiempo.

  @HU-PRE-02-1 @positivo
  Escenario: HU-PRE-02 criterio 1 (positivo)
    Dado el «Portátil 07» reservado a ana.perez@empresa.com con devolución el 2026-12-04
    Cuando un técnico de IT lo entrega
    Entonces queda prestado a ana.perez@empresa.com con devolución el 2026-12-04 y responde 200

  @HU-PRE-02-2 @negativo
  Escenario: HU-PRE-02 criterio 2 (negativo)
    Dado el «Portátil 07» disponible
    Cuando un técnico de IT lo entrega
    Entonces responde 409 con {"error": "El equipo no está reservado"}

  @HU-PRE-02-3 @negativo
  Escenario: HU-PRE-02 criterio 3 (negativo)
    Dado ningún equipo con el id eq-999
    Cuando un técnico de IT entrega el equipo eq-999
    Entonces responde 404 con {"error": "No existe el equipo"}
