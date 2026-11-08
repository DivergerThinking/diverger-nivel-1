# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-ACC-02
Característica: Reservar las operaciones de IT a sus cuentas
  Como técnico de IT, quiero que solo las cuentas de la lista CORREOS_IT puedan hacer las operaciones de IT, para evitar que un empleado cambie el estado de un equipo que no le corresponde.

  @HU-ACC-02-1 @positivo
  Escenario: HU-ACC-02 criterio 1 (positivo)
    Dado CORREOS_IT con «it@empresa.com,inventario@empresa.com» y un token de «IT@empresa.com»
    Cuando da de alta el equipo «Portátil 07» con POST /api/equipos
    Entonces recibe 201 y el equipo queda dado de alta

  @HU-ACC-02-2 @negativo
  Escenario: HU-ACC-02 criterio 2 (negativo)
    Dado CORREOS_IT con «it@empresa.com,inventario@empresa.com» y un token de «ana.perez@empresa.com»
    Cuando intenta dar de alta el equipo «Portátil 07» con POST /api/equipos
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y no se crea ningún equipo

  @HU-ACC-02-3 @positivo
  Escenario: HU-ACC-02 criterio 3 (positivo)
    Dado la cuenta de servicio «inventario@empresa.com», incluida en CORREOS_IT, y el equipo «Portátil 08» disponible
    Cuando pide «Portátil 08» con devolución «2026-11-20»
    Entonces recibe 201 con el equipo reservado a «inventario@empresa.com»
