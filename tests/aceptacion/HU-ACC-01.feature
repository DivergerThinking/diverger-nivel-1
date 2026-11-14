# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-ACC-01
Característica: Entrar con la cuenta de Google de la empresa
  Como empleado, quiero entrar en la aplicación con mi cuenta de Google de la empresa, para no tener que recordar otra contraseña y que cada operación quede asociada al correo de quien la hace.

  @HU-ACC-01-1 @positivo
  Escenario: HU-ACC-01 criterio 1 (positivo)
    Dado la empleada «ana.perez@empresa.com» con un token de identidad de Google con el correo verificado, emitido para el cliente OAuth de la aplicación
    Cuando consulta GET /api/equipos
    Entonces recibe 200 con la lista de equipos

  @HU-ACC-01-2 @negativo
  Escenario: HU-ACC-01 criterio 2 (negativo)
    Dado una petición sin token
    Cuando consulta GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-3 @negativo
  Escenario: HU-ACC-01 criterio 3 (negativo)
    Dado un token de Google de «ana.perez@empresa.com» emitido para otro cliente OAuth
    Cuando consulta GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}
