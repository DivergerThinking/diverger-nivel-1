# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-ACC-02
Característica: Reservar las operaciones de IT a sus cuentas
  Como técnico de IT, quiero limitar las operaciones de IT a las cuentas de la lista CORREOS_IT, para que ningún empleado pueda dar de alta, entregar, prestar o devolver equipos.

  @HU-ACC-02-1 @positivo
  Escenario: HU-ACC-02 criterio 1 (positivo)
    Dado CORREOS_IT con «it.soporte@empresa.com,inventario@empresa.com» y un técnico con sesión iniciada como «IT.Soporte@empresa.com»
    Cuando pide POST /api/equipos con {"nombre": "Portátil 08"}
    Entonces recibe 201 con el equipo «Portátil 08» disponible

  @HU-ACC-02-2 @positivo
  Escenario: HU-ACC-02 criterio 2 (positivo)
    Dado CORREOS_IT con «inventario@empresa.com», la cuenta de servicio «inventario@empresa.com» con sesión iniciada y el equipo «Monitor 05» disponible
    Cuando pide la solicitud de «Monitor 05» con {"devolucion": "2026-11-20"}
    Entonces recibe 201 con el equipo reservado a «inventario@empresa.com»

  @HU-ACC-02-3 @negativo
  Escenario: HU-ACC-02 criterio 3 (negativo)
    Dado CORREOS_IT con «it.soporte@empresa.com» y un empleado con sesión iniciada como «luis.gomez@empresa.com»
    Cuando pide POST /api/equipos/{id}/devolucion de «Monitor 03»
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y el equipo no cambia
