# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-la-oficina/backlog.json. No se edita a mano: se regenera.

@HU-ACC-01
Característica: Iniciar sesión con Google
  Como empleado, quiero entrar en la aplicación con mi cuenta de Google de la empresa, para no tener que crear ni recordar otra contraseña.

  @HU-ACC-01-1 @positivo
  Escenario: HU-ACC-01 criterio 1 (positivo)
    Dado la empleada ana.perez@empresa.com con un token de Google válido y el correo verificado
    Cuando consulta GET /api/equipos
    Entonces recibe 200 con la lista de equipos

  @HU-ACC-01-2 @positivo
  Escenario: HU-ACC-01 criterio 2 (positivo)
    Dado la empleada ana.perez@empresa.com con un token de Google válido y el «Portátil 07» disponible
    Cuando envía POST /api/equipos/{id}/solicitud con {"devolucion": "2026-12-10"}
    Entonces el equipo queda reservado con la persona ana.perez@empresa.com, el correo del token

  @HU-ACC-01-3 @negativo
  Escenario: HU-ACC-01 criterio 3 (negativo)
    Dado un token de Google cuyo correo no está verificado
    Cuando consulta GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-4 @negativo
  Escenario: HU-ACC-01 criterio 4 (negativo)
    Dado un token de Google caducado
    Cuando consulta GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-5 @negativo
  Escenario: HU-ACC-01 criterio 5 (negativo)
    Dado una petición sin token
    Cuando consulta GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-6 @negativo
  Escenario: HU-ACC-01 criterio 6 (negativo)
    Dado un token de Google emitido para otro cliente OAuth
    Cuando consulta GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}
