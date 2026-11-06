# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-ACC-02
Característica: Reservar a IT sus operaciones
  Como técnico de IT, quiero que solo las cuentas de la lista CORREOS_IT puedan hacer las operaciones de IT, para evitar que un empleado dé de alta, entregue o preste equipos por su cuenta.

  @HU-ACC-02-1 @positivo
  Escenario: HU-ACC-02 criterio 1 (positivo)
    Dado CORREOS_IT con el valor «it@empresa.com,inventario@empresa.com» y la cuenta «IT@empresa.com» con sesión iniciada
    Cuando consulta los préstamos vencidos con GET /api/prestamos/vencidos
    Entonces recibe 200, porque los correos se comparan sin distinguir mayúsculas

  @HU-ACC-02-2 @negativo
  Escenario: HU-ACC-02 criterio 2 (negativo)
    Dado el empleado «luis.garcia@empresa.com», que no está en CORREOS_IT, con sesión iniciada
    Cuando da de alta el equipo «Portátil 08» con POST /api/equipos
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y el equipo no se crea

  @HU-ACC-02-3 @positivo
  Escenario: HU-ACC-02 criterio 3 (positivo)
    Dado la cuenta de servicio «inventario@empresa.com», incluida en CORREOS_IT, y «Monitor 03» disponible
    Cuando pide «Monitor 03» con devolución «2026-11-20» como haría un empleado
    Entonces recibe 201 con «Monitor 03» reservado a «inventario@empresa.com»
