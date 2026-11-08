# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-ACC-01
Característica: Entrar con la cuenta de Google de la empresa
  Como empleado, quiero usar la aplicación con mi cuenta de Google de la empresa, para que solo las personas de la empresa vean y pidan equipos, sin otra contraseña que recordar.

  @HU-ACC-01-1 @positivo
  Escenario: HU-ACC-01 criterio 1 (positivo)
    Dado la empleada «ana.perez@empresa.com» con un token de Google válido, con el correo verificado y emitido para el cliente OAuth de la aplicación
    Cuando consulta GET /api/equipos
    Entonces recibe 200 con la lista de equipos

  @HU-ACC-01-2 @negativo
  Escenario: HU-ACC-01 criterio 2 (negativo)
    Dado una petición sin token de Google
    Cuando llega a GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-3 @positivo
  Escenario: HU-ACC-01 criterio 3 (positivo)
    Dado la cuenta de servicio del inventario «inventario@empresa.com» con un token de Google válido, con el correo verificado y emitido para el cliente OAuth de la aplicación
    Cuando consulta GET /api/equipos
    Entonces recibe 200 con la lista de equipos

  @HU-ACC-01-4 @negativo
  Escenario: HU-ACC-01 criterio 4 (negativo)
    Dado un token de Google de «ana.perez@empresa.com» con el correo sin verificar
    Cuando llega a GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-5 @negativo
  Escenario: HU-ACC-01 criterio 5 (negativo)
    Dado un token de Google emitido para otro cliente OAuth
    Cuando llega a POST /api/equipos/eq-1/solicitud
    Entonces recibe 401 con {"error": "Inicia sesión con Google."} y el equipo «eq-1» sigue disponible
