# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@EN-ACC-01
Característica: Limitar a IT las operaciones de IT
  Como equipo, quiero restringir a las cuentas de `CORREOS_IT` las operaciones marcadas «Solo IT», para que ningún empleado pueda dar de alta, entregar, prestar, apuntar devoluciones ni consultar vencidos e historial.

  @EN-ACC-01-1 @positivo
  Escenario: EN-ACC-01 criterio 1 (positivo)
    Dado la variable `CORREOS_IT` con «it@empresa.com,inventario@empresa.com» y un técnico de IT con sesión de «IT@empresa.com»
    Cuando pide `GET /api/prestamos/vencidos`
    Entonces recibe 200 con la lista de préstamos vencidos

  @EN-ACC-01-2 @positivo
  Escenario: EN-ACC-01 criterio 2 (positivo)
    Dado la misma `CORREOS_IT` y la cuenta de servicio «inventario@empresa.com» con sesión, ante el equipo «Monitor 03» disponible
    Cuando pide `POST /api/equipos/{id}/solicitud` de «Monitor 03» con `{"devolucion": "2026-11-20"}`
    Entonces recibe 201 con `estado: "reservado"` y `persona` «inventario@empresa.com»

  @EN-ACC-01-3 @negativo
  Escenario: EN-ACC-01 criterio 3 (negativo)
    Dado la misma `CORREOS_IT` y un empleado con sesión de «ana.perez@empresa.com»
    Cuando pide `POST /api/equipos` con `{"nombre": "Portátil 08"}`
    Entonces recibe 403 con `{"error": "Solo IT puede hacer esto."}` y no se crea ningún equipo
