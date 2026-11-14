# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-01
Característica: Entregar un equipo reservado
  Como técnico de IT, quiero entregar un equipo reservado a quien lo pidió, para que la aplicación refleje quién tiene el equipo y hasta cuándo sin apuntarlo en la hoja de cálculo.

  @HU-PRE-01-1 @positivo
  Escenario: HU-PRE-01 criterio 1 (positivo)
    Dado el equipo «Portátil 07» reservado por ana.perez@empresa.com con devolución «2026-11-20»
    Cuando un técnico de IT apunta la entrega de «Portátil 07»
    Entonces recibe 200 con «Portátil 07» prestado a «ana.perez@empresa.com» con devolución «2026-11-20»

  @HU-PRE-01-2 @negativo
  Escenario: HU-PRE-01 criterio 2 (negativo)
    Dado el equipo «Monitor 03» disponible
    Cuando un técnico de IT apunta la entrega de «Monitor 03»
    Entonces recibe 409 con el error «El equipo no está reservado» y «Monitor 03» sigue disponible

  @HU-PRE-01-3 @negativo
  Escenario: HU-PRE-01 criterio 3 (negativo)
    Dado CORREOS_IT con «it@empresa.com,soporte@empresa.com», el equipo «Portátil 07» reservado y la empleada ana.perez@empresa.com con sesión iniciada
    Cuando apunta la entrega de «Portátil 07»
    Entonces recibe 403 con el error «Solo IT puede hacer esto.» y «Portátil 07» sigue reservado

  @HU-PRE-01-4 @negativo
  Escenario: HU-PRE-01 criterio 4 (negativo)
    Dado ningún equipo con el id «equipo-inexistente»
    Cuando un técnico de IT apunta la entrega de «equipo-inexistente»
    Entonces recibe 404 con el error «No existe el equipo»
