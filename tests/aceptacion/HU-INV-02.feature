# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-INV-02
Característica: Consultar el historial de un equipo
  Como técnico de IT, quiero consultar el historial de préstamos de un equipo, para saber quién ha tenido el equipo y cuándo debía devolverlo.

  @HU-INV-02-1 @positivo
  Escenario: HU-INV-02 criterio 1 (positivo)
    Dado un técnico de IT con sesión y el equipo «Portátil 07», prestado antes a «luis.gomez@empresa.com» con devolución «2026-11-10» y ya devuelto, y ahora reservado por «ana.perez@empresa.com» con devolución «2026-11-20»
    Cuando pide `GET /api/equipos/{id}/historial` de «Portátil 07»
    Entonces recibe 200 con dos préstamos en este orden: «ana.perez@empresa.com», «2026-11-20», `reservado`; y «luis.gomez@empresa.com», «2026-11-10», `devuelto`

  @HU-INV-02-2 @negativo
  Escenario: HU-INV-02 criterio 2 (negativo)
    Dado un técnico de IT con sesión
    Cuando pide `GET /api/equipos/{id}/historial` con un id que no corresponde a ningún equipo
    Entonces recibe 404 con `{"error": "No existe el equipo"}`

  @HU-INV-02-3 @negativo
  Escenario: HU-INV-02 criterio 3 (negativo)
    Dado un empleado con sesión de «ana.perez@empresa.com», que no está en `CORREOS_IT`
    Cuando pide `GET /api/equipos/{id}/historial` de «Portátil 07»
    Entonces recibe 403 con `{"error": "Solo IT puede hacer esto."}`
