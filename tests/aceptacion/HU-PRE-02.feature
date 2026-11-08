# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-PRE-02
Característica: Prestar un equipo en el mostrador
  Como técnico de IT, quiero prestar un equipo disponible a quien viene al mostrador, para que el préstamo quede apuntado aunque la persona no lo haya pedido antes en la aplicación.

  @HU-PRE-02-1 @positivo
  Escenario: HU-PRE-02 criterio 1 (positivo)
    Dado el equipo «eq-7» disponible
    Cuando un técnico de IT envía POST /api/equipos/eq-7/prestamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «prestado», persona «ana.perez@empresa.com» y devolución «2026-11-20»

  @HU-PRE-02-2 @positivo
  Escenario: HU-PRE-02 criterio 2 (positivo)
    Dado hoy es 2026-11-09 en Madrid y el equipo «eq-7» disponible
    Cuando un técnico de IT envía POST /api/equipos/eq-7/prestamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-05"}
    Entonces recibe 201 con el equipo prestado hasta el 2026-11-05 y el préstamo aparece entre los vencidos

  @HU-PRE-02-3 @negativo
  Escenario: HU-PRE-02 criterio 3 (negativo)
    Dado el equipo «eq-7» disponible
    Cuando un técnico de IT envía POST /api/equipos/eq-7/prestamo con {"devolucion": "2026-11-20"}
    Entonces recibe 400 con {"error": "Faltan la persona o la fecha de devolución"}

  @HU-PRE-02-4 @negativo
  Escenario: HU-PRE-02 criterio 4 (negativo)
    Dado el equipo «eq-7» disponible
    Cuando un técnico de IT envía POST /api/equipos/eq-7/prestamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-02-30"}
    Entonces recibe 400 con {"error": "La fecha de devolución no es válida"}

  @HU-PRE-02-5 @negativo
  Escenario: HU-PRE-02 criterio 5 (negativo)
    Dado el equipo «eq-7» reservado por «luis.gomez@empresa.com»
    Cuando un técnico de IT envía POST /api/equipos/eq-7/prestamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 409 con {"error": "El equipo no está disponible"}

  @HU-PRE-02-6 @negativo
  Escenario: HU-PRE-02 criterio 6 (negativo)
    Dado no existe ningún equipo «eq-99»
    Cuando un técnico de IT envía POST /api/equipos/eq-99/prestamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 404 con {"error": "No existe el equipo"}
