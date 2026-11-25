# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-ACC-02
Característica: Reservar las operaciones de IT a sus cuentas
  Como técnico de IT, quiero restringir las operaciones de IT a las cuentas de la lista de IT, para evitar que un empleado haga lo que solo le toca a IT.

  @HU-ACC-02-1 @positivo
  Escenario: HU-ACC-02 criterio 1 (positivo)
    Dado CORREOS_IT con «it@empresa.com,inventario@empresa.com» y una sesión de «IT@empresa.com»
    Cuando consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con la lista de vencidos

  @HU-ACC-02-2 @negativo
  Escenario: HU-ACC-02 criterio 2 (negativo)
    Dado CORREOS_IT con «it@empresa.com» y una sesión de «ana.perez@empresa.com»
    Cuando envía POST /api/equipos con {"nombre": "Portátil 07"}
    Entonces la respuesta es 403 con {"error": "Solo IT puede hacer esto."} y no se crea ningún equipo

  @HU-ACC-02-3 @negativo
  Escenario: HU-ACC-02 criterio 3 (negativo)
    Dado CORREOS_IT con «it@empresa.com», una sesión de «ana.perez@empresa.com» y el equipo 42 reservado a ella
    Cuando envía POST /api/equipos/42/entrega
    Entonces la respuesta es 403 con {"error": "Solo IT puede hacer esto."} y el equipo 42 sigue reservado

  @HU-ACC-02-4 @positivo
  Escenario: HU-ACC-02 criterio 4 (positivo)
    Dado la cuenta de servicio del inventario «inventario@empresa.com» en CORREOS_IT
    Cuando envía POST /api/equipos/42/solicitud con {"devolucion": "2026-12-01"}
    Entonces recibe 201 con el equipo reservado a «inventario@empresa.com»
