# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-ACC-02
Característica: Reservar a IT las operaciones de IT
  Como técnico de IT, quiero limitar las operaciones «Solo IT» a las cuentas de CORREOS_IT, para evitar que un empleado entregue o dé por devuelto un equipo ajeno.

  @HU-ACC-02-1 @positivo
  Escenario: HU-ACC-02 criterio 1 (positivo)
    Dado CORREOS_IT con «it.soporte@empresa.com,inventario@empresa.iam.gserviceaccount.com» y una sesión de «IT.Soporte@empresa.com»
    Cuando da de alta el equipo «Monitor 03»
    Entonces recibe 201 con el equipo «Monitor 03» en estado «disponible»

  @HU-ACC-02-2 @negativo
  Escenario: HU-ACC-02 criterio 2 (negativo)
    Dado CORREOS_IT con «it.soporte@empresa.com» y una sesión de la empleada «lucia.gomez@empresa.com»
    Cuando da de alta el equipo «Monitor 03»
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y el equipo no se crea

  @HU-ACC-02-3 @negativo
  Escenario: HU-ACC-02 criterio 3 (negativo)
    Dado CORREOS_IT con «it.soporte@empresa.com» y una sesión de la empleada «lucia.gomez@empresa.com»
    Cuando pide los préstamos vencidos
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."}

  @HU-ACC-02-4 @positivo
  Escenario: HU-ACC-02 criterio 4 (positivo)
    Dado CORREOS_IT con «inventario@empresa.iam.gserviceaccount.com», una sesión de esa cuenta y el equipo «Portátil 07» disponible
    Cuando pide el equipo «Portátil 07» con la devolución «2030-06-15»
    Entonces recibe 201 con el equipo en estado «reservado» y la persona «inventario@empresa.iam.gserviceaccount.com»
