# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-PRE-02
Característica: Apuntar la devolución de un equipo
  Como técnico de IT, quiero apuntar que un equipo prestado se ha devuelto, para que vuelva a estar libre para el siguiente empleado y deje de contar como vencido.

  @HU-PRE-02-1 @positivo
  Escenario: HU-PRE-02 criterio 1 (positivo)
    Dado el equipo «Portátil 07» prestado a «ana.perez@empresa.com» con devolución «2026-11-20»
    Cuando la cuenta de IT «it@empresa.com» envía POST /api/equipos/{id}/devolucion
    Entonces recibe 200 con el equipo en estado «disponible», sin persona ni devolución

  @HU-PRE-02-2 @negativo
  Escenario: HU-PRE-02 criterio 2 (negativo)
    Dado el equipo «Monitor 03» reservado por «luis.gomez@empresa.com»
    Cuando la cuenta de IT «it@empresa.com» envía POST /api/equipos/{id}/devolucion
    Entonces recibe 409 con {"error": "El equipo no está prestado"} y la reserva sigue igual

  @HU-PRE-02-3 @negativo
  Escenario: HU-PRE-02 criterio 3 (negativo)
    Dado ningún equipo con el id «no-existe»
    Cuando la cuenta de IT «it@empresa.com» envía POST /api/equipos/no-existe/devolucion
    Entonces recibe 404 con {"error": "No existe el equipo"}
