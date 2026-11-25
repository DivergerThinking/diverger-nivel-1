# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-02
Característica: Pedir un equipo disponible
  Como empleado, quiero pedir un equipo disponible indicando la fecha en que lo devolveré, para que quede reservado a mi nombre y nadie más se lo lleve antes de que IT me lo entregue.

  @HU-SOL-02-1 @positivo
  Escenario: HU-SOL-02 criterio 1 (positivo)
    Dado hoy es 2026-11-25 en Madrid y el equipo 42 «Portátil 07» está disponible
    Cuando «ana.perez@empresa.com» envía POST /api/equipos/42/solicitud con {"devolucion": "2026-12-01"}
    Entonces recibe 201 con el equipo en estado «reservado», persona «ana.perez@empresa.com» y devolucion «2026-12-01»

  @HU-SOL-02-2 @negativo
  Escenario: HU-SOL-02 criterio 2 (negativo)
    Dado hoy es 2026-11-25 en Madrid y el equipo 42 está disponible
    Cuando un empleado pide el equipo con {"devolucion": "2026-11-20"}
    Entonces la respuesta es 400 con {"error": "La fecha de devolución ya ha pasado"} y el equipo sigue disponible

  @HU-SOL-02-3 @negativo
  Escenario: HU-SOL-02 criterio 3 (negativo)
    Dado el equipo 42 disponible
    Cuando un empleado pide el equipo con {"devolucion": "2026-02-30"}
    Entonces la respuesta es 400 con {"error": "La fecha de devolución no es válida"}

  @HU-SOL-02-4 @negativo
  Escenario: HU-SOL-02 criterio 4 (negativo)
    Dado el equipo 42 disponible
    Cuando un empleado pide el equipo con el cuerpo {}
    Entonces la respuesta es 400 con {"error": "Falta la fecha de devolución"}

  @HU-SOL-02-5 @negativo
  Escenario: HU-SOL-02 criterio 5 (negativo)
    Dado el equipo 42 reservado a «luis.gomez@empresa.com»
    Cuando «ana.perez@empresa.com» pide el equipo con {"devolucion": "2026-12-01"}
    Entonces la respuesta es 409 con {"error": "El equipo no está disponible"}

  @HU-SOL-02-6 @negativo
  Escenario: HU-SOL-02 criterio 6 (negativo)
    Dado no existe el equipo 999
    Cuando un empleado pide el equipo 999 con {"devolucion": "2026-12-01"}
    Entonces la respuesta es 404 con {"error": "No existe el equipo"}
