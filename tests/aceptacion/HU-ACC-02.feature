# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-ACC-02
Característica: Reservar a IT las operaciones de IT
  Como técnico de IT, quiero limitar las operaciones de IT a las cuentas de la lista CORREOS_IT, para evitar que un empleado dé de alta, entregue o preste equipos por su cuenta.

  @HU-ACC-02-1 @positivo
  Escenario: HU-ACC-02 criterio 1 (positivo)
    Dado la variable CORREOS_IT con «IT@empresa.com,inventario@empresa.com» y un técnico con el token de «it@empresa.com»
    Cuando da de alta el equipo «Portátil 07»
    Entonces recibe 201 con el equipo «Portátil 07» en estado «disponible»

  @HU-ACC-02-2 @positivo
  Escenario: HU-ACC-02 criterio 2 (positivo)
    Dado la misma variable CORREOS_IT y la cuenta de servicio del inventario «inventario@empresa.com»
    Cuando pide el equipo «Monitor 03» con devolución «2026-12-15»
    Entonces recibe 201 con el equipo en estado «reservado» a nombre de «inventario@empresa.com»

  @HU-ACC-02-3 @negativo
  Escenario: HU-ACC-02 criterio 3 (negativo)
    Dado la misma variable CORREOS_IT y el empleado «ana.perez@empresa.com», que no está en ella
    Cuando da de alta el equipo «Proyector 01»
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y el equipo no se crea

  @HU-ACC-02-4 @negativo
  Escenario: HU-ACC-02 criterio 4 (negativo)
    Dado el empleado «ana.perez@empresa.com» y el equipo «Portátil 07» prestado
    Cuando consulta los préstamos vencidos
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."}
