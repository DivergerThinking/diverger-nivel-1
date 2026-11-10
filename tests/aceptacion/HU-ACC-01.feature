# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-it/backlog.json. No se edita a mano: se regenera.

@HU-ACC-01
Característica: Entrar con la cuenta de Google de la empresa
  Como empleado, quiero entrar en la aplicación con mi cuenta de Google de la empresa, para usarla sin crear ni recordar otra contraseña.

  @HU-ACC-01-1 @positivo
  Escenario: HU-ACC-01 criterio 1 (positivo)
    Dado la empleada «ana.perez@empresa.com» con un token de identidad de Google válido, con el correo verificado y emitido para el cliente OAuth de la aplicación
    Cuando consulta la lista de equipos con GET /api/equipos
    Entonces recibe 200 con la lista de equipos

  @HU-ACC-01-2 @positivo
  Escenario: HU-ACC-01 criterio 2 (positivo)
    Dado la cuenta de servicio del inventario de IT con un token de identidad de Google válido emitido para el cliente OAuth de la aplicación
    Cuando consulta la lista de equipos con GET /api/equipos
    Entonces recibe 200 con la lista de equipos

  @HU-ACC-01-3 @negativo
  Escenario: HU-ACC-01 criterio 3 (negativo)
    Dado una petición sin token de identidad
    Cuando consulta la lista de equipos con GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-4 @negativo
  Escenario: HU-ACC-01 criterio 4 (negativo)
    Dado la empleada «ana.perez@empresa.com» con un token de Google emitido para otro cliente OAuth
    Cuando consulta la lista de equipos con GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-5 @negativo
  Escenario: HU-ACC-01 criterio 5 (negativo)
    Dado la cuenta «ana.perez@empresa.com» con un token de Google emitido para el cliente OAuth de la aplicación, pero con el correo sin verificar
    Cuando consulta la lista de equipos con GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-6 @negativo
  Escenario: HU-ACC-01 criterio 6 (negativo)
    Dado la empleada «ana.perez@empresa.com» con un token de Google caducado
    Cuando consulta la lista de equipos con GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-7 @negativo
  Escenario: HU-ACC-01 criterio 7 (negativo)
    Dado una petición sin token de identidad y «Portátil 07» disponible
    Cuando pide «Portátil 07» con POST /api/equipos/{id}/solicitud y {"devolucion": "2026-11-20"}
    Entonces recibe 401 con {"error": "Inicia sesión con Google."} y el equipo sigue disponible
