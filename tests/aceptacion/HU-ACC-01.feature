# language: es
# Generado por Diverger desde .diverger/prestamo-de-equipos-de-oficina/backlog.json. No se edita a mano: se regenera.

@HU-ACC-01
Característica: Entrar con la cuenta de Google de la empresa
  Como empleado, quiero entrar en la aplicación con mi cuenta de Google de la empresa, para consultar y pedir equipos sin escribir a IT por correo.

  @HU-ACC-01-1 @positivo
  Escenario: HU-ACC-01 criterio 1 (positivo)
    Dado el empleado «luis.garcia@empresa.com» con un token de identidad de Google con el correo verificado y emitido para el cliente OAuth de la aplicación
    Cuando consulta los equipos con GET /api/equipos
    Entonces recibe 200 con la lista de equipos y sus operaciones quedan a nombre de «luis.garcia@empresa.com»

  @HU-ACC-01-2 @negativo
  Escenario: HU-ACC-01 criterio 2 (negativo)
    Dado una petición sin token de identidad
    Cuando consulta los equipos con GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."} y no ve ningún equipo

  @HU-ACC-01-3 @negativo
  Escenario: HU-ACC-01 criterio 3 (negativo)
    Dado el correo «luis.garcia@empresa.com» con un token de Google emitido para otro cliente OAuth
    Cuando consulta los equipos con GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-4 @negativo
  Escenario: HU-ACC-01 criterio 4 (negativo)
    Dado un token de Google para el cliente OAuth de la aplicación con el correo «luis.garcia@empresa.com» sin verificar
    Cuando consulta los equipos con GET /api/equipos
    Entonces recibe 401 con {"error": "Inicia sesión con Google."}

  @HU-ACC-01-5 @negativo
  Escenario: HU-ACC-01 criterio 5 (negativo)
    Dado una petición sin token de identidad y «Portátil 07» disponible
    Cuando pide «Portátil 07» con {"devolucion": "2026-11-20"}
    Entonces recibe 401 con {"error": "Inicia sesión con Google."} y el equipo sigue disponible

  @HU-ACC-01-6 @positivo
  Escenario: HU-ACC-01 criterio 6 (positivo)
    Dado la cuenta de servicio del inventario con un token de identidad de Google válido para el cliente OAuth de la aplicación
    Cuando consulta los equipos con GET /api/equipos
    Entonces recibe 200 con la lista de equipos
