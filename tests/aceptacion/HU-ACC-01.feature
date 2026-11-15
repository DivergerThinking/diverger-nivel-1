# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-ACC-01
Característica: Entrar con la cuenta de Google de la empresa
  Como empleado, quiero usar la aplicación con mi cuenta de Google de la empresa, para que cada reserva y cada préstamo queden a nombre de quien los hace sin crear otra contraseña.

  @HU-ACC-01-1 @positivo
  Escenario: HU-ACC-01 criterio 1 (positivo)
    Dado un empleado con un token de identidad de Google de «ana.perez@empresa.com», con el correo verificado y emitido para el cliente OAuth de la aplicación, y el equipo «Portátil 07» disponible
    Cuando pide `POST /api/equipos/{id}/solicitud` de «Portátil 07» con `{"devolucion": "2026-11-20"}`
    Entonces recibe 201 con `persona` «ana.perez@empresa.com»

  @HU-ACC-01-2 @positivo
  Escenario: HU-ACC-01 criterio 2 (positivo)
    Dado la cuenta de servicio del inventario de IT con un token de identidad de Google válido, con el correo verificado y emitido para el cliente OAuth de la aplicación
    Cuando pide `GET /api/equipos`
    Entonces recibe 200 con la lista de equipos

  @HU-ACC-01-3 @negativo
  Escenario: HU-ACC-01 criterio 3 (negativo)
    Dado una petición sin token de identidad
    Cuando pide `GET /api/prestamos/vencidos`
    Entonces recibe 401 con `{"error": "Inicia sesión con Google."}`

  @HU-ACC-01-4 @negativo
  Escenario: HU-ACC-01 criterio 4 (negativo)
    Dado un token de identidad de Google de «luis.gomez@empresa.com» con el correo sin verificar
    Cuando pide `GET /api/equipos`
    Entonces recibe 401 con `{"error": "Inicia sesión con Google."}`

  @HU-ACC-01-5 @negativo
  Escenario: HU-ACC-01 criterio 5 (negativo)
    Dado un token de identidad de Google de «ana.perez@empresa.com» emitido para otro cliente OAuth
    Cuando pide `GET /api/equipos`
    Entonces recibe 401 con `{"error": "Inicia sesión con Google."}`
