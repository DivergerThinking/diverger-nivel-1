# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-01
Característica: Pedir un equipo libre
  Como empleado, quiero pedir un equipo libre indicando la fecha en que lo devolveré, para que quede reservado a mi nombre y nadie más lo pida mientras IT me lo entrega.

  @HU-PRE-01-1 @positivo
  Escenario: HU-PRE-01 criterio 1 (positivo)
    Dado el 6 de noviembre de 2026 en Madrid, «Portátil 07» disponible y el empleado «luis.garcia@empresa.com» con sesión iniciada
    Cuando pide «Portátil 07» con {"devolucion": "2026-11-20"}
    Entonces recibe 201 con «Portátil 07» en estado «reservado», persona «luis.garcia@empresa.com» y devolución «2026-11-20»

  @HU-PRE-01-2 @negativo
  Escenario: HU-PRE-01 criterio 2 (negativo)
    Dado las 00:30 del 7 de noviembre de 2026 en Madrid y «Portátil 07» disponible
    Cuando un empleado pide «Portátil 07» con {"devolucion": "2026-11-06"}
    Entonces recibe 400 con {"error": "La fecha de devolución ya ha pasado"} y el equipo sigue disponible

  @HU-PRE-01-3 @negativo
  Escenario: HU-PRE-01 criterio 3 (negativo)
    Dado «Portátil 07» disponible
    Cuando un empleado lo pide con {"devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-PRE-01-4 @negativo
  Escenario: HU-PRE-01 criterio 4 (negativo)
    Dado «Portátil 07» disponible
    Cuando un empleado lo pide sin fecha de devolución
    Entonces recibe 400 con {"error": "Falta la fecha de devolución"}

  @HU-PRE-01-5 @negativo
  Escenario: HU-PRE-01 criterio 5 (negativo)
    Dado «Portátil 07» reservado a «marta.ruiz@empresa.com»
    Cuando «luis.garcia@empresa.com» lo pide con {"devolucion": "2026-11-20"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y la reserva sigue a nombre de «marta.ruiz@empresa.com»

  @HU-PRE-01-6 @negativo
  Escenario: HU-PRE-01 criterio 6 (negativo)
    Dado ningún equipo con el id pedido
    Cuando un empleado lo pide con {"devolucion": "2026-11-20"}
    Entonces recibe 404 con {"error": "No existe el equipo"}
