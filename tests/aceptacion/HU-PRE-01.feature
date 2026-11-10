# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-PRE-01
Característica: Pedir un equipo disponible
  Como empleado, quiero pedir un equipo libre indicando la fecha en que lo devolveré, para tenerlo apartado a mi nombre hasta que IT me lo entregue, sin escribir correos.

  @HU-PRE-01-1 @positivo
  Escenario: HU-PRE-01 criterio 1 (positivo)
    Dado hoy es 2026-11-10 en Madrid, la empleada «ana.perez@empresa.com» con sesión iniciada y «Portátil 07» disponible
    Cuando pide «Portátil 07» con {"devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «reservado», persona «ana.perez@empresa.com» y devolución «2026-11-20»

  @HU-PRE-01-2 @positivo
  Escenario: HU-PRE-01 criterio 2 (positivo)
    Dado hoy es 2026-11-10 en Madrid y «Monitor 03» disponible
    Cuando la empleada «ana.perez@empresa.com» pide «Monitor 03» con {"devolucion": "2026-11-10"}
    Entonces recibe 201 y el equipo queda reservado con devolución «2026-11-10»

  @HU-PRE-01-3 @negativo
  Escenario: HU-PRE-01 criterio 3 (negativo)
    Dado hoy es 2026-11-10 en Madrid y «Portátil 07» disponible
    Cuando la empleada «ana.perez@empresa.com» pide «Portátil 07» con {"devolucion": "2026-11-09"}
    Entonces recibe 400 con {"error": "La fecha de devolución ya ha pasado"} y el equipo sigue disponible

  @HU-PRE-01-4 @negativo
  Escenario: HU-PRE-01 criterio 4 (negativo)
    Dado «Portátil 07» disponible
    Cuando la empleada «ana.perez@empresa.com» pide «Portátil 07» con {"devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-PRE-01-5 @negativo
  Escenario: HU-PRE-01 criterio 5 (negativo)
    Dado «Portátil 07» disponible
    Cuando la empleada «ana.perez@empresa.com» pide «Portátil 07» con {"devolucion": "20/11/2026"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-PRE-01-6 @negativo
  Escenario: HU-PRE-01 criterio 6 (negativo)
    Dado «Portátil 07» disponible
    Cuando la empleada «ana.perez@empresa.com» pide «Portátil 07» sin fecha de devolución
    Entonces recibe 400 con {"error": "Falta la fecha de devolución"} y el equipo sigue disponible

  @HU-PRE-01-7 @negativo
  Escenario: HU-PRE-01 criterio 7 (negativo)
    Dado «Portátil 07» reservado a «luis.gomez@empresa.com»
    Cuando la empleada «ana.perez@empresa.com» pide «Portátil 07» con {"devolucion": "2026-11-20"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y la reserva de «luis.gomez@empresa.com» no cambia

  @HU-PRE-01-8 @negativo
  Escenario: HU-PRE-01 criterio 8 (negativo)
    Dado no existe ningún equipo con el id «no-existe»
    Cuando la empleada «ana.perez@empresa.com» pide ese equipo con {"devolucion": "2026-11-20"}
    Entonces recibe 404 con {"error": "No existe el equipo"}
