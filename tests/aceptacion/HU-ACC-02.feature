# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-ACC-02
Característica: Reservar las operaciones de IT a las cuentas de IT
  Como técnico de IT, quiero que solo las cuentas de la lista de IT puedan dar de alta, entregar, prestar, apuntar devoluciones y consultar vencidos e historial, para evitar que un empleado haga lo que solo le toca a IT.

  @HU-ACC-02-1 @positivo
  Escenario: HU-ACC-02 criterio 1 (positivo)
    Dado CORREOS_IT con «it@empresa.com,Inventario@empresa.com» y un token de «inventario@empresa.com»
    Cuando envía POST /api/equipos con {"nombre": "Portátil 08"}
    Entonces recibe 201 con el equipo «Portátil 08» disponible

  @HU-ACC-02-2 @negativo
  Escenario: HU-ACC-02 criterio 2 (negativo)
    Dado CORREOS_IT con «it@empresa.com» y un token de «ana.perez@empresa.com»
    Cuando envía POST /api/equipos con {"nombre": "Portátil 08"}
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y no se crea ningún equipo

  @HU-ACC-02-3 @negativo
  Escenario: HU-ACC-02 criterio 3 (negativo)
    Dado CORREOS_IT con «it@empresa.com» y un token de «ana.perez@empresa.com»
    Cuando pide GET /api/prestamos/vencidos
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."}

  @HU-ACC-02-4 @negativo
  Escenario: HU-ACC-02 criterio 4 (negativo)
    Dado CORREOS_IT con «it@empresa.com», un token de «ana.perez@empresa.com» y el equipo «Portátil 07» reservado a «luis.gomez@empresa.com»
    Cuando envía POST /api/equipos/{id}/entrega
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y el equipo sigue reservado

  @HU-ACC-02-5 @negativo
  Escenario: HU-ACC-02 criterio 5 (negativo)
    Dado CORREOS_IT con «it@empresa.com», un token de «ana.perez@empresa.com» y el equipo «Monitor 03» disponible
    Cuando envía POST /api/equipos/{id}/prestamo con {"persona": "ana.perez@empresa.com", "devolucion": "2026-11-20"}
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y el equipo sigue disponible

  @HU-ACC-02-6 @negativo
  Escenario: HU-ACC-02 criterio 6 (negativo)
    Dado CORREOS_IT con «it@empresa.com», un token de «ana.perez@empresa.com» y el equipo «Proyector 02» prestado a «ana.perez@empresa.com»
    Cuando envía POST /api/equipos/{id}/devolucion
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y el equipo sigue prestado

  @HU-ACC-02-7 @negativo
  Escenario: HU-ACC-02 criterio 7 (negativo)
    Dado CORREOS_IT con «it@empresa.com» y un token de «ana.perez@empresa.com»
    Cuando pide GET /api/equipos/{id}/historial de «Portátil 07»
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."}
