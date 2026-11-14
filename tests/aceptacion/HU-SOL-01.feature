# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-SOL-01
Característica: Pedir un equipo disponible
  Como empleado, quiero pedir un equipo disponible indicando la fecha en que lo devolveré, para que quede reservado a mi nombre y nadie más lo pida mientras IT me lo entrega.

  @HU-SOL-01-1 @positivo
  Escenario: HU-SOL-01 criterio 1 (positivo)
    Dado el equipo «Portátil 07» disponible, el 14 de noviembre de 2026 en Madrid, y la empleada ana.perez@empresa.com con sesión iniciada
    Cuando pide «Portátil 07» con devolución «2026-11-20»
    Entonces recibe 201 con «Portátil 07» reservado, la persona «ana.perez@empresa.com» y la devolución «2026-11-20»

  @HU-SOL-01-2 @negativo
  Escenario: HU-SOL-01 criterio 2 (negativo)
    Dado el equipo «Proyector 02» prestado a luis.gomez@empresa.com
    Cuando la empleada ana.perez@empresa.com lo pide con devolución «2026-11-20»
    Entonces recibe 409 con el error «El equipo no está disponible» y «Proyector 02» sigue prestado a luis.gomez@empresa.com

  @HU-SOL-01-3 @negativo
  Escenario: HU-SOL-01 criterio 3 (negativo)
    Dado ningún equipo con el id «equipo-inexistente»
    Cuando la empleada ana.perez@empresa.com lo pide con devolución «2026-11-20»
    Entonces recibe 404 con el error «No existe el equipo»
