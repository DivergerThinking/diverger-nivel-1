# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-ACC-02
Característica: Reservar las operaciones de IT a sus cuentas
  Como técnico de IT, quiero hacer las operaciones de IT con mi cuenta de la lista CORREOS_IT, para que un empleado no pueda dar de alta, entregar ni prestar equipos por su cuenta.

  @HU-ACC-02-1 @positivo
  Escenario: HU-ACC-02 criterio 1 (positivo)
    Dado CORREOS_IT con el valor «it@empresa.com,inventario@empresa.com» y una sesión de «IT@Empresa.com»
    Cuando consulta GET /api/prestamos/vencidos
    Entonces recibe 200 con la lista de préstamos vencidos

  @HU-ACC-02-2 @negativo
  Escenario: HU-ACC-02 criterio 2 (negativo)
    Dado CORREOS_IT con el valor «it@empresa.com» y una sesión de la empleada «ana.perez@empresa.com»
    Cuando envía POST /api/equipos con {"nombre": "Portátil 07"}
    Entonces recibe 403 con {"error": "Solo IT puede hacer esto."} y no se crea ningún equipo
