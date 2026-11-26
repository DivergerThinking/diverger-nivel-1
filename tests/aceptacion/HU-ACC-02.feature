# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-ACC-02
Característica: Reservar a IT sus operaciones
  Como técnico de IT, quiero ser el único que puede hacer las operaciones de IT, para evitar que un empleado entregue, preste o devuelva equipos por su cuenta.

  @HU-ACC-02-1 @positivo
  Escenario: HU-ACC-02 criterio 1 (positivo)
    Dado CORREOS_IT con el valor «it@empresa.com,inventario@empresa.com» y una sesión de IT.Empresa@empresa.com
    Cuando envía POST /api/equipos con {"nombre": "Monitor 03"}
    Entonces recibe 201 con el equipo «Monitor 03» en estado «disponible»

  @HU-ACC-02-2 @positivo
  Escenario: HU-ACC-02 criterio 2 (positivo)
    Dado CORREOS_IT con el valor «it@empresa.com,inventario@empresa.com» y la cuenta de servicio inventario@empresa.com
    Cuando consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con la lista de vencidos

  @HU-ACC-02-3 @negativo
  Escenario: HU-ACC-02 criterio 3 (negativo)
    Dado CORREOS_IT con el valor «it@empresa.com» y una sesión de ana.perez@empresa.com
    Cuando consulta GET /api/prestamos/vencidos
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."}

  @HU-ACC-02-4 @negativo
  Escenario: HU-ACC-02 criterio 4 (negativo)
    Dado CORREOS_IT con el valor «it@empresa.com» y una sesión de ana.perez@empresa.com
    Cuando envía POST /api/equipos con {"nombre": "Monitor 03"}
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y el equipo no se crea
