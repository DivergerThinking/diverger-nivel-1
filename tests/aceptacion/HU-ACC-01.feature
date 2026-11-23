# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-ACC-01
Característica: Entrar con la cuenta de Google de la empresa
  Como empleado, quiero entrar en la aplicación con mi cuenta de Google de la empresa, para consultar y pedir equipos sin crear ni recordar otra contraseña.

  @HU-ACC-01-1 @positivo
  Escenario: HU-ACC-01 criterio 1 (positivo)
    Dado el empleado «ana.perez@empresa.com» con un token de identidad de Google con el correo verificado y emitido para el cliente OAuth de la aplicación
    Cuando consulta la lista de equipos
    Entonces recibe 200 con la lista de equipos y las operaciones que haga quedan a nombre de «ana.perez@empresa.com»

  @HU-ACC-01-2 @negativo
  Escenario: HU-ACC-01 criterio 2 (negativo)
    Dado una petición sin token a «GET /api/equipos»
    Cuando llega a la aplicación
    Entonces recibe 401 con {"error": "Inicia sesión con Google."} y no ve ningún equipo

  @HU-ACC-01-3 @negativo
  Escenario: HU-ACC-01 criterio 3 (negativo)
    Dado un token de Google de «luis.garcia@empresa.com» con el correo sin verificar
    Cuando pide el equipo «Portátil 07» con devolución «2026-12-15»
    Entonces recibe 401 con {"error": "Inicia sesión con Google."} y el equipo sigue disponible

  @HU-ACC-01-4 @negativo
  Escenario: HU-ACC-01 criterio 4 (negativo)
    Dado un token de Google válido emitido para otro cliente OAuth distinto del de la aplicación
    Cuando consulta la lista de equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}
