# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it-2/backlog.json. No se edita a mano: se regenera.

@HU-ACC-02
Característica: Reservar las operaciones de IT a las cuentas de IT
  Como persona de IT, quiero que solo las cuentas de la lista de IT puedan hacer las operaciones de IT, para que ningún empleado dé de alta, entregue o preste equipos por su cuenta.

  @HU-ACC-02-1 @positivo
  Escenario: HU-ACC-02 criterio 1 (positivo)
    Dado la variable CORREOS_IT con «it@empresa.com,inventario@empresa.com» y la persona de IT con un token válido de «IT@empresa.com»
    Cuando envía POST /api/equipos con {"nombre": "Portátil 07"}
    Entonces recibe 201 con el equipo «Portátil 07» en estado «disponible»

  @HU-ACC-02-2 @positivo
  Escenario: HU-ACC-02 criterio 2 (positivo)
    Dado la misma variable CORREOS_IT y la cuenta de servicio «inventario@empresa.com» con un token válido ante el equipo disponible «Monitor 03»
    Cuando envía POST /api/equipos/{id}/solicitud con {"devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo en estado «reservado» a nombre de «inventario@empresa.com»

  @HU-ACC-02-3 @negativo
  Escenario: HU-ACC-02 criterio 3 (negativo)
    Dado la misma variable CORREOS_IT y la empleada «ana.perez@empresa.com» con un token válido
    Cuando envía POST /api/equipos con {"nombre": "Portátil 08"}
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y no se crea el equipo
