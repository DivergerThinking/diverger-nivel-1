# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-SOL-01
Característica: Pedir un equipo libre
  Como empleado, quiero pedir un equipo disponible con la fecha en que lo devolveré, para tenerlo reservado a mi nombre hasta que IT me lo entregue, sin escribir correos.

  @HU-SOL-01-1 @positivo
  Escenario: HU-SOL-01 criterio 1 (positivo)
    Dado el equipo «Portátil 07» disponible
    Cuando la empleada «lucia.gomez@empresa.com» lo pide con la devolución «2030-06-15»
    Entonces recibe 201 con el equipo en estado «reservado», la persona «lucia.gomez@empresa.com» y la devolución «2030-06-15»

  @HU-SOL-01-2 @negativo
  Escenario: HU-SOL-01 criterio 2 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando la empleada «lucia.gomez@empresa.com» lo pide sin fecha de devolución
    Entonces recibe 400 con {"error": "Falta la fecha de devolución"} y el equipo sigue disponible

  @HU-SOL-01-3 @negativo
  Escenario: HU-SOL-01 criterio 3 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando la empleada «lucia.gomez@empresa.com» lo pide con la devolución «2026-02-30»
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"} y el equipo sigue disponible

  @HU-SOL-01-4 @negativo
  Escenario: HU-SOL-01 criterio 4 (negativo)
    Dado el equipo «Portátil 07» disponible
    Cuando la empleada «lucia.gomez@empresa.com» lo pide con la devolución «2025-01-10», anterior a hoy en Madrid
    Entonces recibe 400 con {"error": "La fecha de devolución ya ha pasado"} y el equipo sigue disponible

  @HU-SOL-01-5 @negativo
  Escenario: HU-SOL-01 criterio 5 (negativo)
    Dado ningún equipo con el id «no-existe»
    Cuando la empleada «lucia.gomez@empresa.com» pide el equipo «no-existe» con la devolución «2030-06-15»
    Entonces recibe 404 con {"error": "No existe el equipo"}

  @HU-SOL-01-6 @negativo
  Escenario: HU-SOL-01 criterio 6 (negativo)
    Dado el equipo «Portátil 07» reservado a «lucia.gomez@empresa.com»
    Cuando el empleado «marcos.ruiz@empresa.com» lo pide con la devolución «2030-06-15»
    Entonces recibe 409 con {"error": "El equipo no está disponible"} y el equipo sigue reservado a «lucia.gomez@empresa.com»
