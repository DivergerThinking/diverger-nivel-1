# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-ACC-02
Característica: Reservar las operaciones de IT a sus cuentas
  Como técnico de IT, quiero limitar las operaciones de IT a las cuentas de la lista CORREOS_IT, para que ningún empleado pueda dar de alta, entregar, prestar o devolver equipos por su cuenta.

  @HU-ACC-02-1 @positivo
  Escenario: HU-ACC-02 criterio 1 (positivo)
    Dado la variable CORREOS_IT con «it.soporte@empresa.com,inventario@empresa.com» y la cuenta «IT.Soporte@empresa.com» con sesión iniciada
    Cuando da de alta el equipo «Proyector 02» con POST /api/equipos
    Entonces recibe 201 y el equipo «Proyector 02» queda disponible, porque los correos se comparan sin distinguir mayúsculas

  @HU-ACC-02-2 @positivo
  Escenario: HU-ACC-02 criterio 2 (positivo)
    Dado la cuenta de servicio «inventario@empresa.com», incluida en CORREOS_IT, con sesión iniciada y el equipo «Portátil 07» disponible
    Cuando pide «Portátil 07» con devolución «2026-11-20»
    Entonces recibe 201 y el equipo queda reservado a «inventario@empresa.com»

  @HU-ACC-02-3 @negativo
  Escenario: HU-ACC-02 criterio 3 (negativo)
    Dado la variable CORREOS_IT con «it.soporte@empresa.com,inventario@empresa.com» y la cuenta «it.soporte@otra-empresa.com» con sesión iniciada
    Cuando da de alta el equipo «Proyector 02» con POST /api/equipos
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y no se crea ningún equipo
