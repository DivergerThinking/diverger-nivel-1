# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-ACC-01
Característica: Entrar con la cuenta de Google de la empresa
  Como empleado, quiero entrar en la aplicación con mi cuenta de Google de la empresa, para que cada operación quede a mi nombre sin crear otra contraseña.

  @HU-ACC-01-1 @positivo
  Escenario: HU-ACC-01 criterio 1 (positivo)
    Dado un empleado con un token de identidad de Google de «luis.gomez@empresa.com», con el correo verificado y emitido para el cliente OAuth de la aplicación
    Cuando pide GET /api/equipos
    Entonces recibe 200 con la lista de equipos

  @HU-ACC-01-2 @positivo
  Escenario: HU-ACC-01 criterio 2 (positivo)
    Dado la cuenta de servicio del inventario de IT con un token de identidad de Google válido para el cliente OAuth de la aplicación
    Cuando pide GET /api/equipos
    Entonces recibe 200 con la lista de equipos

  @HU-ACC-01-3 @negativo
  Escenario: HU-ACC-01 criterio 3 (negativo)
    Dado un token de identidad de Google de «luis.gomez@empresa.com» emitido para otro cliente OAuth
    Cuando pide GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-4 @negativo
  Escenario: HU-ACC-01 criterio 4 (negativo)
    Dado un token de identidad de Google con el correo sin verificar
    Cuando pide GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}
